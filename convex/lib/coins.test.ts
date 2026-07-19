import { describe, expect, it } from "vitest";
import { canRewardCompletion, rewardedDayLimit } from "./coins";

describe("coin review rewards", () => {
	it.each([
		[1, 1],
		[2, 2],
		[3, 3],
		[4, 3],
		[30, 3],
	])("rewards at most three days for a %i-day review", (days, expected) => {
		expect(rewardedDayLimit(days)).toBe(expected);
	});
});

describe("coin completion eligibility", () => {
	it("does not reward a streak on the day it was created", () => {
		expect(canRewardCompletion("2026-07-19", "2026-07-19")).toBe(false);
	});

	it("starts rewarding the streak on the following day", () => {
		expect(canRewardCompletion("2026-07-19", "2026-07-20")).toBe(true);
	});
});
