"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AccountDock } from "@/features/account/components/account-dock";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { ui } from "@/i18n/en";
import { FriendsView } from "../components/friends-view";
import {
	type FriendshipActions,
	MIN_SEARCH_LENGTH,
	normalizeUsernameQuery,
} from "../model/friend-types";

/** Long enough to skip intermediate keystrokes, short enough to feel instant. */
const SEARCH_DEBOUNCE_MS = 250;

export function RegisteredFriends() {
	const [query, setQuery] = useState("");
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	// This screen only shows the account header, so it subscribes to the identity
	// query instead of the whole dashboard, which would re-send every streak and
	// check-in on each completion.
	const identity = useQuery(api.users.identity);
	const connections = useQuery(api.friendships.list);
	const sendRequest = useMutation(api.friendships.send);
	const cancelRequest = useMutation(api.friendships.cancel);
	const respondToRequest = useMutation(api.friendships.respond);
	const normalizedQuery = normalizeUsernameQuery(query);
	const debouncedQuery = useDebouncedValue(normalizedQuery, SEARCH_DEBOUNCE_MS);
	const canSearch = debouncedQuery.length >= MIN_SEARCH_LENGTH;
	const results = useQuery(api.users.searchByUsername, canSearch ? { username: debouncedQuery } : "skip");

	const runAction = (id: string, action: () => Promise<unknown>) => {
		setPendingId(id);
		setActionError(null);
		void action()
			.catch(() => setActionError(ui.friends.actionFailed))
			.finally(() => setPendingId(null));
	};

	const actions: FriendshipActions = {
		send: (profileId) => runAction(profileId, () =>
			sendRequest({ profileId: profileId as Id<"profiles"> })),
		cancel: (profileId) => runAction(profileId, () =>
			cancelRequest({ profileId: profileId as Id<"profiles"> })),
		respond: (requestId, accept) => runAction(requestId, () =>
			respondToRequest({ requestId: requestId as Id<"friendships">, accept })),
	};

	return (
		<FriendsView
			results={results}
			query={query}
			onQueryChange={setQuery}
			isPending={canSearch && (results === undefined || debouncedQuery !== normalizedQuery)}
			accountControl={<AccountDock />}
			identity={identity ?? undefined}
			connections={connections}
			actions={actions}
			pendingId={pendingId}
			actionError={actionError}
		/>
	);
}
