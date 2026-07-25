"use client";

import { AppShell } from "@/features/navigation/app-shell";
import { StreaksApp } from "@/features/streaks/app/streaks-app";
import { useGuestAccess } from "../model/use-guest-access";

/**
 * Shown when a guest reaches a route that needs an account. The home streaks
 * stay visible behind the auth modal so the app never feels like a dead end.
 */
export function GuestAuthGate({ onDismiss }: { onDismiss: () => void }) {
	const { chrome, authModal } = useGuestAccess({
		initialAuthOpen: true,
		onAuthDismiss: onDismiss,
	});

	return (
		<AppShell variant="hero" {...chrome} overlay={authModal}>
			<StreaksApp />
		</AppShell>
	);
}
