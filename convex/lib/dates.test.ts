import { describe, expect, it } from "vitest";
import { addLocalDays, assertLocalDate, assertLocalDates, datesAfterThrough } from "./dates";

describe("server local-date rules", () => {
	it("moves safely across month and leap-year boundaries", () => {
		expect(addLocalDays("2024-02-28", 1)).toBe("2024-02-29");
		expect(addLocalDays("2024-02-29", 1)).toBe("2024-03-01");
	});

	it("rejects calendar-shaped strings that are not real dates", () => {
		expect(() => assertLocalDate("2026-02-29")).toThrow();
		expect(() => assertLocalDate("2026-13-01")).toThrow();
	});

	it("requires review dates to be consecutive", () => {
		expect(() => assertLocalDates(["2026-07-15", "2026-07-17"])).toThrow();
		expect(() => assertLocalDates(["2026-07-15", "2026-07-16"])).not.toThrow();
	});

	it("builds the exact unresolved range", () => {
		expect(datesAfterThrough("2026-07-14", "2026-07-18")).toEqual([
			"2026-07-15",
			"2026-07-16",
			"2026-07-17",
			"2026-07-18",
		]);
	});
});
