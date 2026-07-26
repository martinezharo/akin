"use client";

import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { ui } from "@/i18n";
import { AuthModal } from "../components/auth-modal";
import styles from "../account.module.css";

export function GuestAccountButton({ onClick }: { onClick: () => void }) {
	return (
		<button className={styles.accountButton} type="button" onClick={onClick} aria-label={ui.account.guestButtonLabel}>
			<UserRound aria-hidden="true" />
			<span>{ui.account.me}</span>
		</button>
	);
}

type GuestAccessOptions = {
	initialAuthOpen?: boolean;
	authCallbackUrl?: string;
	onAuthDismiss?: () => void;
	showRewards?: boolean;
};

/**
 * Guest experiences all share the same shape: navigation entries that need an
 * account are locked behind the auth modal, and the rewards balance nudges
 * towards signing up. Returning the pieces — rather than a fixed layout — lets
 * each page hand them to `AppShell` in the right slots.
 */
export function useGuestAccess({
	initialAuthOpen = false,
	authCallbackUrl,
	onAuthDismiss,
	showRewards = true,
}: GuestAccessOptions = {}) {
	const [authOpen, setAuthOpen] = useState(initialAuthOpen);
	const requestAccess = () => setAuthOpen(true);

	useEffect(() => {
		if (!initialAuthOpen) return;
		// This option also handles auth requests that arrive after a client-side redirect.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setAuthOpen(true);
	}, [initialAuthOpen]);

	function dismissAuth() {
		setAuthOpen(false);
		onAuthDismiss?.();
	}

	return {
		chrome: {
			onLockedFriendsClick: requestAccess,
			onLockedPetClick: requestAccess,
			accountControl: <GuestAccountButton onClick={requestAccess} />,
			wallet: showRewards ? ({ kind: "guest", onRequestAccess: requestAccess } as const) : null,
			presence: { kind: "guest", onRequestAccess: requestAccess } as const,
		},
		authModal: authOpen ? <AuthModal onDismiss={dismissAuth} callbackURL={authCallbackUrl} /> : null,
	};
}
