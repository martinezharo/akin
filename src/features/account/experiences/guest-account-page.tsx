"use client";

import { useRouter } from "next/navigation";
import { APP_HOME_PATH } from "@/shared/routing/experience-paths";
import { GuestAuthGate } from "./guest-auth-gate";

export function GuestAccountPage() {
	const router = useRouter();

	function dismissAuth() {
		if (window.history.length > 1) {
			router.back();
			return;
		}
		router.replace(APP_HOME_PATH);
	}

	return <GuestAuthGate onDismiss={dismissAuth} />;
}
