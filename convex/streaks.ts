import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { assertCurrentLocalDate } from "./lib/dates";
import {
	findOwnedStreak,
	listActiveStreaks,
	MAX_COIN_STREAKS,
	normalizeIcon,
	normalizeStreakName,
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
		if (existing) return { coinEligible: existing.coinEligible };

		const streaks = await listActiveStreaks(ctx, user._id);
		const coinEligible = streaks.filter((streak) => streak.coinEligible).length < MAX_COIN_STREAKS;
		await ctx.db.insert("streaks", {
			userId: user._id,
			clientId: args.clientId,
			name: normalizeStreakName(args.name),
			icon: normalizeIcon(args.icon),
			days: 0,
			createdOn: args.createdOn,
			coinEligible,
			sortOrder: streaks.length,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return { coinEligible };
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
		const undoId = await createUndoRecord(ctx, user._id, "delete", {
			type: "delete",
			streakId: streak._id,
		});
		await ctx.db.patch(streak._id, { deletedAt: Date.now(), updatedAt: Date.now() });
		return { undoId, name: streak.name };
	},
});

export const setCoinEligible = mutation({
	args: { streakId: v.string(), coinEligible: v.boolean() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const streak = await findOwnedStreak(ctx, user._id, args.streakId);
		if (streak.coinEligible === args.coinEligible) return;
		if (args.coinEligible) {
			const active = await listActiveStreaks(ctx, user._id);
			if (active.filter((candidate) => candidate.coinEligible).length >= MAX_COIN_STREAKS) {
				throw new ConvexError({
					code: "COIN_STREAK_LIMIT",
					message: "Only ten streaks can earn coins",
				});
			}
		}
		await ctx.db.patch(streak._id, { coinEligible: args.coinEligible, updatedAt: Date.now() });
	},
});
