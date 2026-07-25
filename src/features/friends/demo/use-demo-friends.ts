"use client";

import { useMemo, useState } from "react";
import { DEMO_FRIENDS } from "./demo-friends-fixture";
import {
	type Friend,
	type FriendConnections,
	type FriendshipActions,
	MIN_SEARCH_LENGTH,
	normalizeUsernameQuery,
} from "../model/friend-types";


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
