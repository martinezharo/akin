"use client";

import { useMutation, useQuery } from "convex/react";
import { useDeferredValue, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AccountDock } from "@/features/account/components/account-dock";
import { ui } from "@/i18n/en";
import { FriendsView } from "../components/friends-view";
import {
	EMPTY_CONNECTIONS,
	type FriendshipActions,
	MIN_SEARCH_LENGTH,
	normalizeUsernameQuery,
} from "../model/friend-types";

export function RegisteredFriends() {
	const [query, setQuery] = useState("");
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const dashboard = useQuery(api.dashboard.get);
	const connections = useQuery(api.friendships.list);
	const sendRequest = useMutation(api.friendships.send);
	const cancelRequest = useMutation(api.friendships.cancel);
	const respondToRequest = useMutation(api.friendships.respond);
	const normalizedQuery = normalizeUsernameQuery(query);
	const deferredQuery = useDeferredValue(normalizedQuery);
	const canSearch = deferredQuery.length >= MIN_SEARCH_LENGTH;
	const results = useQuery(api.users.searchByUsername, canSearch ? { username: deferredQuery } : "skip");

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
			isPending={canSearch && (results === undefined || deferredQuery !== normalizedQuery)}
			accountControl={<AccountDock />}
			identity={dashboard ? {
				username: dashboard.user.username,
				balance: dashboard.wallet.balance,
				xp: dashboard.wallet.xp,
			} : undefined}
			connections={connections ?? EMPTY_CONNECTIONS}
			actions={actions}
			pendingId={pendingId}
			actionError={actionError}
		/>
	);
}
