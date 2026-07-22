"use client";

import { UserRound } from "lucide-react";
import { useState } from "react";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { AppNavigation } from "@/shared/ui/app-navigation";
import { GuestRewardsBalance } from "./account-rewards-balance";
import { AuthModal } from "./auth-modal";
import styles from "./account.module.css";

export function GuestAccountControls({
	initialAuthOpen = false,
	onAuthDismiss,
	showRewards = true,
}: {
	initialAuthOpen?: boolean;
	onAuthDismiss?: () => void;
	showRewards?: boolean;
}) {
	const [authOpen, setAuthOpen] = useState(initialAuthOpen);
	const requestAccess = () => setAuthOpen(true);

	function dismissAuth() {
		setAuthOpen(false);
		onAuthDismiss?.();
	}

	return (
		<>
			{showRewards ? <GuestRewardsBalance onRequestAccess={requestAccess} /> : null}
			<AppNavigation
				onLockedPetClick={requestAccess}
				accountControl={(
					<button className={styles.accountButton} type="button" onClick={requestAccess} aria-label="Sign in or open your account">
						<UserRound aria-hidden="true" />
						<span>Me</span>
					</button>
				)}
				preferencesControl={<AppPreferences placement="navigation" />}
			/>
			{authOpen ? <AuthModal onDismiss={dismissAuth} /> : null}
		</>
	);
}
