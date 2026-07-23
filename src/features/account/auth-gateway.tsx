"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { RefreshCw, WifiOff, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { StreaksApp } from "@/features/streaks/app/streaks-app";
import { StreaksView } from "@/features/streaks/app/streaks-view";
import { useLocalDay } from "@/features/streaks/app/use-local-day";
import { useRegisteredStreaksController } from "@/features/streaks/app/use-registered-streaks-controller";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { AppNavigation } from "@/shared/ui/app-navigation";
import { AccountDock } from "./account-dock";
import { AccountRewardsBalance } from "./account-rewards-balance";
import { GuestAccountControls } from "./guest-account-controls";
import { UsernamePresence } from "./username-setup-modal";
import styles from "./account.module.css";

function AkinLoadingMark() {
	return (
		<span className={styles.loadingLogo} aria-hidden="true">
			<Image src="/brand/akin-app-icon.svg" alt="" width={56} height={56} priority />
		</span>
	);
}

function GuestExperience({ backendUnavailable = false }: { backendUnavailable?: boolean }) {
	return (
		<>
			<StreaksApp />
			{backendUnavailable ? (
				<div className={styles.guestDock} data-offline>
					<span><WifiOff aria-hidden="true" /> Convex is taking a nap</span>
					<button type="button" onClick={() => window.location.reload()}>
						<RefreshCw aria-hidden="true" /> Try again
					</button>
				</div>
			) : null}
			<GuestAccountControls showRewards={!backendUnavailable} />
		</>
	);
}

function LoadingExperience() {
	const [timedOut, setTimedOut] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(() => setTimedOut(true), 4_000);
		return () => clearTimeout(timeout);
	}, []);

	if (timedOut) return <GuestExperience backendUnavailable />;

	return (
		<div className={styles.loading} role="status">
			<AkinLoadingMark />
			<p>Waking up your streaks…</p>
		</div>
	);
}

function RegisteredExperience() {
	const today = useLocalDay();
	const { controller, dashboard, isLoading, notice, dismissNotice, user } =
		useRegisteredStreaksController(today);

	if (isLoading || !dashboard) {
		return (
			<div className={styles.loading} role="status">
				<AkinLoadingMark />
				<p>Gathering your little wins…</p>
			</div>
		);
	}

	return (
		<>
			<UsernamePresence username={user?.username} />
			<StreaksView controller={controller}>
				<AccountRewardsBalance balance={dashboard.wallet.balance} xp={dashboard.wallet.xp} />
				<AppNavigation
					accountControl={<AccountDock />}
					preferencesControl={<AppPreferences placement="navigation" />}
				/>
				{notice ? (
					<div className={styles.notice} role="status">
						<p>{notice}</p>
						<button type="button" onClick={dismissNotice} aria-label="Dismiss"><X aria-hidden="true" /></button>
					</div>
				) : null}
			</StreaksView>
		</>
	);
}

export function AuthGateway() {
	return (
		<>
			<AuthLoading><LoadingExperience /></AuthLoading>
			<Unauthenticated><GuestExperience /></Unauthenticated>
			<Authenticated><RegisteredExperience /></Authenticated>
		</>
	);
}
