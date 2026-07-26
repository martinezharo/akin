import { describe, expect, it } from "vitest";
import { resolvePreferredLanguage } from "./config";

describe("resolvePreferredLanguage", () => {
	it("matches a supported language on its primary subtag", () => {
		expect(resolvePreferredLanguage(["es-419", "en-US"])).toBe("es");
		expect(resolvePreferredLanguage(["uk-UA"])).toBe("uk");
	});

	it("skips unsupported tags before falling back to English", () => {
		expect(resolvePreferredLanguage(["fr-FR", "de", "es"])).toBe("es");
		expect(resolvePreferredLanguage(["fr-FR", "ja"])).toBe("en");
	});

	it("falls back to English without usable tags", () => {
		expect(resolvePreferredLanguage(undefined)).toBe("en");
		expect(resolvePreferredLanguage([])).toBe("en");
	});
});
