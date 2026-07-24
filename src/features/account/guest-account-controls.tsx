"use client";

import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { ui } from "@/i18n/en";
import { AppNavigation } from "@/shared/ui/app-navigation";
import { GuestRewardsBalance } from "./account-rewards-balance";
import { AuthModal } from "./auth-modal";
import styles from "./account.module.css";

export function GuestAccountControls({
	initialAuthOpen = false,
	authCallbackUrl,
	onAuthDismiss,
	showRewards = true,
}: {
	initialAuthOpen?: boolean;
	authCallbackUrl?: string;
	onAuthDismiss?: () => void;
	showRewards?: boolean;
}) {
	const [authOpen, setAuthOpen] = useState(initialAuthOpen);
	const requestAccess = () => setAuthOpen(true);

	useEffect(() => {
		if (!initialAuthOpen) return;
		// This prop also handles auth requests that arrive after a client-side redirect.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setAuthOpen(true);
	}, [initialAuthOpen]);

	function dismissAuth() {
		setAuthOpen(false);
		onAuthDismiss?.();
	}

	return (
		<>
			{showRewards ? <GuestRewardsBalance onRequestAccess={requestAccess} /> : null}
			<AppNavigation
				onLockedFriendsClick={requestAccess}
				onLockedPetClick={requestAccess}
				accountControl={(
					<button className={styles.accountButton} type="button" onClick={requestAccess} aria-label={ui.account.guestButtonLabel}>
						<UserRound aria-hidden="true" />
						<span>{ui.account.me}</span>
					</button>
				)}
				preferencesControl={<AppPreferences placement="navigation" />}
			/>
			{authOpen ? <AuthModal onDismiss={dismissAuth} callbackURL={authCallbackUrl} /> : null}
		</>
	);
}
