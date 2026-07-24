/** @vitest-environment edge-runtime */
/// <reference types="vite/client" />

import betterAuthTest from "@convex-dev/better-auth/test";
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, components } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

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
		expect((await nova.asUser.query(api.friendships.list)).outgoing[0]?.username).toBe("milo");
		const incoming = (await milo.asUser.query(api.friendships.list)).incoming;
		expect(incoming[0]?.username).toBe("nova");

		await milo.asUser.mutation(api.friendships.respond, {
			requestId: incoming[0]!.requestId,
			accept: true,
		});

		expect((await nova.asUser.query(api.friendships.list)).friends[0]?.username).toBe("milo");
		expect((await milo.asUser.query(api.friendships.list)).friends[0]?.username).toBe("nova");
		expect((await nova.asUser.query(api.users.searchByUsername, { username: "milo" }))[0]?.relationship)
			.toBe("friends");
	});

	it("only lets the recipient respond to a pending request", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const nova = await createUser(t, "nova");
		const milo = await createUser(t, "milo");
		const ivy = await createUser(t, "ivy");

		await nova.asUser.mutation(api.friendships.send, { profileId: milo.profileId });
		const requestId = (await milo.asUser.query(api.friendships.list)).incoming[0]!.requestId;

		await expect(
			ivy.asUser.mutation(api.friendships.respond, { requestId, accept: true }),
		).rejects.toThrow("no longer available");
		expect((await milo.asUser.query(api.friendships.list)).incoming).toHaveLength(1);
	});
});
