"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { LANDING_PATH } from "@/shared/routing/experience-paths";

/**
 * Signing out has to move the visitor, not just clear the session. Every
 * account route belongs to the account, so staying put flips the page into the
 * guest gate and greets whoever just left with a sign-in modal — the app asking
 * them back in the same second they walked out. The front door is the one place
 * that plainly reads as "you are out", and it still offers the demo and a way
 * back in.
 *
 * The navigation is queued *before* the session call so the account page is
 * already on its way out when the auth state flips, instead of flashing the
 * guest gate on the way.
 */
export function useSignOut() {
	const router = useRouter();
	const [isSigningOut, setIsSigningOut] = useState(false);

	async function signOut() {
		if (isSigningOut) return;
		setIsSigningOut(true);
		router.replace(LANDING_PATH);
		try {
			await authClient.signOut();
		} catch {
			// The session survived; let them try again from wherever they land.
			setIsSigningOut(false);
		}
	}

	return { signOut, isSigningOut };
}
