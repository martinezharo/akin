/** @vitest-environment edge-runtime */
/// <reference types="vite/client" />

import betterAuthTest from "@convex-dev/better-auth/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, components } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

/** The friends board ranks by the current week, so every query carries a day. */
const TODAY = "2026-07-25";

async function createUser(t: ReturnType<typeof convexTest>, username: string) {
	const now = Date.now();
	const user = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: username,
				email: `${username}@example.test`,
				emailVerified: true,
				createdAt: now,
				updatedAt: now,
			},
		},
	});
	const session = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: "session",
			data: {
				userId: user._id,
				token: `token-${username}`,
				expiresAt: now + 60_000,
				createdAt: now,
				updatedAt: now,
			},
		},
	});
	const profileId = await t.run(async (ctx) => {
		const id = await ctx.db.insert("profiles", {
			userId: user._id,
			displayName: username,
			username,
			email: `${username}@example.test`,
			petSkin: "ember",
			petHair: "honey",
			ownedPetSkins: ["ember"],
			timeZone: "Europe/Madrid",
			lastReviewedOn: "2026-07-24",
			recentIcons: [],
			importedLocalDataAt: now,
			createdAt: now,
			updatedAt: now,
		});
		await ctx.db.insert("wallets", {
			userId: user._id,
			balance: 20,
			lifetimeEarned: 20,
			xp: 42,
			updatedAt: now,
		});
		return id;
	});
	return {
		profileId,
		userId: user._id,
		asUser: t.withIdentity({
			subject: user._id,
			sessionId: session._id,
			name: user.name,
			email: user.email,
		}),
	};
}

describe("friend requests", () => {
	it("moves a request from pending to an accepted friendship", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const nova = await createUser(t, "nova");
		const milo = await createUser(t, "milo");

		await nova.asUser.mutation(api.friendships.send, { profileId: milo.profileId });
		expect((await nova.asUser.query(api.friendships.list, { today: TODAY })).outgoing[0]?.username).toBe("milo");
		const incoming = (await milo.asUser.query(api.friendships.list, { today: TODAY })).incoming;
		expect(incoming[0]?.username).toBe("nova");

		await milo.asUser.mutation(api.friendships.respond, {
			requestId: incoming[0]!.requestId,
			accept: true,
		});

		expect((await nova.asUser.query(api.friendships.list, { today: TODAY })).friends[0]?.username).toBe("milo");
		expect((await milo.asUser.query(api.friendships.list, { today: TODAY })).friends[0]?.username).toBe("nova");
		expect((await nova.asUser.query(api.users.searchByUsername, { username: "milo", today: TODAY }))[0]?.relationship)
			.toBe("friends");
	});

	it("only lets the recipient respond to a pending request", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const nova = await createUser(t, "nova");
		const milo = await createUser(t, "milo");
		const ivy = await createUser(t, "ivy");

		await nova.asUser.mutation(api.friendships.send, { profileId: milo.profileId });
		const requestId = (await milo.asUser.query(api.friendships.list, { today: TODAY })).incoming[0]!.requestId;

		await expect(
			ivy.asUser.mutation(api.friendships.respond, { requestId, accept: true }),
		).rejects.toThrow("no longer available");
		expect((await milo.asUser.query(api.friendships.list, { today: TODAY })).incoming).toHaveLength(1);
	});
});

describe("weekly XP", () => {
	/** Stamps a reward on a local day, the way a completed check-in would. */
	async function award(t: ReturnType<typeof convexTest>, userId: string, localDate: string) {
		await t.run(async (ctx) => {
			const now = Date.now();
			const streakId = await ctx.db.insert("streaks", {
				userId,
				clientId: `streak-${localDate}`,
				name: "Move",
				icon: "🏃",
				days: 1,
				createdOn: "2026-07-01",
				rewardEligible: true,
				sortOrder: 0,
				createdAt: now,
				updatedAt: now,
			});
			const checkInId = await ctx.db.insert("checkIns", {
				userId,
				streakId,
				localDate,
				completedAt: now,
				source: "today",
			});
			await ctx.db.insert("coinLedger", {
				userId,
				checkInId,
				streakId,
				localDate,
				amount: 1,
				reason: "streak_completion",
				createdAt: now,
			});
		});
	}

	it("counts only the rolling week, and ranks apart from lifetime XP", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const nova = await createUser(t, "nova");
		const milo = await createUser(t, "milo");

		await nova.asUser.mutation(api.friendships.send, { profileId: milo.profileId });
		const incoming = (await milo.asUser.query(api.friendships.list, { today: TODAY })).incoming;
		await milo.asUser.mutation(api.friendships.respond, { requestId: incoming[0]!.requestId, accept: true });

		// The window is today plus the six days before it: 07-19 is the first day
		// inside it and 07-18 is the last day outside.
		await award(t, milo.userId, TODAY);
		await award(t, milo.userId, "2026-07-19");
		await award(t, milo.userId, "2026-07-18");

		const friend = (await nova.asUser.query(api.friendships.list, { today: TODAY })).friends[0]!;
		expect(friend.weeklyXp).toBe(2);
		// Lifetime XP comes from the wallet and is untouched by the window.
		expect(friend.xp).toBe(42);

		const found = (await nova.asUser.query(api.users.searchByUsername, { username: "milo", today: TODAY }))[0]!;
		expect(found.weeklyXp).toBe(2);
	});

	it("reports a quiet week as zero", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const nova = await createUser(t, "nova");
		await createUser(t, "milo");

		const found = (await nova.asUser.query(api.users.searchByUsername, { username: "milo", today: TODAY }))[0]!;
		expect(found.weeklyXp).toBe(0);
		expect(found.xp).toBe(42);
	});
});
