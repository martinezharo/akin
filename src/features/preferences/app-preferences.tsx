"use client";

import {
	ArrowLeft,
	ArrowRight,
	Check,
	ChevronDown,
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
import { type FocusEvent, type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { useInstallApp } from "@/features/pwa/use-install-app";
import { ui } from "@/i18n/en";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import { isRewardSoundEnabled, setRewardSoundEnabled } from "@/features/rewards/reward-sound-preference";
import styles from "./app-preferences.module.css";

const PREFERENCES_KEY = "akin.preferences.v1";

type Theme = "light" | "dark";
type Language = "en";

type StoredPreferences = {
	theme: Theme;
	language: Language;
};

type ViewTransitionDocument = Document & {
	startViewTransition?: (updateCallback: () => void) => { finished: Promise<void> };
};

function readStoredPreferences(): StoredPreferences {
	try {
		const stored = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) ?? "null") as Partial<StoredPreferences> | null;
		return {
			theme:
				stored?.theme === "light" || stored?.theme === "dark"
					? stored.theme
					: window.matchMedia("(prefers-color-scheme: dark)").matches
						? "dark"
						: "light",
			language: "en",
		};
	} catch {
		return {
			theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
			language: "en",
		};
	}
}

function savePreferences(preferences: StoredPreferences) {
	try {
		window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
	} catch {
		// The visual preference should still apply when storage is unavailable.
	}
	document.documentElement.dataset.theme = preferences.theme;
	document.documentElement.lang = preferences.language;
}

export function AppPreferences() {
	const [open, setOpen] = useState(false);
	const [installGuide, setInstallGuide] = useState<"ios" | "browser" | null>(null);
	const [theme, setTheme] = useState<Theme>("light");
	const [language, setLanguage] = useState<Language>("en");
	const [rewardSound, setRewardSound] = useState(true);
	const [themeAnimation, setThemeAnimation] = useState<Theme | null>(null);
	const { shouldOfferInstall, requestInstall } = useInstallApp();
	const titleId = useId();
	const descriptionId = useId();
	const themeAnimationTimer = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(themeAnimationTimer.current), []);

	function showPreferences() {
		const stored = readStoredPreferences();
		setTheme(stored.theme);
		setLanguage(stored.language);
		setRewardSound(isRewardSoundEnabled());
		setOpen(true);
	}

	function chooseTheme(nextTheme: Theme) {
		if (nextTheme === theme) return;

		window.clearTimeout(themeAnimationTimer.current);
		setThemeAnimation(nextTheme);
		themeAnimationTimer.current = window.setTimeout(() => setThemeAnimation(null), 560);

		const applyTheme = () => {
			flushSync(() => setTheme(nextTheme));
			savePreferences({ theme: nextTheme, language });
		};
		const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const transitionDocument = document as ViewTransitionDocument;

		if (prefersReducedMotion || !transitionDocument.startViewTransition) {
			applyTheme();
			return;
		}

		const origin = document.activeElement instanceof HTMLElement ? document.activeElement.getBoundingClientRect() : null;
		if (origin) {
			document.documentElement.style.setProperty("--theme-transition-x", `${origin.left + origin.width / 2}px`);
			document.documentElement.style.setProperty("--theme-transition-y", `${origin.top + origin.height / 2}px`);
		}

		void transitionDocument.startViewTransition(applyTheme).finished.catch(() => undefined);
	}

	function chooseLanguage(nextLanguage: Language) {
		setLanguage(nextLanguage);
		savePreferences({ theme, language: nextLanguage });
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
	}

	async function install() {
		const result = await requestInstall();
		if (result === "ios-guide") setInstallGuide("ios");
		if (result === "browser-guide") setInstallGuide("browser");
	}

	return (
		<>
			<button className={styles.trigger} type="button" onClick={showPreferences} aria-label={ui.preferences.open}>
				<Settings2 aria-hidden="true" />
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
									<p className={styles.intro} id={descriptionId}>A few small choices, just the way you like them.</p>
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
										<LanguagePicker id={`${titleId}-language`} labelledBy={`${titleId}-language-label`} value={language} onChange={chooseLanguage} />
									</section>

									<section className={styles.setting} aria-labelledby={`${titleId}-sound`}>
										<div className={styles.settingCopy}><strong id={`${titleId}-sound`}>Reward sound</strong><small>A tiny chime when coins land.</small></div>
										<button className={styles.soundToggle} type="button" aria-pressed={rewardSound} onClick={toggleRewardSound}>
											<i aria-hidden="true" />
										</button>
									</section>
								</div>

								{shouldOfferInstall ? (
									<button className={styles.install} type="button" onClick={() => void install()}>
										<span><Download aria-hidden="true" /></span>
										<span><strong>{ui.preferences.installTitle}</strong><small>{ui.preferences.installCopy}</small></span>
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

function LanguagePicker({ id, labelledBy, value, onChange }: { id: string; labelledBy: string; value: Language; onChange: (language: Language) => void }) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const optionRef = useRef<HTMLButtonElement>(null);

	function openPicker() {
		setOpen(true);
		window.requestAnimationFrame(() => optionRef.current?.focus());
	}

	function closePicker({ restoreFocus = false } = {}) {
		setOpen(false);
		if (restoreFocus) window.requestAnimationFrame(() => triggerRef.current?.focus());
	}

	function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
		event.preventDefault();
		openPicker();
	}

	function handlePickerBlur(event: FocusEvent<HTMLDivElement>) {
		if (!event.currentTarget.contains(event.relatedTarget)) closePicker();
	}

	return (
		<div className={styles.languagePicker} onBlur={handlePickerBlur}>
			<button
				id={id}
				ref={triggerRef}
				className={styles.languageTrigger}
				type="button"
				data-open={open}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={`${id}-menu`}
				aria-labelledby={`${labelledBy} ${id}-value`}
				onClick={() => open ? closePicker() : openPicker()}
				onKeyDown={handleTriggerKeyDown}
			>
				<span className={styles.languageCode} aria-hidden="true">EN</span>
				<strong id={`${id}-value`}>{ui.preferences.english}</strong>
				<span className={styles.languageChevron} aria-hidden="true" data-open={open}>
					<ChevronDown />
				</span>
			</button>

			{open ? (
				<div className={styles.languageMenu} id={`${id}-menu`} role="menu" aria-label={ui.preferences.language}>
					<button
						ref={optionRef}
						type="button"
						role="menuitemradio"
						aria-checked={value === "en"}
						data-selected={value === "en"}
						onClick={() => { onChange("en"); closePicker({ restoreFocus: true }); }}
						onKeyDown={(event) => {
							if (event.key === "Escape") {
								event.preventDefault();
								closePicker({ restoreFocus: true });
							}
						}}
					>
						<span className={styles.languageCode} aria-hidden="true">EN</span>
						<strong>{ui.preferences.english}</strong>
						{value === "en" ? <Check aria-hidden="true" /> : <span className={styles.languageCheckSlot} aria-hidden="true" />}
					</button>
					<p className={styles.languageSoon}>More languages on the way</p>
				</div>
			) : null}
		</div>
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
