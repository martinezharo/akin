"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { RefreshCw, WifiOff, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AppShell } from "@/features/navigation/app-shell";
import { StreaksApp } from "@/features/streaks/app/streaks-app";
import { StreaksHomeShell } from "@/features/streaks/app/streaks-home-shell";
import { useLocalDay } from "@/features/streaks/app/use-local-day";
import { useRegisteredStreaksController } from "@/features/streaks/app/use-registered-streaks-controller";
import { AccountDock } from "../components/account-dock";
import { useGuestAccess } from "../model/use-guest-access";
import { ui } from "@/i18n/en";
import styles from "../account.module.css";

function HomeLoading({ message }: { message: string }) {
	return (
		<div className={styles.loading} role="status">
			<span className={styles.loadingLogo} aria-hidden="true">
				<Image src="/brand/akin-app-icon.svg" alt="" width={56} height={56} priority />
			</span>
			<p>{message}</p>
		</div>
	);
}

function GuestExperience({ backendUnavailable = false }: { backendUnavailable?: boolean }) {
	const [friendAuthRequest, setFriendAuthRequest] = useState(false);
	const { navProps, rewards, authModal } = useGuestAccess({
		initialAuthOpen: friendAuthRequest,
		authCallbackUrl: friendAuthRequest ? "/friends" : undefined,
		showRewards: !backendUnavailable,
	});

	useEffect(() => {
		const url = new URL(window.location.href);
		if (url.searchParams.get("auth") !== "friends") return;
		window.history.replaceState(window.history.state, "", "/");
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setFriendAuthRequest(true);
	}, []);

	return (
		<AppShell variant="hero" {...navProps} backdrop={rewards} overlay={authModal}>
			<StreaksApp />
			{backendUnavailable ? (
				<div className={styles.guestDock} data-offline>
					<span><WifiOff aria-hidden="true" /> {ui.account.offline.kicker}</span>
					<button type="button" onClick={() => window.location.reload()}>
						<RefreshCw aria-hidden="true" /> {ui.account.offline.retry}
					</button>
				</div>
			) : null}
		</AppShell>
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
		<AppShell variant="hero">
			<HomeLoading message={ui.account.loading.wakingUp} />
		</AppShell>
	);
}

function RegisteredExperience() {
	const today = useLocalDay();
	const { controller, dashboard, isLoading, notice, dismissNotice, user } =
		useRegisteredStreaksController(today);

	if (isLoading || !dashboard) {
		return (
			<AppShell variant="hero">
				<HomeLoading message={ui.account.loading.gathering} />
			</AppShell>
		);
	}

	return (
		<StreaksHomeShell
			controller={controller}
			accountControl={<AccountDock />}
			wallet={dashboard.wallet}
			username={user?.username}
		>
			{notice ? (
				<div className={styles.notice} role="status">
					<p>{notice}</p>
					<button type="button" onClick={dismissNotice} aria-label={ui.account.dismiss}><X aria-hidden="true" /></button>
				</div>
			) : null}
		</StreaksHomeShell>
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
