"use client";

import { Search, UserRoundSearch, X } from "lucide-react";
import { useId } from "react";
import { AccountDock, DemoAccountDock } from "@/features/account/components/account-dock";
import { AccountRewardsBalance } from "@/features/account/components/account-rewards-balance";
import { UsernamePresence } from "@/features/account/components/username-setup-modal";
import { AppShell } from "@/features/navigation/app-shell";
import { ui } from "@/i18n/en";
import {
	type Friend,
	type FriendConnections,
	type FriendshipActions,
	MIN_SEARCH_LENGTH,
	normalizeUsernameQuery,
} from "../model/friend-types";
import { FriendCards } from "./friend-cards";
import styles from "../friends-page.module.css";

export function FriendsLoading() {
	return (
		<div className={styles.centered} role="status">
			<span className={styles.loadingDot} />
			<p>{ui.friends.loading}</p>
		</div>
	);
}

function FriendSection({
	label,
	friends,
	context,
	actions,
	pendingId,
	muted = false,
}: {
	label: string;
	friends: Friend[];
	context: "friends" | "incoming" | "outgoing";
	actions: FriendshipActions;
	pendingId: string | null;
	muted?: boolean;
}) {
	if (!friends.length) return null;

	return (
		<section className={`${styles.socialSection} ${muted ? styles.outgoingSection : ""}`}>
			<div className={styles.sectionHeading}>
				<span>{label}</span>
				<strong>{friends.length}</strong>
			</div>
			<FriendCards friends={friends} context={context} actions={actions} pendingId={pendingId} />
		</section>
	);
}

export function FriendsView({
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
	connections: FriendConnections;
	actions: FriendshipActions;
	pendingId: string | null;
	actionError: string | null;
}) {
	const inputId = useId();
	const normalizedQuery = normalizeUsernameQuery(query);
	const canSearch = normalizedQuery.length >= MIN_SEARCH_LENGTH;
	const hasConnections = Boolean(
		connections.friends.length || connections.incoming.length || connections.outgoing.length,
	);

	return (
		<AppShell
			variant="column"
			accountControl={dock === "demo" ? <DemoAccountDock /> : <AccountDock />}
			backdrop={identity ? <AccountRewardsBalance balance={identity.balance} xp={identity.xp} /> : null}
			overlay={identity ? <UsernamePresence username={identity.username} /> : null}
		>
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
					hasConnections ? null : (
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
					<FriendCards friends={results} context="search" actions={actions} pendingId={pendingId} />
				) : null}
			</section>

			<FriendSection label={ui.friends.requests} friends={connections.incoming} context="incoming" actions={actions} pendingId={pendingId} />
			<FriendSection label={ui.friends.yourCrew} friends={connections.friends} context="friends" actions={actions} pendingId={pendingId} />
			<FriendSection label={ui.friends.outgoingRequests} friends={connections.outgoing} context="outgoing" actions={actions} pendingId={pendingId} muted />
		</AppShell>
	);
}
