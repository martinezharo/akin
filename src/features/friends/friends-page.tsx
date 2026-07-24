"use client";

import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { Check, Clock3, Search, Sparkles, UserPlus, UserRoundSearch, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useDeferredValue, useId, useMemo, useState, useSyncExternalStore } from "react";
import { useEffect } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { AccountDock, DemoAccountDock } from "@/features/account/account-dock";
import { AccountRewardsBalance } from "@/features/account/account-rewards-balance";
import {
	getDemoAccountSnapshot,
	loadDemoWalletState,
	subscribeDemoAccount,
} from "@/features/account/demo-account-storage";
import { UsernamePresence } from "@/features/account/username-setup-modal";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { getPetHair, getPetSkin } from "@/domain/pet/pet-catalog";
import { ui } from "@/i18n/en";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import { AppNavigation } from "@/shared/ui/app-navigation";
import styles from "./friends-page.module.css";

type Friend = {
	id: string;
	username: string;
	petSkin: string;
	petHair: string;
	xp: number;
	relationship?: "none" | "outgoing" | "incoming" | "friends";
	requestId?: string | null;
};

const DEMO_FRIENDS: Friend[] = [
	{ id: "nova", username: "nova_moves", petSkin: "sky", petHair: "cream", xp: 2840, relationship: "friends" },
	{ id: "milo", username: "milo_makes", petSkin: "moss", petHair: "honey", xp: 1920, relationship: "incoming", requestId: "demo-milo" },
	{ id: "bea", username: "bea_bloom", petSkin: "berry", petHair: "mint", xp: 3765, relationship: "outgoing", requestId: "demo-bea" },
	{ id: "sam", username: "tinywins", petSkin: "cinnamon", petHair: "lilac", xp: 1240, relationship: "none" },
	{ id: "leo", username: "leo_keepsgoing", petSkin: "plum", petHair: "rose", xp: 4210, relationship: "none" },
	{ id: "ivy", username: "ivy_everyday", petSkin: "ember", petHair: "mint", xp: 980, relationship: "none" },
];

type FriendshipActions = {
	send: (profileId: string) => void;
	cancel: (profileId: string) => void;
	respond: (requestId: string, accept: boolean) => void;
};

function FriendsLoading() {
	return (
		<div className={styles.centered} role="status">
			<span className={styles.loadingDot} />
			<p>{ui.friends.loading}</p>
		</div>
	);
}

function SignedOutFriends() {
	const router = useRouter();

	useEffect(() => {
		router.replace("/?auth=friends");
	}, [router]);

	return <FriendsLoading />;
}

function FriendAction({
	friend,
	context,
	actions,
	pending,
}: {
	friend: Friend;
	context: "search" | "friends" | "incoming" | "outgoing";
	actions: FriendshipActions;
	pending: boolean;
}) {
	if (context === "incoming" || friend.relationship === "incoming") {
		return (
			<div className={styles.requestActions}>
				<button
					type="button"
					className={styles.accept}
					disabled={pending}
					onClick={() => friend.requestId && actions.respond(friend.requestId, true)}
				>
					<Check aria-hidden="true" /><span>{ui.friends.acceptRequest}</span>
				</button>
				<button
					type="button"
					className={styles.decline}
					disabled={pending}
					onClick={() => friend.requestId && actions.respond(friend.requestId, false)}
					aria-label={`${ui.friends.declineRequest} @${friend.username}`}
				>
					<X aria-hidden="true" />
				</button>
			</div>
		);
	}
	if (context === "outgoing" || friend.relationship === "outgoing") {
		return (
			<button type="button" className={styles.requested} disabled={pending} onClick={() => actions.cancel(friend.id)}>
				<Clock3 aria-hidden="true" /><span>{ui.friends.requested}</span>
			</button>
		);
	}
	return (
		<button type="button" className={styles.addFriend} disabled={pending} onClick={() => actions.send(friend.id)}>
			<UserPlus aria-hidden="true" /><span>{ui.friends.addFriend}</span>
		</button>
	);
}

