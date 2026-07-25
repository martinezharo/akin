/** @vitest-environment edge-runtime */
/// <reference types="vite/client" />

import betterAuthTest from "@convex-dev/better-auth/test";
import { convexTest } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { addLocalDays } from "./lib/dates";
import { UNDO_WINDOW_MS } from "./lib/undo";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const TODAY = "2026-07-23";
const TIME_ZONE = "Europe/Madrid";

async function createAuthenticatedTestUser(
	t: ReturnType<typeof convexTest>,
	label: string,
) {
	const now = Date.now();
	const user = await t.mutation(components.betterAuth.adapter.create, {
		input: {
			model: "user",
			data: {
				name: label,
				email: `${label.toLowerCase()}@example.test`,
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
				token: `token-${label}`,
				expiresAt: now + 60_000,
				createdAt: now,
				updatedAt: now,
			},
		},
	});
	return {
		user,
		asUser: t.withIdentity({
			subject: user._id,
			sessionId: session._id,
			name: user.name,
			email: user.email,
		}),
	};
}

async function createReadyAccount(
	t: ReturnType<typeof convexTest>,
	userId: string,
	lastReviewedOn = TODAY,
) {
	const now = Date.now();
	return await t.run(async (ctx) => {
		const profileId = await ctx.db.insert("profiles", {
			userId,
			displayName: "Test user",
			email: "test@example.test",
			petSkin: "ember",
			petHair: "honey",
			ownedPetSkins: ["ember"],
			timeZone: TIME_ZONE,
			lastReviewedOn,
			recentIcons: [],
			importedLocalDataAt: now,
			createdAt: now,
			updatedAt: now,
		});
		const walletId = await ctx.db.insert("wallets", {
			userId,
			balance: 20,
			lifetimeEarned: 20,
			xp: 0,
			updatedAt: now,
		});
		return { profileId, walletId };
	});
}

async function createStreak(
	t: ReturnType<typeof convexTest>,
	userId: string,
	clientId: string,
	createdOn: string,
) {
	const now = Date.now();
	return await t.run((ctx) =>
		ctx.db.insert("streaks", {
			userId,
			clientId,
			name: clientId,
			icon: "✨",
			days: 0,
			createdOn,
			rewardEligible: true,
			sortOrder: 0,
			createdAt: now,
			updatedAt: now,
		}),
	);
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-07-23T12:00:00Z"));
});

afterEach(() => {
	vi.useRealTimers();
});

