import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { assertCurrentLocalDate, assertLocalDate } from "./lib/dates";
import { MAX_REWARD_STREAKS } from "./lib/app-rules";
import { normalizeIcon, normalizeStreakName } from "./lib/streaks";
import {
	advanceFullyCheckedDays,
	ensureUserState,
	getProfile,
	requireAuthUser,
} from "./lib/users";

const localStreak = v.object({
	clientId: v.string(),
	name: v.string(),
	icon: v.string(),
	days: v.number(),
	createdOn: v.string(),
});

const localCheckIn = v.object({
	streakId: v.string(),
	completedOn: v.string(),
});

export const current = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireAuthUser(ctx);
		const profile = await getProfile(ctx, user._id);
		return {
			id: user._id,
			name: user.name,
			email: user.email,
			isReady: profile !== null,
			needsLocalImport: profile?.importedLocalDataAt === undefined,
		};
	},
});

export const ensure = mutation({
	args: { today: v.string(), timeZone: v.string() },
	handler: async (ctx, { today, timeZone }) => {
		assertCurrentLocalDate(today, timeZone);
		const user = await requireAuthUser(ctx);
		await ensureUserState(ctx, user, today, timeZone);
		await advanceFullyCheckedDays(ctx, user._id, today);
	},
});

export const prepareLocalImport = mutation({
	args: {
		today: v.string(),
		timeZone: v.string(),
		streaks: v.array(localStreak),
	},
	handler: async (ctx, args) => {
		assertCurrentLocalDate(args.today, args.timeZone);
		const user = await requireAuthUser(ctx);
		const { profile } = await ensureUserState(ctx, user, args.today, args.timeZone);
		if (profile.importedLocalDataAt !== undefined) return { ready: false };
		if (args.streaks.length > 100) throw new Error("Too many streaks to import");

		const now = Date.now();
		for (const [index, streak] of args.streaks.entries()) {
			assertLocalDate(streak.createdOn);
			const existing = await ctx.db
				.query("streaks")
				.withIndex("by_user_client", (queryBuilder) =>
					queryBuilder.eq("userId", user._id).eq("clientId", streak.clientId),
				)
				.unique();
			if (existing) {
				continue;
			}

			await ctx.db.insert("streaks", {
				userId: user._id,
				clientId: streak.clientId,
				name: normalizeStreakName(streak.name),
				icon: normalizeIcon(streak.icon),
				days: Math.max(0, Math.min(1_000_000, Math.floor(streak.days))),
				createdOn: streak.createdOn,
				rewardEligible: index < MAX_REWARD_STREAKS,
				sortOrder: index,
				createdAt: now,
				updatedAt: now,
			});
		}
		return { ready: true };
	},
});

export const importLocalCheckIns = mutation({
	args: {
		today: v.string(),
		timeZone: v.string(),
		checkIns: v.array(localCheckIn),
	},
	handler: async (ctx, args) => {
		assertCurrentLocalDate(args.today, args.timeZone);
		if (args.checkIns.length > 50) throw new Error("Check-in import batch is too large");
		const user = await requireAuthUser(ctx);
		const profile = await getProfile(ctx, user._id);
		if (!profile || profile.importedLocalDataAt !== undefined) return { imported: 0 };

		const clientIds = [...new Set(args.checkIns.map((checkIn) => checkIn.streakId))];
		const streaks = await Promise.all(
			clientIds.map((clientId) =>
				ctx.db
					.query("streaks")
					.withIndex("by_user_client", (queryBuilder) =>
						queryBuilder.eq("userId", user._id).eq("clientId", clientId),
					)
					.unique(),
			),
		);
		const streaksByClientId = new Map(
			streaks.flatMap((streak) =>
				streak && streak.deletedAt === undefined
					? [[streak.clientId, streak] as const]
					: [],
			),
		);
		const now = Date.now();
		let imported = 0;
		for (const checkIn of args.checkIns) {
			assertLocalDate(checkIn.completedOn);
			const streak = streaksByClientId.get(checkIn.streakId);
			if (
				!streak ||
				checkIn.completedOn < streak.createdOn ||
				checkIn.completedOn > args.today
			) continue;
			const duplicate = await ctx.db
				.query("checkIns")
				.withIndex("by_user_streak_date", (queryBuilder) =>
					queryBuilder
						.eq("userId", user._id)
						.eq("streakId", streak._id)
						.eq("localDate", checkIn.completedOn),
				)
				.unique();
			if (!duplicate) {
				await ctx.db.insert("checkIns", {
					userId: user._id,
					streakId: streak._id,
					localDate: checkIn.completedOn,
					completedAt: now,
					source: "import",
				});
				imported += 1;
			}
		}
		return { imported };
	},
});

export const finishLocalImport = mutation({
	args: {
		today: v.string(),
		timeZone: v.string(),
		lastReviewedOn: v.string(),
		recentIcons: v.array(v.string()),
	},
	handler: async (ctx, args) => {
		assertCurrentLocalDate(args.today, args.timeZone);
		assertLocalDate(args.lastReviewedOn);
		const user = await requireAuthUser(ctx);
		const profile = await getProfile(ctx, user._id);
		if (!profile || profile.importedLocalDataAt !== undefined) {
			return { imported: false };
		}
		const now = Date.now();
		await ctx.db.patch(profile._id, {
			lastReviewedOn: args.lastReviewedOn <= args.today ? args.lastReviewedOn : args.today,
			timeZone: args.timeZone,
			recentIcons: args.recentIcons.slice(0, 8).map(normalizeIcon),
			importedLocalDataAt: now,
			updatedAt: now,
		});
		await advanceFullyCheckedDays(ctx, user._id, args.today);
		return { imported: true };
	},
});
