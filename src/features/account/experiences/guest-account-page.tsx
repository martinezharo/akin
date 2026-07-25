"use client";

import { useRouter } from "next/navigation";
import { GuestAuthGate } from "./guest-auth-gate";

export function GuestAccountPage() {
	const router = useRouter();

	function dismissAuth() {
		if (window.history.length > 1) {
			router.back();
			return;
		}
		router.replace("/");
	}

	return <GuestAuthGate onDismiss={dismissAuth} />;
}
