import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import {
	mergeProgressUndoSnapshots,
	type ProgressUndoSnapshot,
	shouldRestoreStreakDays,
	subtractRewardBalances,
} from "./undo";

const streakA = "streak-a" as Id<"streaks">;
const streakB = "streak-b" as Id<"streaks">;

function progressSnapshot(
	overrides: Partial<ProgressUndoSnapshot> = {},
): ProgressUndoSnapshot {
	return {
		version: 2,
		type: "progress",
		streaks: [],
		checkInIds: [],
		ledgerIds: [],
		...overrides,
	};
}

describe("progress undo snapshots", () => {
	it("keeps the original before-state and the latest after-state across a review", () => {
		const first = progressSnapshot({
			streaks: [{ streakId: streakA, daysBefore: 4, daysAfter: 5 }],
			profile: {
				profileId: "profile" as Id<"profiles">,
				lastReviewedOnBefore: "2026-07-20",
				lastReviewedOnAfter: "2026-07-21",
			},
		});
		const second = progressSnapshot({
			streaks: [
				{ streakId: streakA, daysBefore: 5, daysAfter: 6 },
				{ streakId: streakB, daysBefore: 2, daysAfter: 0 },
			],
			profile: {
				profileId: "profile" as Id<"profiles">,
				lastReviewedOnBefore: "2026-07-21",
				lastReviewedOnAfter: "2026-07-22",
			},
		});

		const merged = mergeProgressUndoSnapshots(first, second);

		expect(merged.streaks).toEqual([
			{ streakId: streakA, daysBefore: 4, daysAfter: 6 },
			{ streakId: streakB, daysBefore: 2, daysAfter: 0 },
		]);
		expect(merged.profile).toMatchObject({
			lastReviewedOnBefore: "2026-07-20",
			lastReviewedOnAfter: "2026-07-22",
		});
	});

	it("does not restore streak days after another operation changed them", () => {
		const item = { streakId: streakA, daysBefore: 4, daysAfter: 5 };

		expect(shouldRestoreStreakDays(5, item)).toBe(true);
		expect(shouldRestoreStreakDays(8, item)).toBe(false);
	});

	it("subtracts only the reward being undone from current wallet balances", () => {
		expect(
			subtractRewardBalances(
				{ balance: 52, lifetimeEarned: 120, xp: 90 },
				2,
			),
		).toEqual({ balance: 50, lifetimeEarned: 118, xp: 88 });
	});
});
