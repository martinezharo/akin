import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { assertCurrentLocalDate, assertLocalDate } from "./lib/dates";
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

export const importLocalData = mutation({
	args: {
		today: v.string(),
		timeZone: v.string(),
		lastReviewedOn: v.string(),
		recentIcons: v.array(v.string()),
		streaks: v.array(localStreak),
		checkIns: v.array(localCheckIn),
	},
	handler: async (ctx, args) => {
		assertCurrentLocalDate(args.today, args.timeZone);
		assertLocalDate(args.lastReviewedOn);
		const user = await requireAuthUser(ctx);
		const { profile } = await ensureUserState(ctx, user, args.today, args.timeZone);
		if (profile.importedLocalDataAt !== undefined) return { imported: false };

		const now = Date.now();
		const sourceStreaks = args.streaks.slice(0, 100);
		const streakIds = new Map<string, Id<"streaks">>();
		for (const [index, streak] of sourceStreaks.entries()) {
			assertLocalDate(streak.createdOn);
			const existing = await ctx.db
				.query("streaks")
				.withIndex("by_user_client", (queryBuilder) =>
					queryBuilder.eq("userId", user._id).eq("clientId", streak.clientId),
				)
				.unique();
			if (existing) {
				streakIds.set(streak.clientId, existing._id);
				continue;
			}

			const streakId = await ctx.db.insert("streaks", {
				userId: user._id,
				clientId: streak.clientId,
				name: normalizeStreakName(streak.name),
				icon: normalizeIcon(streak.icon),
				days: Math.max(0, Math.floor(streak.days)),
				createdOn: streak.createdOn,
				rewardEligible: index < 10,
				sortOrder: index,
				createdAt: now,
				updatedAt: now,
			});
			streakIds.set(streak.clientId, streakId);
		}

		for (const checkIn of args.checkIns.slice(0, 20_000)) {
			assertLocalDate(checkIn.completedOn);
			const streakId = streakIds.get(checkIn.streakId);
			if (!streakId) continue;
			const duplicate = await ctx.db
				.query("checkIns")
				.withIndex("by_user_streak_date", (queryBuilder) =>
					queryBuilder
						.eq("userId", user._id)
						.eq("streakId", streakId)
						.eq("localDate", checkIn.completedOn),
				)
				.unique();
			if (!duplicate) {
				await ctx.db.insert("checkIns", {
					userId: user._id,
					streakId,
					localDate: checkIn.completedOn,
					completedAt: now,
					source: "import",
				});
			}
		}

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