describe("critical Convex account flows", () => {
	it("undoes only its own reward and preserves concurrent streak edits", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const { user, asUser } = await createAuthenticatedTestUser(t, "Undo");
		const { walletId } = await createReadyAccount(t, user._id);
		const streakId = await createStreak(
			t,
			user._id,
			"undo-streak",
			addLocalDays(TODAY, -2),
		);

		const completion = await asUser.mutation(api.progress.completeToday, {
			streakId: "undo-streak",
			today: TODAY,
		});
		await t.run(async (ctx) => {
			await ctx.db.patch(streakId, { days: 9 });
			await ctx.db.patch(walletId, { balance: 16 });
		});

		await asUser.mutation(api.progress.undo, {
			undoId: completion.undoId as Id<"undoRecords">,
		});

		const state = await t.run(async (ctx) => ({
			streak: await ctx.db.get(streakId),
			wallet: await ctx.db.get(walletId),
			checkIns: await ctx.db.query("checkIns").collect(),
			ledger: await ctx.db.query("coinLedger").collect(),
		}));
		expect(state.streak?.days).toBe(9);
		expect(state.wallet).toMatchObject({
			balance: 15,
			lifetimeEarned: 20,
			xp: 0,
		});
		expect(state.checkIns).toEqual([]);
		expect(state.ledger).toEqual([]);
	});

	it("resolves more than a year in bounded batches with one reward cap", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const { user, asUser } = await createAuthenticatedTestUser(t, "Gap");
		const firstDay = addLocalDays(TODAY, -401);
		await createReadyAccount(t, user._id, addLocalDays(firstDay, -1));
		await createStreak(t, user._id, "gap-streak", firstDay);
		const days = Array.from(
			{ length: 401 },
			(_, index) => addLocalDays(firstDay, index),
		);
		let totalCoins = 0;
		const rewardsByBatch: number[] = [];
		for (let index = 0; index < days.length; index += 30) {
			const result = await asUser.mutation(api.progress.resolveGap, {
				days: days.slice(index, index + 30),
				today: TODAY,
				answers: [{ streakId: "gap-streak", completed: true }],
				reviewSessionId: "long-gap-session",
			});
			totalCoins += result.coinsAwarded;
			rewardsByBatch.push(result.coinsAwarded);
			if (index === 0) {
				const undoRecord = await t.run((ctx) =>
					ctx.db.query("undoRecords").first(),
				);
				expect(undoRecord?.snapshotV2?.type).toBe("progress");
				if (undoRecord?.snapshotV2?.type === "progress") {
					expect(undoRecord.snapshotV2.ledgerIds).toHaveLength(3);
				}
			}
		}

		const state = await t.run(async (ctx) => ({
			profile: await ctx.db.query("profiles").first(),
			streak: await ctx.db.query("streaks").first(),
			checkIns: await ctx.db.query("checkIns").collect(),
		}));
		expect(rewardsByBatch).toEqual([3, ...Array(13).fill(0)]);
		expect(totalCoins).toBe(3);
		expect(state.profile?.lastReviewedOn).toBe(addLocalDays(TODAY, -1));
		expect(state.streak?.days).toBe(401);
		expect(state.checkIns).toHaveLength(401);
	});

	it("never pays for the day a streak was created, review or not", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const { user, asUser } = await createAuthenticatedTestUser(t, "Birthday");
		const createdOn = addLocalDays(TODAY, -2);
		await createReadyAccount(t, user._id, addLocalDays(createdOn, -1));
		await createStreak(t, user._id, "birthday-streak", createdOn);

		// The creation day itself, resolved through the review flow.
		const creationDay = await asUser.mutation(api.progress.resolveDay, {
			day: createdOn,
			today: TODAY,
			answers: [{ streakId: "birthday-streak", completed: true }],
			reviewSessionId: "birthday-session",
		});
		// The day after, which is a genuinely kept promise.
		const nextDay = await asUser.mutation(api.progress.resolveDay, {
			day: addLocalDays(createdOn, 1),
			today: TODAY,
			answers: [{ streakId: "birthday-streak", completed: true }],
			reviewSessionId: "birthday-session",
		});

		expect(creationDay.coinsAwarded).toBe(0);
		expect(nextDay.coinsAwarded).toBe(1);
	});

	it("purges undo records once their window has passed", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const { user, asUser } = await createAuthenticatedTestUser(t, "Purge");
		await createReadyAccount(t, user._id);
		await createStreak(t, user._id, "purge-streak", addLocalDays(TODAY, -2));
		await asUser.mutation(api.progress.completeToday, {
			streakId: "purge-streak",
			today: TODAY,
		});

		expect(await t.run((ctx) => ctx.db.query("undoRecords").collect())).toHaveLength(1);

		// Still inside the undo window: the record has to survive.
		await t.mutation(internal.crons.purgeExpiredUndoRecords, {});
		expect(await t.run((ctx) => ctx.db.query("undoRecords").collect())).toHaveLength(1);

		vi.setSystemTime(new Date(Date.now() + UNDO_WINDOW_MS + 1));
		await t.mutation(internal.crons.purgeExpiredUndoRecords, {});
		expect(await t.run((ctx) => ctx.db.query("undoRecords").collect())).toEqual([]);
	});

	it("returns only check-ins that can affect the current dashboard", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const { user, asUser } = await createAuthenticatedTestUser(t, "Dashboard");
		await createReadyAccount(t, user._id, addLocalDays(TODAY, -2));
		const streakId = await createStreak(
			t,
			user._id,
			"dashboard-streak",
			addLocalDays(TODAY, -100),
		);
		await t.run(async (ctx) => {
			for (const localDate of [
				addLocalDays(TODAY, -90),
				addLocalDays(TODAY, -1),
				TODAY,
			]) {
				await ctx.db.insert("checkIns", {
					userId: user._id,
					streakId,
					localDate,
					completedAt: Date.now(),
					source: "import",
				});
			}
		});

		const dashboard = await asUser.query(api.dashboard.get);

		expect(dashboard?.checkIns.map((checkIn) => checkIn.completedOn)).toEqual([
			addLocalDays(TODAY, -1),
			TODAY,
		]);
	});

	it("imports retryable batches idempotently and marks completion last", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const { user, asUser } = await createAuthenticatedTestUser(t, "Import");

		await asUser.mutation(api.users.prepareLocalImport, {
			today: TODAY,
			timeZone: TIME_ZONE,
			streaks: [{
				clientId: "imported-streak",
				name: "Imported",
				icon: "📚",
				days: 7,
				createdOn: addLocalDays(TODAY, -7),
			}],
		});
		const batch = {
			today: TODAY,
			timeZone: TIME_ZONE,
			checkIns: [{
				streakId: "imported-streak",
				completedOn: addLocalDays(TODAY, -1),
			}],
		};
		await asUser.mutation(api.users.importLocalCheckIns, batch);
		await asUser.mutation(api.users.importLocalCheckIns, batch);
		await asUser.mutation(api.users.finishLocalImport, {
			today: TODAY,
			timeZone: TIME_ZONE,
			lastReviewedOn: addLocalDays(TODAY, -1),
			recentIcons: ["📚"],
		});

		const state = await t.run(async (ctx) => ({
			profile: await ctx.db
				.query("profiles")
				.withIndex("by_user", (query) => query.eq("userId", user._id))
				.unique(),
			checkIns: await ctx.db.query("checkIns").collect(),
		}));
		expect(state.profile?.importedLocalDataAt).toBeTypeOf("number");
		expect(state.profile?.recentIcons).toEqual(["📚"]);
		expect(state.checkIns).toHaveLength(1);
	});

	it("charges an authenticated pet skin once", async () => {
		const t = convexTest(schema, modules);
		betterAuthTest.register(t);
		const { user, asUser } = await createAuthenticatedTestUser(t, "Pet");
		const { walletId } = await createReadyAccount(t, user._id);
		await t.run((ctx) => ctx.db.patch(walletId, { balance: 100 }));

		await asUser.mutation(api.pet.purchaseSkin, { skinId: "berry" });
		await asUser.mutation(api.pet.purchaseSkin, { skinId: "berry" });

		const state = await t.run(async (ctx) => ({
			profile: await ctx.db.query("profiles").first(),
			wallet: await ctx.db.get(walletId),
		}));
		expect(state.profile).toMatchObject({
			petSkin: "berry",
			ownedPetSkins: ["ember", "berry"],
		});
		expect(state.wallet?.balance).toBe(25);
	});
});
