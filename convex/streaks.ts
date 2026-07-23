import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertCurrentLocalDate } from "./lib/dates";
import {
	findOwnedStreak,
	listActiveStreaks,
	MAX_REWARD_STREAKS,
	normalizeIcon,
	normalizeStreakName,
	isRewardEligible,
} from "./lib/streaks";
import { createUndoRecord } from "./lib/undo";
import { getProfile, requireAuthUser } from "./lib/users";

export const create = mutation({
	args: {
		clientId: v.string(),
		name: v.string(),
		icon: v.string(),
		createdOn: v.string(),
	},
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const profile = await getProfile(ctx, user._id);
		if (!profile) throw new Error("Profile missing for authenticated user");
		assertCurrentLocalDate(args.createdOn, profile.timeZone ?? "UTC");
		const existing = await ctx.db
			.query("streaks")
			.withIndex("by_user_client", (queryBuilder) =>
				queryBuilder.eq("userId", user._id).eq("clientId", args.clientId),
			)
			.unique();
		if (existing) return { rewardEligible: isRewardEligible(existing) };

		const streaks = await listActiveStreaks(ctx, user._id);
		const rewardEligible = streaks.filter(isRewardEligible).length < MAX_REWARD_STREAKS;
		await ctx.db.insert("streaks", {
			userId: user._id,
			clientId: args.clientId,
			name: normalizeStreakName(args.name),
			icon: normalizeIcon(args.icon),
			days: 0,
			createdOn: args.createdOn,
			rewardEligible,
			sortOrder: streaks.length,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return { rewardEligible };
	},
});

export const rename = mutation({
	args: { streakId: v.string(), name: v.string() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const streak = await findOwnedStreak(ctx, user._id, args.streakId);
		await ctx.db.patch(streak._id, { name: normalizeStreakName(args.name), updatedAt: Date.now() });
	},
});

export const updateIcon = mutation({
	args: { streakId: v.string(), icon: v.string() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const streak = await findOwnedStreak(ctx, user._id, args.streakId);
		await ctx.db.patch(streak._id, { icon: normalizeIcon(args.icon), updatedAt: Date.now() });
	},
});

export const adjustDays = mutation({
	args: { streakId: v.string(), days: v.number() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const streak = await findOwnedStreak(ctx, user._id, args.streakId);
		const days = Math.max(0, Math.min(1_000_000, Math.floor(args.days)));
		await ctx.db.patch(streak._id, { days, updatedAt: Date.now() });
	},
});

export const rememberIcon = mutation({
	args: { icon: v.string() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const profile = await getProfile(ctx, user._id);
		if (!profile) return;
		const icon = normalizeIcon(args.icon);
		await ctx.db.patch(profile._id, {
			recentIcons: [icon, ...profile.recentIcons.filter((candidate) => candidate !== icon)].slice(0, 8),
			updatedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: { streakId: v.string() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const streak = await findOwnedStreak(ctx, user._id, args.streakId);
		const deletedAt = Date.now();
		const undoId = await createUndoRecord(ctx, user._id, "delete", {
			version: 2,
			type: "delete",
			streakId: streak._id,
			deletedAt,
		});
		await ctx.db.patch(streak._id, { deletedAt, updatedAt: deletedAt });
		return { undoId, name: streak.name };
	},
});

export const setRewardEligible = mutation({
	args: { streakId: v.string(), rewardEligible: v.boolean() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const streak = await findOwnedStreak(ctx, user._id, args.streakId);
		if (isRewardEligible(streak) === args.rewardEligible) return;
		if (args.rewardEligible) {
			const active = await listActiveStreaks(ctx, user._id);
			if (active.filter(isRewardEligible).length >= MAX_REWARD_STREAKS) {
				throw new ConvexError({
					code: "REWARD_STREAK_LIMIT",
					message: `Only ${MAX_REWARD_STREAKS} streaks can earn rewards`,
				});
			}
		}
		await ctx.db.patch(streak._id, { rewardEligible: args.rewardEligible, updatedAt: Date.now() });
	},
});
