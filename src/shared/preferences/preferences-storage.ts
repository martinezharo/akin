import { detectBrowserLanguage, isLanguage, type Language } from "@/i18n/config";

const PREFERENCES_KEY = "akin.preferences.v1";

export type Theme = "light" | "dark";
export type StoredPreferences = {
	theme: Theme;
	/** Only written once the reader picks a language; until then the browser's own preference wins on every visit. */
	language?: Language;
};

type ViewTransitionDocument = Document & {
	startViewTransition?: (updateCallback: () => void) => { finished: Promise<void> };
};

function systemTheme(): Theme {
	return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readStoredPreferences(): StoredPreferences {
	try {
		const stored = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) ?? "null") as Partial<StoredPreferences> | null;
		return {
			theme: stored?.theme === "light" || stored?.theme === "dark" ? stored.theme : systemTheme(),
			language: isLanguage(stored?.language) ? stored.language : undefined,
		};
	} catch {
		return { theme: systemTheme() };
	}
}

/** What the reader is actually seeing: their choice, or whatever the browser asks for. */
export function activeLanguage(stored: StoredPreferences = readStoredPreferences()): Language {
	return stored.language ?? detectBrowserLanguage();
}

export function savePreferences(preferences: StoredPreferences) {
	try {
		window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
	} catch {
		// The visual preference should still apply when storage is unavailable.
	}
	document.documentElement.dataset.theme = preferences.theme;
	document.documentElement.lang = activeLanguage(preferences);
}

/**
 * Wipes the new theme across the page from whatever was clicked, and gets out of
 * the way when the browser cannot do it or the reader asked for less motion.
 */
export function runThemeTransition(applyTheme: () => void) {
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

/**
 * A language change rewrites every string on the page, including the copy React
 * rendered on the server, so the cheapest correct move is to load it again.
 */
export function selectLanguage(language: Language) {
	savePreferences({ ...readStoredPreferences(), language });
	window.location.reload();
}
