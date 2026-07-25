"use client";

import { useMemo, useState } from "react";
import {
	type Friend,
	type FriendConnections,
	type FriendshipActions,
	MIN_SEARCH_LENGTH,
	normalizeUsernameQuery,
} from "../model/friend-types";

// Weekly XP deliberately does not track lifetime XP: the crew board is about
// this week's effort, and the fixtures show a veteran having a quiet week while
// a newcomer leads.
export const DEMO_FRIENDS: Friend[] = [
	{ id: "nova", username: "nova_moves", petSkin: "sky", petHair: "cream", xp: 2840, weeklyXp: 21, relationship: "friends" },
	{ id: "juno", username: "juno_dailies", petSkin: "plum", petHair: "lilac", xp: 3120, weeklyXp: 12, relationship: "friends" },
	{ id: "remy", username: "remy_reps", petSkin: "cinnamon", petHair: "honey", xp: 1685, weeklyXp: 26, relationship: "friends" },
	{ id: "milo", username: "milo_makes", petSkin: "moss", petHair: "honey", xp: 1920, weeklyXp: 9, relationship: "incoming", requestId: "demo-milo" },
	{ id: "bea", username: "bea_bloom", petSkin: "berry", petHair: "mint", xp: 3765, weeklyXp: 17, relationship: "outgoing", requestId: "demo-bea" },
	{ id: "sam", username: "tinywins", petSkin: "cinnamon", petHair: "lilac", xp: 1240, weeklyXp: 4, relationship: "none" },
	{ id: "leo", username: "leo_keepsgoing", petSkin: "plum", petHair: "rose", xp: 4210, weeklyXp: 0, relationship: "none" },
	{ id: "ivy", username: "ivy_everyday", petSkin: "ember", petHair: "mint", xp: 980, weeklyXp: 14, relationship: "none" },
];

export type DemoFriendsState = {
	query: string;
	setQuery: (query: string) => void;
	results: Friend[];
	connections: FriendConnections;
	actions: FriendshipActions;
	pendingId: string | null;
};

/**
 * The friends page driven by in-memory fixtures: the same shape the Convex
 * experience produces, so every friends layout can be built and reviewed
 * without an account.
 */
export function useDemoFriends(): DemoFriendsState {
	const [query, setQuery] = useState("");
	const [friends, setFriends] = useState(DEMO_FRIENDS);
	const [pendingId, setPendingId] = useState<string | null>(null);

	const results = useMemo(() => {
		const normalized = normalizeUsernameQuery(query);
		return normalized.length >= MIN_SEARCH_LENGTH
			? friends.filter((friend) => friend.username.startsWith(normalized))
			: friends;
	}, [friends, query]);

	const connections = useMemo<FriendConnections>(() => ({
		friends: friends.filter((friend) => friend.relationship === "friends"),
		incoming: friends.filter((friend) => friend.relationship === "incoming"),
		outgoing: friends.filter((friend) => friend.relationship === "outgoing"),
	}), [friends]);

	const updateRelationship = (id: string, relationship: Friend["relationship"]) => {
		setPendingId(id);
		setFriends((current) => current.map((friend) =>
			friend.id === id || friend.requestId === id
				? {
					...friend,
					relationship,
					requestId: relationship === "outgoing" || relationship === "incoming"
						? friend.requestId ?? `demo-${friend.id}`
						: null,
				}
				: friend
		));
		setPendingId(null);
	};

	const actions: FriendshipActions = {
		send: (profileId) => updateRelationship(profileId, "outgoing"),
		cancel: (profileId) => updateRelationship(profileId, "none"),
		respond: (requestId, accept) => updateRelationship(requestId, accept ? "friends" : "none"),
	};

	return { query, setQuery, results, connections, actions, pendingId };
}
