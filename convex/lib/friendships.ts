import type { QueryCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";
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

export async function getFriendProfile(ctx: QueryCtx, userId: string) {
	const profile = await ctx.db
		.query("profiles")
		.withIndex("by_user", (query) => query.eq("userId", userId))
		.unique();
	if (!profile?.username) return null;
	const wallet = await getWallet(ctx, userId);
	return {
		id: profile._id,
		username: profile.username,
		petSkin: profile.petSkin ?? "ember",
		petHair: profile.petHair ?? "honey",
		xp: wallet?.xp ?? 0,
	};
}