function FriendCards({
	friends,
	context,
	actions,
	pendingId,
}: {
	friends: Friend[];
	context: "search" | "friends" | "incoming" | "outgoing";
	actions: FriendshipActions;
	pendingId: string | null;
}) {
	return (
		<div className={styles.grid}>
			{friends.map((friend, index) => {
				const skin = getPetSkin(friend.petSkin);
				const hair = getPetHair(friend.petHair);
				const isFriend = context === "friends" || friend.relationship === "friends";
				const cardStyle = {
					"--friend-skin": skin.color,
					"--friend-hair": hair.color,
					"--card-delay": `${index * 55}ms`,
				} as CSSProperties;
				return (
					<article className={styles.card} style={cardStyle} key={friend.id}>
						<div className={styles.petPortrait}>
							<AkinMascotArtwork className={styles.pet} viewBox="400 900 4216 3216" />
						</div>
						<div className={styles.cardInfo}>
							<h2>@{friend.username}</h2>
							{!isFriend ? (
								<strong className={styles.xp}>
									<Sparkles aria-hidden="true" />
									{friend.xp.toLocaleString("en-US")} {ui.friends.xpUnit}
								</strong>
							) : null}
						</div>
						<div className={styles.cardEnd}>
							{isFriend ? (
								<strong className={styles.friendXp}>
									<Sparkles aria-hidden="true" />
									{friend.xp.toLocaleString("en-US")} <span>{ui.friends.xpUnit}</span>
								</strong>
							) : (
								<FriendAction
									friend={friend}
									context={context}
									actions={actions}
									pending={Boolean(pendingId && (pendingId === friend.id || pendingId === friend.requestId))}
								/>
							)}
						</div>
					</article>
				);
			})}
		</div>
	);
}

function FriendsView({
	results,
	isPending,
	dock,
	query,
	onQueryChange,
	showInitialResults = false,
	identity,
	connections,
	actions,
	pendingId,
	actionError,
}: {
	results: Friend[] | undefined;
	isPending: boolean;
	dock: "account" | "demo";
	query: string;
	onQueryChange: (query: string) => void;
	showInitialResults?: boolean;
	identity?: { username: string | null; balance: number; xp: number };
	connections: { friends: Friend[]; incoming: Friend[]; outgoing: Friend[] };
	actions: FriendshipActions;
	pendingId: string | null;
	actionError: string | null;
}) {
	const inputId = useId();
	const normalizedQuery = query.trim().replace(/^@/, "").toLowerCase();
	const canSearch = normalizedQuery.length >= 2;

	return (
		<main className={styles.page}>
			{identity ? (
				<>
					<UsernamePresence username={identity.username} />
					<AccountRewardsBalance balance={identity.balance} xp={identity.xp} />
				</>
			) : null}
			<section className={styles.shell}>
				<header className={styles.hero}>
					<span className={styles.titleMark} aria-hidden="true"><span>•ᴗ•</span></span>
					<div>
						<span className={styles.eyebrow}>{ui.friends.kicker}</span>
						<h1 aria-label={`${ui.friends.titleStart} ${ui.friends.titleAccent}`}>
							{ui.friends.titleStart}{" "}<em>{ui.friends.titleAccent}</em>
						</h1>
					</div>
					<p>{ui.friends.intro}</p>
				</header>

				<div className={styles.searchWrap}>
					<div className={styles.searchBox} data-pending={isPending || undefined}>
						<span className={styles.at} aria-hidden="true">@</span>
						<div className={styles.searchField}>
							<label htmlFor={inputId}><Search aria-hidden="true" /> {ui.friends.searchLabel}</label>
							<input
								id={inputId}
								value={query}
								onChange={(event) => onQueryChange(event.target.value.replace(/\s/g, ""))}
								placeholder={ui.friends.searchPlaceholder}
								autoComplete="off"
								spellCheck={false}
							/>
						</div>
						{query ? (
							<button type="button" onClick={() => onQueryChange("")} aria-label={ui.friends.clearSearch}>
								<X aria-hidden="true" />
							</button>
						) : null}
					</div>
				</div>
				{actionError ? <p className={styles.actionError} role="alert">{actionError}</p> : null}

				<section className={styles.results} aria-live="polite" aria-busy={isPending}>
					{!canSearch && !showInitialResults ? (
						connections.friends.length || connections.incoming.length || connections.outgoing.length
							? null
							: (
								<div className={styles.empty}>
									<div className={styles.faces} aria-hidden="true">
										<span>•ᴗ•</span><span>•⩊•</span><span>•◡•</span>
									</div>
									<h2>{ui.friends.emptyTitle}</h2>
									<p>{ui.friends.noFriendsCopy}</p>
								</div>
							)
					) : results?.length === 0 ? (
						<div className={styles.empty}>
							<UserRoundSearch aria-hidden="true" />
							<h2>{ui.friends.noResultsTitle(normalizedQuery)}</h2>
							<p>{ui.friends.noResultsCopy}</p>
						</div>
					) : results ? (
						<FriendCards
							friends={results}
							context="search"
							actions={actions}
							pendingId={pendingId}
						/>
					) : null}
				</section>

				{connections.incoming.length ? (
					<section className={styles.socialSection}>
						<div className={styles.sectionHeading}>
							<span>{ui.friends.requests}</span>
							<strong>{connections.incoming.length}</strong>
						</div>
						<FriendCards
							friends={connections.incoming}
							context="incoming"
							actions={actions}
							pendingId={pendingId}
						/>
					</section>
				) : null}

				{connections.friends.length ? (
					<section className={styles.socialSection}>
						<div className={styles.sectionHeading}>
							<span>{ui.friends.yourCrew}</span>
							<strong>{connections.friends.length}</strong>
						</div>
						<FriendCards
							friends={connections.friends}
							context="friends"
							actions={actions}
							pendingId={pendingId}
						/>
					</section>
				) : null}

				{connections.outgoing.length ? (
					<section className={`${styles.socialSection} ${styles.outgoingSection}`}>
						<div className={styles.sectionHeading}>
							<span>{ui.friends.outgoingRequests}</span>
							<strong>{connections.outgoing.length}</strong>
						</div>
						<FriendCards
							friends={connections.outgoing}
							context="outgoing"
							actions={actions}
							pendingId={pendingId}
						/>
					</section>
				) : null}
			</section>
			<AppNavigation
				accountControl={dock === "demo" ? <DemoAccountDock /> : <AccountDock />}
				preferencesControl={<AppPreferences placement="navigation" />}
			/>
		</main>
	);
}

