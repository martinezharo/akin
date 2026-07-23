"use client";

import { useRouter } from "next/navigation";
import { GuestAccountControls } from "@/features/account/guest-account-controls";
import { StreaksApp } from "@/features/streaks/app/streaks-app";
import styles from "../pet-page.module.css";

export function GuestPetGate({ isLoading }: { isLoading: boolean }) {
	const router = useRouter();

	if (isLoading) return <div className={styles.loading} role="status">Checking your companion’s guest list…</div>;

	return (
		<>
			<StreaksApp />
			<GuestAccountControls initialAuthOpen onAuthDismiss={() => router.replace("/")} />
		</>
	);
}
