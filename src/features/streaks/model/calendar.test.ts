import { describe, expect, it } from "vitest";
import {
	addLocalDays,
	chunkLocalDates,
	getLocalDateKey,
	getUnreviewedDays,
	isLocalDateKey,
	millisecondsUntilNextLocalDay,
} from "./calendar";

describe("streak calendar", () => {
	it("splits long review gaps without losing or duplicating days", () => {
		const days = Array.from(
			{ length: 401 },
			(_, index) => addLocalDays("2025-01-01", index),
		);

		const batches = chunkLocalDates(days, 30);

		expect(batches).toHaveLength(14);
		expect(batches[0]).toHaveLength(30);
		expect(batches.at(-1)).toHaveLength(11);
		expect(batches.flat()).toEqual(days);
	});

	it("formats local dates without applying UTC offsets", () => {
		expect(getLocalDateKey(new Date(2026, 6, 16, 23, 30))).toBe("2026-07-16");
	});

	it("moves across month and leap-year boundaries", () => {
		expect(addLocalDays("2024-02-28", 1)).toBe("2024-02-29");
		expect(addLocalDays("2024-02-29", 1)).toBe("2024-03-01");
		expect(addLocalDays("2026-01-01", -1)).toBe("2025-12-31");
	});

	it("rejects calendar-shaped strings that are not real dates", () => {
		expect(isLocalDateKey("2026-02-29")).toBe(false);
		expect(isLocalDateKey("2024-02-29")).toBe(true);
		expect(isLocalDateKey("16-07-2026")).toBe(false);
	});

	it("returns only completed days awaiting review", () => {
		expect(getUnreviewedDays("2026-07-12", "2026-07-16")).toEqual([
			"2026-07-13",
			"2026-07-14",
			"2026-07-15",
		]);
		expect(getUnreviewedDays("2026-07-15", "2026-07-16")).toEqual([]);
	});

	it("schedules just beyond the next local midnight", () => {
		const now = new Date(2026, 6, 16, 23, 59, 59, 900);
		expect(millisecondsUntilNextLocalDay(now)).toBe(200);
	});
});
