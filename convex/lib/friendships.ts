import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
import { WEEKLY_XP_WINDOW_DAYS } from "./app_rules";
import { addLocalDays } from "./dates";
import { getWallet } from "./users";

export type FriendshipState = "none" | "outgoing" | "incoming" | "friends";

export function friendshipPairKey(firstUserId: string, secondUserId: string) {
	return firstUserId < secondUserId
		? `${firstUserId}\u0000${secondUserId}`
		: `${secondUserId}\u0000${firstUserId}`;
}

export async function getFriendship(
	ctx: QueryCtx,
	firstUserId: string,
	secondUserId: string,
) {
	return await ctx.db
		.query("friendships")
		.withIndex("by_pair_key", (query) =>
			query.eq("pairKey", friendshipPairKey(firstUserId, secondUserId)),
		)
		.unique();
}

export function getFriendshipState(
	friendship: Doc<"friendships"> | null,
	currentUserId: string,
): FriendshipState {
	if (!friendship) return "none";
	if (friendship.status === "accepted") return "friends";
	return friendship.requesterId === currentUserId ? "outgoing" : "incoming";
}

/** The first local date inside the rolling week that ends on `today`. */
export function weeklyXpWindowStart(today: string) {
	return addLocalDays(today, -(WEEKLY_XP_WINDOW_DAYS - 1));
}

/**
 * XP earned inside the rolling week. Every XP award writes a `coinLedger` row
 * stamped with the local day it was earned — and undo deletes that row — so the
 * ledger is the record to sum rather than a second counter that could drift.
 */
export async function getWeeklyXp(ctx: QueryCtx, userId: string, today: string) {
	const entries = await ctx.db
		.query("coinLedger")
		.withIndex("by_user_and_local_date", (query) =>
			query.eq("userId", userId).gte("localDate", weeklyXpWindowStart(today)).lte("localDate", today),
		)
		.collect();
	return entries.reduce((total, entry) => total + entry.amount, 0);
}

export async function getFriendProfile(ctx: QueryCtx, userId: string, today: string) {
	const profile = await ctx.db
		.query("profiles")
		.withIndex("by_user", (query) => query.eq("userId", userId))
		.unique();
	if (!profile?.username) return null;
	const [wallet, weeklyXp] = await Promise.all([
		getWallet(ctx, userId),
		getWeeklyXp(ctx, userId, today),
	]);
	return {
		id: profile._id,
		username: profile.username,
		petSkin: profile.petSkin ?? "ember",
		petHair: profile.petHair ?? "honey",
		xp: wallet?.xp ?? 0,
		weeklyXp,
	};
}
