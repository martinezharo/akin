/**
 * Copy that a translation may replace. Anything that is not a plain object is a
 * leaf: functions and arrays are swapped whole rather than merged key by key.
 */
type Leaf = string | number | boolean | ((...args: never[]) => unknown) | readonly unknown[];

/** A translation only has to spell out the copy it actually translates. */
export type LocaleOverrides<T> = {
	[K in keyof T]?: T[K] extends Leaf ? T[K] : LocaleOverrides<T[K]>;
};

function isCopyGroup(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Builds a catalog by laying a translation over the English copy. Every level is
 * copied, so a translation can never reach into the base catalog and change the
 * copy another language is about to read.
 */
export function mergeCatalog<T>(base: T, overrides: LocaleOverrides<T>): T {
	const merged: Record<string, unknown> = { ...(base as Record<string, unknown>) };

	for (const [key, value] of Object.entries(overrides as Record<string, unknown>)) {
		if (value === undefined) continue;
		const current = merged[key];
		merged[key] = isCopyGroup(current) && isCopyGroup(value) ? mergeCatalog(current, value as LocaleOverrides<typeof current>) : value;
	}

	return merged as T;
}
