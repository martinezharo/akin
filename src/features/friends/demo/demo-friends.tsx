"use client";

import { useMemo, useState } from "react";
import { AccountDock } from "@/features/account/components/account-dock";
import { useDemoWallet } from "@/features/account/demo/use-demo-account";
import { FriendsView } from "../components/friends-view";
import {
	type Friend,
	type FriendshipActions,
	MIN_SEARCH_LENGTH,
	normalizeUsernameQuery,
} from "../model/friend-types";

const DEMO_FRIENDS: Friend[] = [
	{ id: "nova", username: "nova_moves", petSkin: "sky", petHair: "cream", xp: 2840, relationship: "friends" },
	{ id: "milo", username: "milo_makes", petSkin: "moss", petHair: "honey", xp: 1920, relationship: "incoming", requestId: "demo-milo" },
	{ id: "bea", username: "bea_bloom", petSkin: "berry", petHair: "mint", xp: 3765, relationship: "outgoing", requestId: "demo-bea" },
	{ id: "sam", username: "tinywins", petSkin: "cinnamon", petHair: "lilac", xp: 1240, relationship: "none" },
	{ id: "leo", username: "leo_keepsgoing", petSkin: "plum", petHair: "rose", xp: 4210, relationship: "none" },
	{ id: "ivy", username: "ivy_everyday", petSkin: "ember", petHair: "mint", xp: 980, relationship: "none" },
];

export function DemoFriendsPage() {
	const [query, setQuery] = useState("");
	const [demoFriends, setDemoFriends] = useState(DEMO_FRIENDS);
	const [pendingId, setPendingId] = useState<string | null>(null);
	const demoWallet = useDemoWallet();

	const results = useMemo(() => {
		const normalized = normalizeUsernameQuery(query);
		return normalized.length >= MIN_SEARCH_LENGTH
			? demoFriends.filter((friend) => friend.username.startsWith(normalized))
			: demoFriends;
	}, [demoFriends, query]);

	const updateDemoRelationship = (id: string, relationship: Friend["relationship"]) => {
		setPendingId(id);
		setDemoFriends((current) => current.map((friend) =>
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
		send: (profileId) => updateDemoRelationship(profileId, "outgoing"),
		cancel: (profileId) => updateDemoRelationship(profileId, "none"),
		respond: (requestId, accept) => updateDemoRelationship(requestId, accept ? "friends" : "none"),
	};

	return (
		<FriendsView
			results={results}
			isPending={false}
			accountControl={<AccountDock />}
			query={query}
			onQueryChange={setQuery}
			identity={{ username: "demo", balance: demoWallet.balance, xp: demoWallet.xp }}
			connections={{
				friends: demoFriends.filter((friend) => friend.relationship === "friends"),
				incoming: demoFriends.filter((friend) => friend.relationship === "incoming"),
				outgoing: demoFriends.filter((friend) => friend.relationship === "outgoing"),
			}}
			actions={actions}
			pendingId={pendingId}
			actionError={null}
		/>
	);
}