function RegisteredFriends() {
	const [query, setQuery] = useState("");
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const dashboard = useQuery(api.dashboard.get);
	const connections = useQuery(api.friendships.list);
	const sendRequest = useMutation(api.friendships.send);
	const cancelRequest = useMutation(api.friendships.cancel);
	const respondToRequest = useMutation(api.friendships.respond);
	const normalizedQuery = query.trim().replace(/^@/, "").toLowerCase();
	const deferredQuery = useDeferredValue(normalizedQuery);
	const canSearch = deferredQuery.length >= 2;
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
			dock="account"
			identity={dashboard ? {
				username: dashboard.user.username,
				balance: dashboard.wallet.balance,
				xp: dashboard.wallet.xp,
			} : undefined}
			connections={connections ?? { friends: [], incoming: [], outgoing: [] }}
			actions={actions}
			pendingId={pendingId}
			actionError={actionError}
		/>
	);
}

export function DemoFriendsPage() {
	const [query, setQuery] = useState("");
	const [demoFriends, setDemoFriends] = useState(DEMO_FRIENDS);
	const [pendingId, setPendingId] = useState<string | null>(null);
	const demoAccountSnapshot = useSyncExternalStore(subscribeDemoAccount, getDemoAccountSnapshot, () => "");
	const demoWallet = useMemo(() => loadDemoWalletState(demoAccountSnapshot), [demoAccountSnapshot]);
	const results = useMemo(() => {
		const normalized = query.trim().replace(/^@/, "").toLowerCase();
		return normalized.length >= 2
			? demoFriends.filter((friend) => friend.username.startsWith(normalized))
			: demoFriends;
	}, [demoFriends, query]);
	const updateDemoRelationship = (
		id: string,
		relationship: Friend["relationship"],
	) => {
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
	const connections = {
		friends: demoFriends.filter((friend) => friend.relationship === "friends"),
		incoming: demoFriends.filter((friend) => friend.relationship === "incoming"),
		outgoing: demoFriends.filter((friend) => friend.relationship === "outgoing"),
	};
	return (
		<FriendsView
			results={results}
			isPending={false}
			dock="demo"
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

export function FriendsExperience() {
	return (
		<>
			<AuthLoading><FriendsLoading /></AuthLoading>
			<Unauthenticated><SignedOutFriends /></Unauthenticated>
			<Authenticated><RegisteredFriends /></Authenticated>
		</>
	);
}
