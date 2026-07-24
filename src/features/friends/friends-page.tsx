"use client";

import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { Search, Sparkles, UserRoundSearch, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type CSSProperties, useDeferredValue, useId, useMemo, useState } from "react";
import { useEffect } from "react";
import { api } from "@convex/_generated/api";
import { AccountDock, DemoAccountDock } from "@/features/account/account-dock";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { getPetHair, getPetSkin } from "@/domain/pet/pet-catalog";
import { ui } from "@/i18n/en";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import { AppNavigation } from "@/shared/ui/app-navigation";
import styles from "./friends-page.module.css";

type Friend = {
	id: string;
	username: string;
	displayName: string;
	petSkin: string;
	petHair: string;
	xp: number;
};

const DEMO_FRIENDS: Friend[] = [
	{ id: "nova", username: "nova_moves", displayName: "Nova", petSkin: "sky", petHair: "cream", xp: 2840 },
	{ id: "milo", username: "milo_makes", displayName: "Milo", petSkin: "moss", petHair: "honey", xp: 1920 },
	{ id: "bea", username: "bea_bloom", displayName: "Bea", petSkin: "berry", petHair: "mint", xp: 3765 },
	{ id: "sam", username: "tinywins", displayName: "Sam", petSkin: "cinnamon", petHair: "lilac", xp: 1240 },
	{ id: "leo", username: "leo_keepsgoing", displayName: "Leo", petSkin: "plum", petHair: "rose", xp: 4210 },
	{ id: "ivy", username: "ivy_everyday", displayName: "Ivy", petSkin: "ember", petHair: "mint", xp: 980 },
];

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

function FriendCards({ friends }: { friends: Friend[] }) {
	return (
		<div className={styles.grid}>
			{friends.map((friend, index) => {
				const skin = getPetSkin(friend.petSkin);
				const hair = getPetHair(friend.petHair);
				const cardStyle = {
					"--friend-skin": skin.color,
					"--friend-hair": hair.color,
					"--card-delay": `${index * 55}ms`,
				} as CSSProperties;
				return (
					<article className={styles.card} style={cardStyle} key={friend.id}>
						<div className={styles.petStage}>
							<span className={styles.petHalo} />
							<AkinMascotArtwork className={styles.pet} viewBox="400 900 4216 3216" />
						</div>
						<div className={styles.cardInfo}>
							<div>
								<h2>{friend.displayName}</h2>
								<p>@{friend.username}</p>
							</div>
							<strong><Sparkles aria-hidden="true" /> {friend.xp.toLocaleString("en-US")} XP</strong>
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
}: {
	results: Friend[] | undefined;
	isPending: boolean;
	dock: "account" | "demo";
	query: string;
	onQueryChange: (query: string) => void;
	showInitialResults?: boolean;
}) {
	const inputId = useId();
	const normalizedQuery = query.trim().replace(/^@/, "").toLowerCase();
	const canSearch = normalizedQuery.length >= 2;

	return (
		<main className={styles.page}>
			<section className={styles.shell}>
				<header className={styles.hero}>
					<span className={styles.eyebrow}><Sparkles aria-hidden="true" /> {ui.friends.kicker}</span>
					<h1>{ui.friends.titleStart} <em>{ui.friends.titleAccent}</em></h1>
					<p>{ui.friends.intro}</p>
				</header>

				<div className={styles.searchWrap}>
					<label htmlFor={inputId}>{ui.friends.searchLabel}</label>
					<div className={styles.searchBox} data-pending={isPending || undefined}>
						<Search aria-hidden="true" />
						<span className={styles.at} aria-hidden="true">@</span>
						<input
							id={inputId}
							value={query}
							onChange={(event) => onQueryChange(event.target.value.replace(/\s/g, ""))}
							placeholder={ui.friends.searchPlaceholder}
							autoComplete="off"
							spellCheck={false}
						/>
						{query ? (
							<button type="button" onClick={() => onQueryChange("")} aria-label={ui.friends.clearSearch}>
								<X aria-hidden="true" />
							</button>
						) : null}
					</div>
					<span className={styles.hint}>{ui.friends.searchHint}</span>
				</div>

				<section className={styles.results} aria-live="polite" aria-busy={isPending}>
					{!canSearch && !showInitialResults ? (
						<div className={styles.empty}>
							<div className={styles.faces} aria-hidden="true">
								<span>•ᴗ•</span><span>•⩊•</span><span>•◡•</span>
							</div>
							<h2>{ui.friends.emptyTitle}</h2>
							<p>{ui.friends.emptyCopy}</p>
						</div>
					) : results?.length === 0 ? (
						<div className={styles.empty}>
							<UserRoundSearch aria-hidden="true" />
							<h2>{ui.friends.noResultsTitle(normalizedQuery)}</h2>
							<p>{ui.friends.noResultsCopy}</p>
						</div>
					) : results ? <FriendCards friends={results} /> : null}
				</section>
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
	const normalizedQuery = query.trim().replace(/^@/, "").toLowerCase();
	const deferredQuery = useDeferredValue(normalizedQuery);
	const canSearch = deferredQuery.length >= 2;
	const results = useQuery(api.users.searchByUsername, canSearch ? { username: deferredQuery } : "skip");

	return (
		<FriendsView
			results={results}
			query={query}
			onQueryChange={setQuery}
			isPending={canSearch && (results === undefined || deferredQuery !== normalizedQuery)}
			dock="account"
		/>
	);
}

export function DemoFriendsPage() {
	const [query, setQuery] = useState("");
	const results = useMemo(() => {
		const normalized = query.trim().replace(/^@/, "").toLowerCase();
		return normalized.length >= 2
			? DEMO_FRIENDS.filter((friend) => friend.username.startsWith(normalized))
			: DEMO_FRIENDS;
	}, [query]);
	return (
		<FriendsView
			results={results}
			isPending={false}
			dock="demo"
			query={query}
			onQueryChange={setQuery}
			showInitialResults
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
