"use client";

import { AccountDock } from "@/features/account/components/account-dock";
import { useDemoWallet } from "@/features/account/demo/use-demo-account";
import { FriendsView } from "../components/friends-view";
import { useDemoFriends } from "./use-demo-friends";

export function DemoFriendsPage() {
	const { query, setQuery, results, connections, actions, pendingId } = useDemoFriends();
	const demoWallet = useDemoWallet();

	return (
		<FriendsView
			results={results}
			isPending={false}
			accountControl={<AccountDock />}
			query={query}
			onQueryChange={setQuery}
			identity={{ username: "demo", balance: demoWallet.balance, xp: demoWallet.xp }}
			connections={connections}
			actions={actions}
			pendingId={pendingId}
			actionError={null}
		/>
	);
}
