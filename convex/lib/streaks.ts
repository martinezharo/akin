import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export const MAX_COIN_STREAKS = 10;

export function normalizeStreakName(name: string): string {
	const normalized = name.trim().replace(/\s+/g, " ");
	if (normalized.length === 0 || normalized.length > 80) {
		throw new ConvexError({ code: "INVALID_STREAK_NAME", message: "Invalid streak name" });
	}
	return normalized;
}

export function normalizeIcon(icon: string): string {
	const normalized = icon.trim();
	if (normalized.length === 0 || normalized.length > 32) {
		throw new ConvexError({ code: "INVALID_ICON", message: "Invalid streak icon" });
	}
	return normalized;
}

export async function listActiveStreaks(ctx: QueryCtx | MutationCtx, userId: string) {
	const streaks = await ctx.db
		.query("streaks")
		.withIndex("by_user", (query) => query.eq("userId", userId))
		.collect();
	return streaks
		.filter((streak) => streak.deletedAt === undefined)
		.sort((left, right) => left.sortOrder - right.sortOrder);
}

export async function findOwnedStreak(
	ctx: QueryCtx | MutationCtx,
	userId: string,
	clientId: string,
) {
	const streak = await ctx.db
		.query("streaks")
		.withIndex("by_user_client", (query) =>
			query.eq("userId", userId).eq("clientId", clientId),
		)
		.unique();
	if (!streak || streak.deletedAt !== undefined) {
		throw new ConvexError({ code: "STREAK_NOT_FOUND", message: "Streak not found" });
	}
	return streak;
}

export async function hasCheckIn(
	ctx: QueryCtx | MutationCtx,
	userId: string,
	streakId: Id<"streaks">,
	localDate: string,
) {
	return await ctx.db
		.query("checkIns")
		.withIndex("by_user_streak_date", (query) =>
			query
				.eq("userId", userId)
				.eq("streakId", streakId)
				.eq("localDate", localDate),
		)
		.unique();
}
