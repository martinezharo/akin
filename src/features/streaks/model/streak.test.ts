import { describe, expect, it } from "vitest";
import { adjustStreakDays, renameStreak, type Streak } from "./streak";

const streak: Streak = {
	id: "read",
	name: "Read",
	icon: "📚",
	days: 12,
	createdOn: "2026-07-01",
};

describe("streak edits", () => {
	it("trims a renamed streak without mutating the original", () => {
		const renamed = renameStreak(streak, "  Read a chapter  ");

		expect(renamed.name).toBe("Read a chapter");
		expect(streak.name).toBe("Read");
	});

	it("ignores empty names and invalid counts", () => {
		expect(renameStreak(streak, "   ")).toBe(streak);
		expect(adjustStreakDays(streak, -1)).toBe(streak);
		expect(adjustStreakDays(streak, 2.5)).toBe(streak);
	});

	it("sets the streak count to any non-negative integer", () => {
		expect(adjustStreakDays(streak, 0).days).toBe(0);
		expect(adjustStreakDays(streak, 365).days).toBe(365);
	});
});
