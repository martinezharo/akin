"use client";

import {
	ArrowUpRight,
	Flame,
	Search,
	Sparkles,
	UserPlus,
	X,
} from "lucide-react";
import { type CSSProperties, useDeferredValue, useId, useState } from "react";
import { getPetHair, getPetSkin } from "@/domain/pet/pet-catalog";
import { DemoAccountDock } from "@/features/account/account-dock";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import { AppNavigation } from "@/shared/ui/app-navigation";
import styles from "./friends-dev-page.module.css";

type DevVariant = 1 | 2 | 3;

type Friend = {
	id: string;
	username: string;
	petSkin: string;
	petHair: string;
	xp: number;
	streak: number;
	status: "today" | "momentum" | "resting";
};

const FRIENDS: Friend[] = [
	{ id: "nova", username: "nova_moves", petSkin: "sky", petHair: "cream", xp: 2840, streak: 18, status: "today" },
	{ id: "milo", username: "milo_makes", petSkin: "moss", petHair: "honey", xp: 1920, streak: 7, status: "momentum" },
	{ id: "bea", username: "bea_bloom", petSkin: "berry", petHair: "mint", xp: 3765, streak: 32, status: "today" },
	{ id: "sam", username: "tinywins", petSkin: "cinnamon", petHair: "lilac", xp: 1240, streak: 4, status: "resting" },
	{ id: "leo", username: "leo_keepsgoing", petSkin: "plum", petHair: "rose", xp: 4210, streak: 41, status: "momentum" },
	{ id: "ivy", username: "ivy_everyday", petSkin: "ember", petHair: "mint", xp: 980, streak: 12, status: "today" },
];

const STATUS_LABEL = {
	today: "Won today",
	momentum: "On a roll",
	resting: "Taking it easy",
} as const;

function getFriendStyle(friend: Friend, index: number) {
	return {
		"--friend-skin": getPetSkin(friend.petSkin).color,
		"--friend-hair": getPetHair(friend.petHair).color,
		"--friend-index": index,
	} as CSSProperties;
}

function PetPortrait({ friend, className }: { friend: Friend; className?: string }) {
	return (
		<span className={`${styles.portrait} ${className ?? ""}`} style={getFriendStyle(friend, 0)}>
			<AkinMascotArtwork className={styles.portraitArtwork} viewBox="400 900 4216 3216" />
		</span>
	);
}

function SearchControl({
	query,
	onQueryChange,
	variant,
}: {
	query: string;
	onQueryChange: (value: string) => void;
	variant: DevVariant;
}) {
	const inputId = useId();
	return (
		<div className={`${styles.search} ${styles[`search${variant}`]}`}>
			<label className="sr-only" htmlFor={inputId}>Find by username</label>
			<Search aria-hidden="true" />
			{variant === 2 ? <span aria-hidden="true">@</span> : null}
			<input
				id={inputId}
				value={query}
				onChange={(event) => onQueryChange(event.target.value.replace(/\s/g, ""))}
				placeholder={variant === 3 ? "Search the crew" : "Find @username"}
				autoComplete="off"
				spellCheck={false}
			/>
			{query ? (
				<button type="button" onClick={() => onQueryChange("")} aria-label="Clear search">
					<X aria-hidden="true" />
				</button>
			) : variant === 1 ? (
				<kbd>⌘ K</kbd>
			) : null}
		</div>
	);
}

function NoMatches({ query }: { query: string }) {
	return (
		<div className={styles.noMatches}>
			<span>•︵•</span>
			<strong>No @&quot;{query.replace(/^@/, "")}&quot; here yet</strong>
			<p>Check the spelling or invite them to your crew.</p>
		</div>
	);
}

function ConstellationView({
	friends,
	query,
	onQueryChange,
}: {
	friends: Friend[];
	query: string;
	onQueryChange: (value: string) => void;
}) {
	return (
		<div className={`${styles.canvas} ${styles.constellation}`}>
			<header className={styles.compactHeader}>
				<div>
					<span className={styles.microLabel}>Your circle · 6</span>
					<h1>Better together.</h1>
				</div>
				<button className={styles.addButton} type="button" aria-label="Add a friend"><UserPlus /></button>
			</header>
			<SearchControl query={query} onQueryChange={onQueryChange} variant={1} />

			{friends.length ? (
				<section className={styles.orbitBoard} aria-label="Your friends">
					<div className={styles.orbitCopy}>
						<span><Sparkles /> Today</span>
						<strong>{friends.filter((friend) => friend.status === "today").length}</strong>
						<p>friends kept a promise</p>
					</div>
					<div className={styles.orbitLine} aria-hidden="true" />
					{friends.map((friend, index) => (
						<article className={styles.orbitFriend} style={getFriendStyle(friend, index)} key={friend.id}>
							<PetPortrait friend={friend} />
							<strong>@{friend.username}</strong>
							<span className={styles.orbitStatus} data-status={friend.status} />
						</article>
					))}
				</section>
			) : <NoMatches query={query} />}

			<footer className={styles.pulseNote}>
				<span className={styles.pulseIcon}><Flame /></span>
				<p><strong>114 days</strong><br />kept by your circle this month</p>
				<ArrowUpRight />
			</footer>
		</div>
	);
}

