import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
	friendshipPairKey,
	getFriendProfile,
} from "./lib/friendships";
import { requireAuthUser } from "./lib/users";

export const list = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireAuthUser(ctx);
		const [incoming, outgoing, acceptedAsRequester, acceptedAsRecipient] =
			await Promise.all([
				ctx.db
					.query("friendships")
					.withIndex("by_recipient_id_and_status", (queryBuilder) =>
						queryBuilder.eq("recipientId", user._id).eq("status", "pending"),
					)
					.collect(),
				ctx.db
					.query("friendships")
					.withIndex("by_requester_id_and_status", (queryBuilder) =>
						queryBuilder.eq("requesterId", user._id).eq("status", "pending"),
					)
					.collect(),
				ctx.db
					.query("friendships")
					.withIndex("by_requester_id_and_status", (queryBuilder) =>
						queryBuilder.eq("requesterId", user._id).eq("status", "accepted"),
					)
					.collect(),
				ctx.db
					.query("friendships")
					.withIndex("by_recipient_id_and_status", (queryBuilder) =>
						queryBuilder.eq("recipientId", user._id).eq("status", "accepted"),
					)
					.collect(),
			]);

		const hydrate = async (friendship: (typeof incoming)[number], otherUserId: string) => {
			const profile = await getFriendProfile(ctx, otherUserId);
			return profile ? { ...profile, requestId: friendship._id } : null;
		};
		const compact = <T>(values: (T | null)[]): T[] =>
			values.filter((value): value is T => value !== null);

		return {
			incoming: compact(await Promise.all(
				incoming.map((friendship) => hydrate(friendship, friendship.requesterId)),
			)),
			outgoing: compact(await Promise.all(
				outgoing.map((friendship) => hydrate(friendship, friendship.recipientId)),
			)),
			friends: compact(await Promise.all([
				...acceptedAsRequester.map((friendship) =>
					hydrate(friendship, friendship.recipientId),
				),
				...acceptedAsRecipient.map((friendship) =>
					hydrate(friendship, friendship.requesterId),
				),
			])),
		};
	},
});

export const send = mutation({
	args: { profileId: v.id("profiles") },
	handler: async (ctx, { profileId }) => {
		const user = await requireAuthUser(ctx);
		const recipient = await ctx.db.get(profileId);
		if (!recipient?.username) throw new Error("That Akin profile is not available.");
		if (recipient.userId === user._id) throw new Error("You cannot send a friend request to yourself.");

		const pairKey = friendshipPairKey(user._id, recipient.userId);
		const existing = await ctx.db
			.query("friendships")
			.withIndex("by_pair_key", (queryBuilder) => queryBuilder.eq("pairKey", pairKey))
			.unique();
		if (existing?.status === "accepted") return { state: "friends" as const };
		if (existing) {
			return {
				state: existing.requesterId === user._id
					? "outgoing" as const
					: "incoming" as const,
			};
		}

		await ctx.db.insert("friendships", {
			pairKey,
			requesterId: user._id,
			recipientId: recipient.userId,
			status: "pending",
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return { state: "outgoing" as const };
	},
});

export const cancel = mutation({
	args: { profileId: v.id("profiles") },
	handler: async (ctx, { profileId }) => {
		const user = await requireAuthUser(ctx);
		const recipient = await ctx.db.get(profileId);
		if (!recipient) return null;
		const friendship = await ctx.db
			.query("friendships")
			.withIndex("by_pair_key", (queryBuilder) =>
				queryBuilder.eq("pairKey", friendshipPairKey(user._id, recipient.userId)),
			)
			.unique();
		if (
			friendship?.status === "pending" &&
			friendship.requesterId === user._id
		) {
			await ctx.db.delete(friendship._id);
		}
		return null;
	},
});

export const respond = mutation({
	args: {
		requestId: v.id("friendships"),
		accept: v.boolean(),
	},
	handler: async (ctx, { requestId, accept }) => {
		const user = await requireAuthUser(ctx);
		const friendship = await ctx.db.get(requestId);
		if (
			!friendship ||
			friendship.status !== "pending" ||
			friendship.recipientId !== user._id
		) {
			throw new Error("That friend request is no longer available.");
		}
		if (accept) {
			await ctx.db.patch(friendship._id, {
				status: "accepted",
				updatedAt: Date.now(),
			});
			return { state: "friends" as const };
		}
		await ctx.db.delete(friendship._id);
		return { state: "none" as const };
	},
});

export const remove = mutation({
	args: { profileId: v.id("profiles") },
	handler: async (ctx, { profileId }) => {
		const user = await requireAuthUser(ctx);
		const profile = await ctx.db.get(profileId);
		if (!profile) return null;
		const friendship = await ctx.db
			.query("friendships")
			.withIndex("by_pair_key", (queryBuilder) =>
				queryBuilder.eq("pairKey", friendshipPairKey(user._id, profile.userId)),
			)
			.unique();
		if (
			friendship?.status === "accepted" &&
			(friendship.requesterId === user._id || friendship.recipientId === user._id)
		) {
			await ctx.db.delete(friendship._id);
		}
		return null;
	},
});
