"use client";

import { useRouter } from "next/navigation";
import { GuestAuthGate } from "@/features/account/experiences/guest-auth-gate";
import { AppShell } from "@/features/navigation/app-shell";
import { ui } from "@/i18n/en";
import styles from "../pet-page.module.css";

export function GuestPetGate({ isLoading }: { isLoading: boolean }) {
	const router = useRouter();

	if (isLoading) {
		return (
			<AppShell variant="canvas">
				<p className={styles.loading} role="status">{ui.pet.guestGate.checking}</p>
			</AppShell>
		);
	}

	return <GuestAuthGate onDismiss={() => router.replace("/")} />;
}