function RollView({
	friends,
	query,
	onQueryChange,
}: {
	friends: Friend[];
	query: string;
	onQueryChange: (value: string) => void;
}) {
	return (
		<div className={`${styles.canvas} ${styles.roll}`}>
			<header className={styles.rollHeader}>
				<span className={styles.tinyFaces} aria-hidden="true">
					{FRIENDS.slice(0, 3).map((friend) => <PetPortrait friend={friend} key={friend.id} />)}
				</span>
				<p>THE PEOPLE<br />KEEPING YOU GOING</p>
				<h1>Your<br /><em>crew.</em></h1>
				<span className={styles.rollCount}>06<br /><small>friends</small></span>
			</header>

			<SearchControl query={query} onQueryChange={onQueryChange} variant={2} />

			<section className={styles.friendRoll} aria-label="Your friends">
				{friends.length ? friends.map((friend, index) => (
					<article className={styles.rollItem} style={getFriendStyle(friend, index)} key={friend.id}>
						<span className={styles.rollNumber}>0{index + 1}</span>
						<PetPortrait friend={friend} />
						<div>
							<h2>@{friend.username}</h2>
							<p><span data-status={friend.status} /> {STATUS_LABEL[friend.status]}</p>
						</div>
						<strong>{friend.streak}<small> days</small></strong>
					</article>
				)) : <NoMatches query={query} />}
			</section>
		</div>
	);
}

function StackView({
	friends,
	query,
	onQueryChange,
}: {
	friends: Friend[];
	query: string;
	onQueryChange: (value: string) => void;
}) {
	const friendsActiveToday = FRIENDS.filter((friend) => friend.status === "today");
	return (
		<div className={`${styles.canvas} ${styles.stack}`}>
			<header className={styles.stackHeader}>
				<div className={styles.stackTitle}>
					<span className={styles.titleMark} aria-hidden="true">
						<span>•ᴗ•</span>
					</span>
					<div><span>Your people</span><h1>Akin crew</h1></div>
				</div>
				<button type="button" className={styles.inviteButton}><UserPlus /><span>Invite</span></button>
			</header>

			<section className={styles.crewPulse} aria-label={`${friendsActiveToday.length} friends won today`}>
				<div className={styles.pulseFaces} aria-hidden="true">
					{friendsActiveToday.map((friend) => <PetPortrait friend={friend} key={friend.id} />)}
					<span>+{FRIENDS.length - friendsActiveToday.length}</span>
				</div>
				<div className={styles.crewPulseCopy}>
					<span>Today in your crew</span>
					<strong>{friendsActiveToday.length} little wins already</strong>
				</div>
				<Sparkles aria-hidden="true" />
			</section>

			<SearchControl query={query} onQueryChange={onQueryChange} variant={3} />

			{friends.length ? (
				<section className={styles.tileGrid} aria-label="Your friends">
					{friends.map((friend, index) => (
						<article className={styles.friendTile} style={getFriendStyle(friend, index)} key={friend.id}>
							<div className={styles.tilePortrait}>
								<PetPortrait friend={friend} />
								<span className={styles.tileStatus} data-status={friend.status} />
								<Sparkles className={styles.tileSpark} aria-hidden="true" />
							</div>
							<div className={styles.tileCopy}>
								<h2>@{friend.username}</h2>
								<p>{STATUS_LABEL[friend.status]}</p>
							</div>
							<strong className={styles.xpPill}><Sparkles /> {friend.xp.toLocaleString("en-US")} XP</strong>
						</article>
					))}
				</section>
			) : <NoMatches query={query} />}
		</div>
	);
}

export function FriendsDevPage({ variant }: { variant: DevVariant }) {
	const [query, setQuery] = useState("");
	const deferredQuery = useDeferredValue(query.trim().replace(/^@/, "").toLowerCase());
	const friends = deferredQuery.length
		? FRIENDS.filter((friend) => friend.username.includes(deferredQuery))
		: FRIENDS;

	return (
		<main className={styles.page} data-variant={variant}>
			{variant === 1 ? <ConstellationView friends={friends} query={query} onQueryChange={setQuery} /> : null}
			{variant === 2 ? <RollView friends={friends} query={query} onQueryChange={setQuery} /> : null}
			{variant === 3 ? <StackView friends={friends} query={query} onQueryChange={setQuery} /> : null}
			<AppNavigation
				accountControl={<DemoAccountDock />}
				preferencesControl={<AppPreferences placement="navigation" />}
			/>
		</main>
	);
}
