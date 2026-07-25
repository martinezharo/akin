"use client";

import { Inbox, Search, UserRoundSearch, UsersRound, X } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { AppShell } from "@/features/navigation/app-shell";
import { ui } from "@/i18n/en";
import {
	byWeeklyXp,
	EMPTY_CONNECTIONS,
	type Friend,
	type FriendConnections,
	type FriendshipActions,
	MIN_SEARCH_LENGTH,
	normalizeUsernameQuery,
} from "../model/friend-types";
import { FriendPortrait } from "./friend-portrait";
import { FriendRow } from "./friend-row";
import styles from "../friends-page.module.css";

/** The page does three separate jobs; one control decides which is on screen. */
type Panel = "crew" | "requests" | "discover";

const PANELS: { id: Panel; label: string; title: string; icon: ReactNode }[] = [
	{ id: "crew", label: ui.friends.tabCrew, title: ui.friends.yourCrew, icon: <UsersRound aria-hidden="true" /> },
	{ id: "requests", label: ui.friends.tabRequests, title: ui.friends.requests, icon: <Inbox aria-hidden="true" /> },
	{ id: "discover", label: ui.friends.tabDiscover, title: ui.friends.searchLabel, icon: <Search aria-hidden="true" /> },
];

export function FriendsLoading() {
	return (
		<div className={styles.centered} role="status">
			<span className={styles.loadingDot} />
			<p>{ui.friends.loading}</p>
		</div>
	);
}

function EmptyPanel({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) {
	return (
		<div className={styles.empty}>
			<span className={styles.emptyIcon} aria-hidden="true">{icon}</span>
			<h2>{title}</h2>
			<p>{copy}</p>
		</div>
	);
}

export function FriendsView({
	results,
	isPending,
	accountControl,
	query,
	onQueryChange,
	identity,
	connections: loadedConnections,
	actions,
	pendingId,
	actionError,
}: {
	results: Friend[] | undefined;
	isPending: boolean;
	/** Rendered in the shell's account slot: the dock, or a guest entry point. */
	accountControl: ReactNode;
	query: string;
	onQueryChange: (query: string) => void;
	identity?: { username: string | null; balance: number; xp: number };
	/** `undefined` while the connections query is still loading. */
	connections: FriendConnections | undefined;
	actions: FriendshipActions;
	pendingId: string | null;
	actionError: string | null;
}) {
	const inputId = useId();
	const [panel, setPanel] = useState<Panel>("crew");

	const normalizedQuery = normalizeUsernameQuery(query);
	const canSearch = normalizedQuery.length >= MIN_SEARCH_LENGTH;
	// Until the connections load we can't tell an empty crew from an unloaded
	// one, so the panels stay blank instead of flashing an empty state.
	const isLoadingConnections = loadedConnections === undefined;
	const connections = loadedConnections ?? EMPTY_CONNECTIONS;
	const crew = [...connections.friends].sort(byWeeklyXp);
	const counts: Record<Panel, number> = {
		crew: crew.length,
		requests: connections.incoming.length,
		discover: 0,
	};

	return (
		<AppShell
			variant="column"
			accountControl={accountControl}
			wallet={identity ? { kind: "account", balance: identity.balance, xp: identity.xp } : undefined}
			presence={identity ? { kind: "known", username: identity.username } : undefined}
		>
			<header className={styles.hero}>
				<div>
					<span className={styles.eyebrow}>{ui.friends.kicker}</span>
					<h1>{ui.friends.title}</h1>
				</div>
				{crew.length ? (
					<div className={styles.facepile} aria-hidden="true">
						{crew.slice(0, 4).map((friend) => (
							<FriendPortrait key={friend.id} friend={friend} size="2rem" className={styles.face} />
						))}
					</div>
				) : null}
			</header>

			<div
				className={styles.tabs}
				style={{ "--panel-index": PANELS.findIndex((entry) => entry.id === panel) } as React.CSSProperties}
				role="tablist"
				aria-label={ui.friends.title}
			>
				<span className={styles.tabIndicator} aria-hidden="true" />
				{PANELS.map((entry) => (
					<button
						key={entry.id}
						type="button"
						role="tab"
						id={`${inputId}-${entry.id}-tab`}
						aria-selected={panel === entry.id}
						aria-controls={`${inputId}-panel`}
						className={styles.tab}
						title={entry.title}
						onClick={() => setPanel(entry.id)}
					>
						{entry.icon}
						<span>{entry.label}</span>
						{counts[entry.id] ? <strong>{counts[entry.id]}</strong> : null}
					</button>
				))}
			</div>

			{actionError ? <p className={styles.actionError} role="alert">{actionError}</p> : null}

			<div
				className={styles.panel}
				role="tabpanel"
				id={`${inputId}-panel`}
				aria-labelledby={`${inputId}-${panel}-tab`}
			>
				{panel === "crew" ? (
					crew.length ? (
						<>
							<p className={styles.panelNote}>{ui.friends.crewSort}</p>
							<ul className={styles.rows}>
								{crew.map((friend, index) => (
									<FriendRow
										key={friend.id}
										friend={friend}
										context="friends"
										actions={actions}
										pendingId={pendingId}
										medal={index < 3 ? index + 1 : undefined}
									/>
								))}
							</ul>
						</>
					) : isLoadingConnections ? null : (
						<EmptyPanel icon={<UsersRound />} title={ui.friends.noFriendsYet} copy={ui.friends.noFriendsCopy} />
					)
				) : null}

				{panel === "requests" ? (
					connections.incoming.length || connections.outgoing.length ? (
						<>
							{connections.incoming.length ? (
								<ul className={styles.rows}>
									{connections.incoming.map((friend) => (
										<FriendRow
											key={friend.id}
											friend={friend}
											context="incoming"
											actions={actions}
											pendingId={pendingId}
										/>
									))}
								</ul>
							) : null}
							{connections.outgoing.length ? (
								<>
									<h2 className={styles.subLabel}>{ui.friends.outgoingRequests}</h2>
									<ul className={`${styles.rows} ${styles.mutedRows}`}>
										{connections.outgoing.map((friend) => (
											<FriendRow
												key={friend.id}
												friend={friend}
												context="outgoing"
												actions={actions}
												pendingId={pendingId}
											/>
										))}
									</ul>
								</>
							) : null}
						</>
					) : isLoadingConnections ? null : (
						<EmptyPanel icon={<Inbox />} title={ui.friends.noHellosTitle} copy={ui.friends.noHellosCopy} />
					)
				) : null}

				{panel === "discover" ? (
					<>
						<div className={styles.searchBox} data-pending={isPending || undefined}>
							<span className={styles.at} aria-hidden="true">@</span>
							<div className={styles.searchField}>
								<label htmlFor={`${inputId}-search`}>{ui.friends.searchLabel}</label>
								<input
									id={`${inputId}-search`}
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
						<div aria-live="polite" aria-busy={isPending}>
							{!canSearch ? (
								<EmptyPanel icon={<UserRoundSearch />} title={ui.friends.emptyTitle} copy={ui.friends.emptyCopy} />
							) : results?.length ? (
								<ul className={styles.rows}>
									{results.map((friend) => (
										<FriendRow
											key={friend.id}
											friend={friend}
											context="search"
											actions={actions}
											pendingId={pendingId}
										/>
									))}
								</ul>
							) : results ? (
								<EmptyPanel
									icon={<UserRoundSearch />}
									title={ui.friends.noResultsTitle(normalizedQuery)}
									copy={ui.friends.noResultsCopy}
								/>
							) : null}
						</div>
					</>
				) : null}
			</div>
		</AppShell>
	);
}
