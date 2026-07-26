import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { CheckInIndex } from "./app_rules";

export { MAX_REWARD_STREAKS } from "./app_rules";

type RewardEligibleStreak = {
	rewardEligible?: boolean;
	coinEligible?: boolean;
};

export function isRewardEligible(streak: RewardEligibleStreak): boolean {
	return streak.rewardEligible ?? streak.coinEligible ?? false;
}

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

/**
 * Repairs a name coming from a guest browser instead of rejecting it.
 *
 * `localStorage` is beyond our reach — an old build, a half-written record or a
 * hand-edited key can hold something the strict normalisers refuse. During an
 * import a single throw would abort the whole run and, since the account is
 * only marked as imported at the end, it would fail again on every sign-in.
 * Returns `null` only when there is nothing left worth storing.
 */
export function sanitizeImportedStreakName(name: string): string | null {
	const normalized = name.trim().replace(/\s+/g, " ").slice(0, 80);
	return normalized.length === 0 ? null : normalized;
}

export function sanitizeImportedIcon(icon: string): string | null {
	const normalized = icon.trim().slice(0, 32);
	return normalized.length === 0 ? null : normalized;
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

/**
 * Loads every check-in in an inclusive day range as a constant-time lookup.
 *
 * Resolving a review asks about each streak on each day. Querying that one pair
 * at a time costs `streaks × days` sequential round trips inside a single
 * transaction; the `by_user_date` index answers the whole question in one scan.
 */
export async function loadCheckInIndex(
	ctx: QueryCtx | MutationCtx,
	userId: string,
	fromDate: string,
	toDate: string,
): Promise<CheckInIndex> {
	const checkIns = await ctx.db
		.query("checkIns")
		.withIndex("by_user_date", (query) =>
			query.eq("userId", userId).gte("localDate", fromDate).lte("localDate", toDate),
		)
		.collect();
	return new CheckInIndex(
		checkIns.map((checkIn) => [checkIn.streakId, checkIn.localDate] as const),
	);
}
