"use client";

import {
	ArrowLeft,
	ArrowRight,
	Download,
	Ellipsis,
	Moon,
	Settings2,
	Share,
	SquarePlus,
	Sun,
	X,
} from "lucide-react";
import { flushSync } from "react-dom";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useInstallApp } from "@/features/pwa/use-install-app";
import { setRuntimeLanguage, ui } from "@/i18n";
import type { Language } from "@/i18n/config";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import { isRewardSoundEnabled, setRewardSoundEnabled } from "@/features/rewards/reward-sound-preference";
import { LanguageMenu } from "./language-menu";
import {
	activeLanguage,
	readStoredPreferences,
	runThemeTransition,
	savePreferences,
	selectLanguage,
	type Theme,
} from "@/shared/preferences/preferences-storage";
import styles from "./app-preferences.module.css";

export function AppPreferences({ placement = "floating" }: { placement?: "floating" | "navigation" }) {
	const [open, setOpen] = useState(false);
	const [installGuide, setInstallGuide] = useState<"ios" | "browser" | null>(null);
	const [showInstallNotice, setShowInstallNotice] = useState(false);
	const [theme, setTheme] = useState<Theme>("light");
	const [language, setLanguage] = useState<Language>("en");
	const [languageChosen, setLanguageChosen] = useState(false);
	const [rewardSound, setRewardSound] = useState(true);
	const [themeAnimation, setThemeAnimation] = useState<Theme | null>(null);
	const { shouldOfferInstall, shouldHighlightInstall, dismissInstallHighlight, requestInstall } = useInstallApp();
	const titleId = useId();
	const descriptionId = useId();
	const themeAnimationTimer = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(themeAnimationTimer.current), []);

	function showPreferences() {
		const stored = readStoredPreferences();
		setTheme(stored.theme);
		setLanguage(activeLanguage(stored));
		setLanguageChosen(stored.language !== undefined);
		setRewardSound(isRewardSoundEnabled());
		setShowInstallNotice(shouldHighlightInstall);
		setOpen(true);
		if (shouldHighlightInstall) dismissInstallHighlight();
	}

	function chooseTheme(nextTheme: Theme) {
		if (nextTheme === theme) return;

		window.clearTimeout(themeAnimationTimer.current);
		setThemeAnimation(nextTheme);
		themeAnimationTimer.current = window.setTimeout(() => setThemeAnimation(null), 560);

		runThemeTransition(() => {
			flushSync(() => setTheme(nextTheme));
			savePreferences({ theme: nextTheme, language: languageChosen ? language : undefined });
		});
	}

	function chooseLanguage(nextLanguage: Language) {
		setLanguage(nextLanguage);
		setLanguageChosen(true);
		setRuntimeLanguage(nextLanguage);
		selectLanguage(nextLanguage);
	}

	function toggleRewardSound() {
		setRewardSound((current) => {
			setRewardSoundEnabled(!current);
			return !current;
		});
	}

	function dismiss() {
		setOpen(false);
		setInstallGuide(null);
		setShowInstallNotice(false);
	}

	async function install() {
		setShowInstallNotice(false);
		const result = await requestInstall();
		if (result === "ios-guide") setInstallGuide("ios");
		if (result === "browser-guide") setInstallGuide("browser");
	}

	return (
		<>
			<button
				className={styles.trigger}
				data-placement={placement}
				type="button"
				onClick={showPreferences}
				aria-label={shouldHighlightInstall ? `${ui.preferences.open}. ${ui.preferences.installNotice}` : ui.preferences.open}
			>
				<Settings2 aria-hidden="true" />
				{placement === "navigation" ? <span>{ui.preferences.triggerLabel}</span> : null}
				{shouldHighlightInstall ? <span className={styles.noticeBadge} aria-hidden="true">!</span> : null}
			</button>

			{open ? (
				<ModalDialog
					className={styles.dialog}
					labelledBy={titleId}
					describedBy={descriptionId}
					onDismiss={dismiss}
				>
					<div className={styles.card} data-guide={Boolean(installGuide)}>
						<button className={styles.close} type="button" onClick={dismiss} aria-label={ui.preferences.close}>
							<X aria-hidden="true" />
						</button>

						{installGuide ? (
							<InstallGuide kind={installGuide} titleId={titleId} descriptionId={descriptionId} onBack={() => setInstallGuide(null)} />
						) : (
							<>
								<div className={styles.head}>
									<div className={styles.mark} aria-hidden="true"><Settings2 /></div>
									<p className={styles.kicker}>{ui.preferences.kicker}</p>
									<h2 id={titleId}>{ui.preferences.title}</h2>
									<p className={styles.intro} id={descriptionId}>{ui.preferences.intro}</p>
								</div>

								<div className={styles.settingsList}>
									<section className={styles.setting} aria-labelledby={`${titleId}-theme`}>
										<div className={styles.settingCopy}><strong id={`${titleId}-theme`}>{ui.preferences.theme}</strong><small>{ui.preferences.themeHint}</small></div>
										<div className={styles.themePicker} data-theme={theme} role="group" aria-label={ui.preferences.theme}>
											<ThemeButton icon={<Sun />} label={ui.preferences.light} selected={theme === "light"} animating={themeAnimation === "light"} onClick={() => chooseTheme("light")} />
											<ThemeButton icon={<Moon />} label={ui.preferences.dark} selected={theme === "dark"} animating={themeAnimation === "dark"} onClick={() => chooseTheme("dark")} />
										</div>
									</section>

									<section className={styles.setting} aria-labelledby={`${titleId}-language-label`}>
										<div className={styles.settingCopy}><strong id={`${titleId}-language-label`}>{ui.preferences.language}</strong><small>{ui.preferences.languageHint}</small></div>
										<LanguageMenu id={`${titleId}-language`} labelledBy={`${titleId}-language-label`} value={language} onChange={chooseLanguage} />
									</section>

									<section className={styles.setting} aria-labelledby={`${titleId}-sound`}>
										<div className={styles.settingCopy}><strong id={`${titleId}-sound`}>{ui.preferences.rewardSound}</strong><small>{ui.preferences.rewardSoundHint}</small></div>
										<button className={styles.soundToggle} type="button" aria-pressed={rewardSound} onClick={toggleRewardSound}>
											<i aria-hidden="true" />
										</button>
									</section>
								</div>

								{shouldOfferInstall ? (
									<button className={styles.install} type="button" data-notice={showInstallNotice || undefined} onClick={() => void install()}>
										<span><Download aria-hidden="true" /></span>
										<span>
											<strong>{ui.preferences.installTitle}</strong>
											{showInstallNotice ? <em className={styles.installNotice}>{ui.preferences.newInstall}</em> : null}
											<small>{ui.preferences.installCopy}</small>
										</span>
										<ArrowRight aria-hidden="true" />
									</button>
								) : null}
							</>
						)}
					</div>
				</ModalDialog>
			) : null}
		</>
	);
}

