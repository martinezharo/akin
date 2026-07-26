import { ui } from "@/i18n";
import type { Language } from "@/i18n/config";

/** Short code shown on the pickers, in the language's own alphabet. */
export const LANGUAGE_CODES: Record<Language, string> = { en: "EN", es: "ES", uk: "UK" };

/**
 * Call while rendering. Every language is named in its own words, so the list
 * reads the same whichever language happens to be on screen.
 */
export function languageOptions(): { value: Language; code: string; name: string }[] {
	return [
		{ value: "en", code: LANGUAGE_CODES.en, name: ui.preferences.english },
		{ value: "es", code: LANGUAGE_CODES.es, name: ui.preferences.spanish },
		{ value: "uk", code: LANGUAGE_CODES.uk, name: ui.preferences.ukrainian },
	];
}
