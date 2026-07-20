"use client";

import {
	ArrowLeft,
	ArrowRight,
	Check,
	Download,
	Ellipsis,
	Moon,
	Settings2,
	Share,
	SquarePlus,
	Sun,
	Volume2,
	VolumeX,
	X,
} from "lucide-react";
import { type FocusEvent, type KeyboardEvent, type ReactNode, useId, useRef, useState } from "react";
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
	const { shouldOfferInstall, requestInstall } = useInstallApp();
	const titleId = useId();
	const descriptionId = useId();

	function showPreferences() {
		const stored = readStoredPreferences();
		setTheme(stored.theme);
		setLanguage(stored.language);
		setRewardSound(isRewardSoundEnabled());
		setOpen(true);
	}

	function chooseTheme(nextTheme: Theme) {
		setTheme(nextTheme);
		savePreferences({ theme: nextTheme, language });
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
								<div className={styles.mark} aria-hidden="true"><Settings2 /></div>
								<p className={styles.kicker}>{ui.preferences.kicker}</p>
								<h2 id={titleId}>{ui.preferences.title}</h2>
								<p className={styles.intro} id={descriptionId}>A few small choices, just the way you like them.</p>

								<section className={styles.section} aria-labelledby={`${titleId}-theme`}>
									<div className={styles.sectionHeading}>
										<div><strong id={`${titleId}-theme`}>{ui.preferences.theme}</strong><small>{ui.preferences.themeHint}</small></div>
									</div>
									<div className={styles.themePicker} role="group" aria-label={ui.preferences.theme}>
										<ThemeButton icon={<Sun />} label={ui.preferences.light} selected={theme === "light"} onClick={() => chooseTheme("light")} />
										<ThemeButton icon={<Moon />} label={ui.preferences.dark} selected={theme === "dark"} onClick={() => chooseTheme("dark")} />
									</div>
								</section>

								<section className={styles.section}>
									<div className={styles.sectionHeading}>
										<span><strong id={`${titleId}-language-label`}>{ui.preferences.language}</strong><small>{ui.preferences.languageHint}</small></span>
									</div>
									<LanguagePicker id={`${titleId}-language`} value={language} onChange={chooseLanguage} />
								</section>

								<section className={styles.section} aria-labelledby={`${titleId}-sound`}>
									<div className={styles.sectionHeading}>
										<div><strong id={`${titleId}-sound`}>Reward sound</strong><small>A tiny chime when coins land.</small></div>
									</div>
									<button className={styles.soundToggle} type="button" aria-pressed={rewardSound} onClick={toggleRewardSound}>
										<span aria-hidden="true">{rewardSound ? <Volume2 /> : <VolumeX />}</span>
										<strong>{rewardSound ? "On" : "Off"}</strong>
										<i aria-hidden="true" />
									</button>
								</section>

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

function ThemeButton({ icon, label, selected, onClick }: { icon: ReactNode; label: string; selected: boolean; onClick: () => void }) {
	return (
		<button type="button" data-selected={selected} aria-pressed={selected} onClick={onClick}>
			<span aria-hidden="true">{icon}</span>
			<strong>{label}</strong>
			{selected ? <Check aria-hidden="true" /> : null}
		</button>
	);
}

function LanguagePicker({ id, value, onChange }: { id: string; value: Language; onChange: (language: Language) => void }) {
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
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={`${id}-menu`}
				aria-labelledby={`${id}-label ${id}-value`}
				onClick={() => open ? closePicker() : openPicker()}
				onKeyDown={handleTriggerKeyDown}
			>
				<span className={styles.languageCode} aria-hidden="true">EN</span>
				<span className={styles.languageCopy}><strong id={`${id}-value`}>{ui.preferences.english}</strong><small>Selected language</small></span>
				<span className={styles.languageToggle} aria-hidden="true" data-open={open}><span /><span /></span>
			</button>

			{open ? (
				<div className={styles.languageMenu} id={`${id}-menu`} role="menu" aria-label={ui.preferences.language}>
					<button
						ref={optionRef}
						type="button"
						role="menuitemradio"
						aria-checked={value === "en"}
						onClick={() => { onChange("en"); closePicker({ restoreFocus: true }); }}
						onKeyDown={(event) => {
							if (event.key === "Escape") {
								event.preventDefault();
								closePicker({ restoreFocus: true });
							}
						}}
					>
						<span className={styles.languageCode} aria-hidden="true">EN</span>
						<span><strong>{ui.preferences.english}</strong><small>More languages soon</small></span>
						<Check aria-hidden="true" />
					</button>
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
