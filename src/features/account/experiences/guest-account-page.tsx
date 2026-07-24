"use client";

import { useRouter } from "next/navigation";
import { StreaksApp } from "@/features/streaks/app/streaks-app";
import { GuestAccountControls } from "../guest-account-controls";

export function GuestAccountPage() {
	const router = useRouter();

	function dismissAuth() {
		if (window.history.length > 1) {
			router.back();
			return;
		}
		router.replace("/");
	}

	return (
		<>
			<StreaksApp />
			<GuestAccountControls initialAuthOpen onAuthDismiss={dismissAuth} />
		</>
	);
}
