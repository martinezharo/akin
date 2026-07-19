"use client";

import { Download, Share, SquarePlus, X } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ui } from "@/i18n/en";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import styles from "./install-app.module.css";

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

function subscribeToDeviceState() {
	return () => undefined;
}

export function InstallApp() {
	const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
	const [hasInstalled, setHasInstalled] = useState(false);
	const [showIosGuide, setShowIosGuide] = useState(false);
	const isIosInstallAvailable = useSyncExternalStore(
		subscribeToDeviceState,
		() => !isRunningStandalone() && isIosDevice(),
		() => false,
	);
	const showIosAction = isIosInstallAvailable && !hasInstalled;

	useEffect(() => {
		if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
			void navigator.serviceWorker
				.register("/sw.js", { updateViaCache: "none" })
				.catch(() => undefined);
		}

		function rememberInstallPrompt(event: Event) {
			event.preventDefault();
			setInstallPrompt(event as BeforeInstallPromptEvent);
		}

		function hideInstallAction() {
			setInstallPrompt(null);
			setHasInstalled(true);
			setShowIosGuide(false);
		}

		window.addEventListener("beforeinstallprompt", rememberInstallPrompt);
		window.addEventListener("appinstalled", hideInstallAction);

		return () => {
			window.removeEventListener("beforeinstallprompt", rememberInstallPrompt);
			window.removeEventListener("appinstalled", hideInstallAction);
		};
	}, []);

	async function install() {
		if (!installPrompt) {
			setShowIosGuide(true);
			return;
		}

		await installPrompt.prompt();
		await installPrompt.userChoice;
		setInstallPrompt(null);
	}

	if (!installPrompt && !showIosAction) return null;

	return (
		<>
			<button className={styles.install} type="button" onClick={install}>
				<span className={styles.installIcon} aria-hidden="true">
					<Download />
				</span>
				<span className={styles.installCopy}>
					<small>{ui.pwa.installHint}</small>
					<strong>{ui.pwa.install}</strong>
				</span>
			</button>

			{showIosGuide ? (
				<ModalDialog className={styles.dialog} labelledBy="pwa-guide-title">
					<div className={styles.guide}>
						<button
							className={styles.close}
							type="button"
							aria-label={ui.pwa.closeGuide}
							onClick={() => setShowIosGuide(false)}
						>
							<X aria-hidden="true" />
						</button>
						<div className={styles.mark} aria-hidden="true">
							<span>A</span>
						</div>
						<p className={styles.kicker}>{ui.pwa.iosKicker}</p>
						<h2 id="pwa-guide-title">{ui.pwa.iosTitle}</h2>
						<p className={styles.intro}>{ui.pwa.iosCopy}</p>
						<ol className={styles.steps}>
							<li>
								<span aria-hidden="true">
									<Share />
								</span>
								<strong>{ui.pwa.iosShareStep}</strong>
							</li>
							<li>
								<span aria-hidden="true">
									<SquarePlus />
								</span>
								<strong>{ui.pwa.iosAddStep}</strong>
							</li>
						</ol>
						<p className={styles.done}>{ui.pwa.iosDone}</p>
					</div>
				</ModalDialog>
			) : null}
		</>
	);
}