function ThemeButton({ icon, label, selected, animating, onClick }: { icon: ReactNode; label: string; selected: boolean; animating: boolean; onClick: () => void }) {
	return (
		<button type="button" data-selected={selected} data-animating={animating} aria-pressed={selected} onClick={onClick}>
			{icon}
			<strong>{label}</strong>
		</button>
	);
}

function InstallGuide({ kind, titleId, descriptionId, onBack }: { kind: "ios" | "browser"; titleId: string; descriptionId: string; onBack: () => void }) {
	const browserGuide = kind === "browser";
	return (
		<>
			<div className={styles.installMark} aria-hidden="true"><Download /></div>
			<p className={styles.kicker}>{browserGuide ? ui.pwa.browserKicker : ui.pwa.iosKicker}</p>
			<h2 id={titleId}>{browserGuide ? ui.pwa.browserTitle : ui.pwa.iosTitle}</h2>
			<p className={styles.intro} id={descriptionId}>{browserGuide ? ui.pwa.browserCopy : ui.pwa.iosCopy}</p>
			<ol className={styles.steps}>
				<li><span>{browserGuide ? <Ellipsis aria-hidden="true" /> : <Share aria-hidden="true" />}</span><strong>{browserGuide ? ui.pwa.browserMenuStep : ui.pwa.iosShareStep}</strong></li>
				<li><span><SquarePlus aria-hidden="true" /></span><strong>{browserGuide ? ui.pwa.browserInstallStep : ui.pwa.iosAddStep}</strong></li>
			</ol>
			<p className={styles.done}>{browserGuide ? ui.pwa.browserDone : ui.pwa.iosDone}</p>
			<button className={styles.back} type="button" onClick={onBack}><ArrowLeft aria-hidden="true" /> {ui.preferences.back}</button>
		</>
	);
}
