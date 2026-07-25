"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AccountRewardsBalance, GuestRewardsBalance } from "@/features/account/components/account-rewards-balance";
import { RemoteUsernamePresence, UsernamePresence } from "@/features/account/components/username-setup-modal";
import { AppNavigation, type AppNavigationProps } from "./app-navigation";

/** The wallet pills: real balances, or the teaser a guest can tap to sign up. */
export type WalletSlot =
	| { kind: "account"; balance: number; xp: number }
	| { kind: "guest"; onRequestAccess: () => void };

/**
 * The username badge — or the setup modal when a signed-in account has no
 * username yet. `remote` lets a page defer to the identity query instead of
 * threading the value down itself.
 */
export type PresenceSlot =
	| { kind: "known"; username: string | null | undefined; today?: string; timeZone?: string }
	| { kind: "remote"; today?: string; timeZone?: string };

/**
 * Everything that frames a page but must not blink when the page changes.
 *
 * `undefined` means "this page has nothing to say yet" — typically because its
 * data is still loading — and keeps whatever the chrome is already showing.
 * `null` is the explicit "hide this". That distinction is what stops the wallet
 * from disappearing and reappearing on every navigation.
 */
export type AppChromeSlots = AppNavigationProps & {
	wallet?: WalletSlot | null;
	presence?: PresenceSlot | null;
};

const EMPTY_SLOTS: AppChromeSlots = {};

const AppChromeContext = createContext<((slots: AppChromeSlots) => void) | null>(null);

function sameSlots(a: AppChromeSlots, b: AppChromeSlots) {
	return (
		a.accountControl === b.accountControl
		&& a.onLockedFriendsClick === b.onLockedFriendsClick
		&& a.onLockedPetClick === b.onLockedPetClick
		&& sameWallet(a.wallet, b.wallet)
		&& samePresence(a.presence, b.presence)
	);
}

function sameWallet(a: WalletSlot | null | undefined, b: WalletSlot | null | undefined) {
	if (!a || !b) return a === b;
	if (a.kind !== b.kind) return false;
	return a.kind === "guest" ? true : b.kind === "account" && a.balance === b.balance && a.xp === b.xp;
}

function samePresence(a: PresenceSlot | null | undefined, b: PresenceSlot | null | undefined) {
	if (!a || !b) return a === b;
	if (a.kind !== b.kind) return false;
	if (a.today !== b.today || a.timeZone !== b.timeZone) return false;
	return a.kind === "remote" || (b.kind === "known" && a.username === b.username);
}

/**
 * Mounts the persistent frame — navigation, wallet, presence — once, above the
 * router. Pages publish into it with `useAppChrome`, so a route change swaps
 * only the page body and the chrome keeps its DOM (and its state) intact.
 */
export function AppChromeProvider({ children }: { children: ReactNode }) {
	const [slots, setSlots] = useState<AppChromeSlots>(EMPTY_SLOTS);

	const publish = useCallback((next: AppChromeSlots) => {
		setSlots((current) => {
			const merged: AppChromeSlots = {
				...next,
				wallet: next.wallet === undefined ? current.wallet : next.wallet,
				presence: next.presence === undefined ? current.presence : next.presence,
			};
			return sameSlots(current, merged) ? current : merged;
		});
	}, []);

	const { wallet, presence, ...navigation } = slots;

	return (
		<AppChromeContext value={publish}>
			{children}
			{wallet ? (
				wallet.kind === "guest"
					? <GuestRewardsBalance onRequestAccess={wallet.onRequestAccess} />
					: <AccountRewardsBalance balance={wallet.balance} xp={wallet.xp} />
			) : null}
			{presence ? (
				presence.kind === "remote"
					? <RemoteUsernamePresence today={presence.today} timeZone={presence.timeZone} />
					: <UsernamePresence username={presence.username} today={presence.today} timeZone={presence.timeZone} />
			) : null}
			<AppNavigation {...navigation} />
		</AppChromeContext>
	);
}

/** Publishes this page's chrome. Every page frame calls it, so nothing goes stale. */
export function useAppChrome(slots: AppChromeSlots) {
	const publish = useContext(AppChromeContext);
	const { accountControl, onLockedFriendsClick, onLockedPetClick, wallet, presence } = slots;

	// Slot objects are rebuilt on every render, so the publisher — not a
	// dependency list — is what decides whether anything actually changed.
	useEffect(() => {
		publish?.({ accountControl, onLockedFriendsClick, onLockedPetClick, wallet, presence });
	});
}
