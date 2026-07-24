"use client";

import { useRouter } from "next/navigation";
import { GuestAccountControls } from "@/features/account/guest-account-controls";
import { StreaksApp } from "@/features/streaks/app/streaks-app";
import { ui } from "@/i18n/en";
import styles from "../pet-page.module.css";

export function GuestPetGate({ isLoading }: { isLoading: boolean }) {
	const router = useRouter();

	if (isLoading) return <div className={styles.loading} role="status">{ui.pet.guestGate.checking}</div>;

	return (
		<>
			<StreaksApp />
			<GuestAccountControls initialAuthOpen onAuthDismiss={() => router.replace("/")} />
		</>
	);
}
