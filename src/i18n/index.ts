import { LOCALES, type Language } from "./config";
import { ui as en } from "./en";
import { overrides as es } from "./es";
import { mergeCatalog } from "./merge";
import { overrides as uk } from "./uk";

export type Ui = typeof en;
const catalogs: Record<Language, Ui> = { en, es: mergeCatalog(en, es), uk: mergeCatalog(en, uk) };
let runtimeLanguage: Language = "en";

export function setRuntimeLanguage(language: Language) {
	runtimeLanguage = language;
}

export function getLanguage(): Language {
	return runtimeLanguage;
}

/** BCP 47 locale for the active language, for dates and numbers. */
export function getLocale(): string {
	return LOCALES[getLanguage()];
}

function localeValue(path: PropertyKey[]) {
	const selected = path.reduce<unknown>((value, key) => (value && typeof value === "object" ? Reflect.get(value, key) : undefined), catalogs[getLanguage()]);
	const fallback = path.reduce<unknown>((value, key) => (value && typeof value === "object" ? Reflect.get(value, key) : undefined), en);
	return selected ?? fallback;
}

function createUiProxy(path: PropertyKey[] = []): Ui {
	return new Proxy({} as Ui, {
		get(_target, key) {
			const value = localeValue([...path, key]);
			return value && typeof value === "object" ? createUiProxy([...path, key]) : value;
		},
	}) as Ui;
}

/**
 * Dynamic catalog used by both server and client components. Copy resolves on
 * property access, so only read leaves while rendering — a leaf pulled out at
 * module scope freezes to whichever language was active at import time.
 */
export const ui = createUiProxy();
