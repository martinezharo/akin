export const APP_LANGUAGE = "en";
export const APP_LOCALE = "en-US";

export const SUPPORTED_LANGUAGES = ["en", "es", "uk"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

/** Locale used to format dates and numbers for each language. */
export const LOCALES: Record<Language, string> = { en: APP_LOCALE, es: "es-ES", uk: "uk-UA" };

export const DEFAULT_LANGUAGE: Language = "en";

export function isLanguage(value: unknown): value is Language {
	return typeof value === "string" && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Picks the first supported language out of BCP 47 tags, matching on the primary subtag ("es-419" → "es"). */
export function resolvePreferredLanguage(tags: readonly string[] | undefined): Language {
	for (const tag of tags ?? []) {
		const primary = typeof tag === "string" ? tag.split("-")[0].toLowerCase() : undefined;
		if (isLanguage(primary)) return primary;
	}
	return DEFAULT_LANGUAGE;
}

/** Language the browser asks for, used only until the reader picks one in preferences. */
export function detectBrowserLanguage(): Language {
	if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
	const tags = navigator.languages?.length ? navigator.languages : navigator.language ? [navigator.language] : [];
	return resolvePreferredLanguage(tags);
}
