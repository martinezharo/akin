"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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

export function useInstallApp() {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [hasInstalled, setHasInstalled] = useState(false);
	const isStandalone = useSyncExternalStore(subscribeToStandaloneState, isRunningStandalone, () => false);
	const isIos = useSyncExternalStore(subscribeToDeviceState, isIosDevice, () => false);

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

	return {
		shouldOfferInstall: !hasInstalled && !isStandalone,
		requestInstall,
	};
}
