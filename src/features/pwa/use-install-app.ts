"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const INSTALL_NUDGE_SEEN_KEY = "akin.install-nudge-seen.v1";
const INSTALL_NUDGE_CHANGE_EVENT = "akin:install-nudge-change";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface NavigatorWithStandalone extends Navigator {
	standalone?: boolean;
}

function isRunningStandalone() {
	return (
		window.matchMedia?.("(display-mode: standalone)").matches === true ||
		(window.navigator as NavigatorWithStandalone).standalone === true
	);
}

function isIosDevice() {
	return (
		/iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
		(window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
	);
}

function isMobileDevice() {
	return (
		/Android|iPad|iPhone|iPod|IEMobile|Opera Mini|Mobile/i.test(window.navigator.userAgent) ||
		(window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
	);
}

function subscribeToStandaloneState(onStoreChange: () => void) {
	const media = window.matchMedia("(display-mode: standalone)");
	media.addEventListener?.("change", onStoreChange);
	window.addEventListener("appinstalled", onStoreChange);
	return () => {
		media.removeEventListener?.("change", onStoreChange);
		window.removeEventListener("appinstalled", onStoreChange);
	};
}

function subscribeToDeviceState() {
	return () => undefined;
}

function hasSeenInstallNudge() {
	try {
		return window.localStorage.getItem(INSTALL_NUDGE_SEEN_KEY) === "true";
	} catch {
		return false;
	}
}

function subscribeToInstallNudge(onStoreChange: () => void) {
	window.addEventListener("storage", onStoreChange);
	window.addEventListener(INSTALL_NUDGE_CHANGE_EVENT, onStoreChange);
	return () => {
		window.removeEventListener("storage", onStoreChange);
		window.removeEventListener(INSTALL_NUDGE_CHANGE_EVENT, onStoreChange);
	};
}

export function useInstallApp() {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [hasInstalled, setHasInstalled] = useState(false);
	const isStandalone = useSyncExternalStore(subscribeToStandaloneState, isRunningStandalone, () => false);
	const isIos = useSyncExternalStore(subscribeToDeviceState, isIosDevice, () => false);
	const isMobile = useSyncExternalStore(subscribeToDeviceState, isMobileDevice, () => false);
	const hasSeenNudge = useSyncExternalStore(subscribeToInstallNudge, hasSeenInstallNudge, () => true);

	useEffect(() => {
		if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
			void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => undefined);
		}

		function rememberInstallPrompt(event: Event) {
			event.preventDefault();
			setInstallPrompt(event as BeforeInstallPromptEvent);
		}

		function hideInstallAction() {
			setInstallPrompt(null);
			setHasInstalled(true);
		}

		window.addEventListener("beforeinstallprompt", rememberInstallPrompt);
		window.addEventListener("appinstalled", hideInstallAction);
		return () => {
			window.removeEventListener("beforeinstallprompt", rememberInstallPrompt);
			window.removeEventListener("appinstalled", hideInstallAction);
		};
	}, []);

	async function requestInstall() {
		if (!installPrompt) return isIos ? "ios-guide" as const : "browser-guide" as const;
		await installPrompt.prompt();
		const choice = await installPrompt.userChoice;
		setInstallPrompt(null);
		if (choice.outcome === "accepted") setHasInstalled(true);
		return "prompted" as const;
	}

	function dismissInstallHighlight() {
		try {
			window.localStorage.setItem(INSTALL_NUDGE_SEEN_KEY, "true");
		} catch {
			// Keep installation usable even when browser storage is unavailable.
		}
		window.dispatchEvent(new Event(INSTALL_NUDGE_CHANGE_EVENT));
	}

	return {
		shouldOfferInstall: !hasInstalled && !isStandalone,
		shouldHighlightInstall: isMobile && !hasSeenNudge && !hasInstalled && !isStandalone,
		dismissInstallHighlight,
		requestInstall,
	};
}
