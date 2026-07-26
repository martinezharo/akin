import { afterEach, describe, expect, it } from "vitest";
import { ui as en } from "./en";
import { overrides as es } from "./es";
import { getLanguage, setRuntimeLanguage, ui } from "./index";
import { mergeCatalog } from "./merge";
import { overrides as uk } from "./uk";

afterEach(() => setRuntimeLanguage("en"));

/** Walks a catalog and returns every leaf path, so shapes can be compared. */
function leafPaths(value: unknown, path = ""): string[] {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return [path];
	return Object.entries(value).flatMap(([key, child]) => leafPaths(child, path ? `${path}.${key}` : key));
}

describe("catalogs", () => {
	it("keeps every language's copy to itself", () => {
		setRuntimeLanguage("uk");
		expect(ui.demo.streakNames.move).toBe("Рухайся");

		setRuntimeLanguage("es");
		expect(ui.demo.streakNames.move).toBe("Mover el cuerpo");

		setRuntimeLanguage("en");
		expect(ui.demo.streakNames.move).toBe("Move my body");
		expect(en.demo.streakNames.move).toBe("Move my body");
	});

	it("defaults to English", () => {
		expect(getLanguage()).toBe("en");
		expect(ui.landing.crew.sortNote).toBe("This week");
	});

	// English is the catalog every other language is measured against, so a new
	// string is only done once each translation has an answer for it.
	it.each([["es", es], ["uk", uk]] as const)("translates every English string into %s", (_language, overrides) => {
		const translated = new Set(leafPaths(overrides));
		const untranslated = leafPaths(en).filter((path) => !translated.has(path));

		expect(untranslated).toEqual([]);
	});
});

describe("mergeCatalog", () => {
	it("never writes through to the catalog it merges onto", () => {
		const base = { group: { kept: "base", replaced: "base" } };
		const merged = mergeCatalog(base, { group: { replaced: "overlay" } });

		expect(merged.group).toEqual({ kept: "base", replaced: "overlay" });
		expect(base.group.replaced).toBe("base");
	});

	it("swaps arrays and functions whole", () => {
		const base = { messages: ["a", "b"], greet: (name: string) => `hi ${name}` };
		const merged = mergeCatalog(base, { messages: ["c"], greet: (name: string) => `hola ${name}` });

		expect(merged.messages).toEqual(["c"]);
		expect(merged.greet("Ada")).toBe("hola Ada");
	});
});
