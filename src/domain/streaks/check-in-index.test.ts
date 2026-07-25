import { describe, expect, it } from "vitest";
import { CheckInIndex, EMPTY_CHECK_IN_INDEX } from "./check-in-index";

describe("check-in index", () => {
	it("answers membership for the pairs it was built from", () => {
		const index = new CheckInIndex([
			["move", "2026-07-20"],
			["read", "2026-07-21"],
		]);

		expect(index.has("move", "2026-07-20")).toBe(true);
		expect(index.has("read", "2026-07-21")).toBe(true);
		expect(index.has("move", "2026-07-21")).toBe(false);
		expect(index.has("sleep", "2026-07-20")).toBe(false);
	});

	it("keeps streak and day separate so keys cannot collide", () => {
		const index = new CheckInIndex([["a", "b-2026-07-20"]]);

		expect(index.has("a", "b-2026-07-20")).toBe(true);
		expect(index.has("a-b", "2026-07-20")).toBe(false);
	});

	it("treats a repeated pair as one entry", () => {
		const index = new CheckInIndex([
			["move", "2026-07-20"],
			["move", "2026-07-20"],
		]);

		expect(index.has("move", "2026-07-20")).toBe(true);
	});

	it("exposes a shared empty index", () => {
		expect(EMPTY_CHECK_IN_INDEX.has("move", "2026-07-20")).toBe(false);
	});
});
