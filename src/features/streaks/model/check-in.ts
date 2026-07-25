import { CheckInIndex } from "@/domain/streaks/check-in-index";
import type { LocalDateKey } from "./calendar";

export type StreakCheckIn = {
	streakId: string;
	completedOn: LocalDateKey;
};

/**
 * Builds the constant-time lookup used wherever check-ins are questioned in a
 * loop. Prefer this over repeated `hasStreakCheckIn` calls: the latter scans the
 * whole list, so asking once per streak per day grows quadratically.
 */
export function createCheckInIndex(
	checkIns: readonly StreakCheckIn[],
): CheckInIndex {
	return new CheckInIndex(
		checkIns.map((checkIn) => [checkIn.streakId, checkIn.completedOn] as const),
	);
}

export function hasStreakCheckIn(
	checkIns: readonly StreakCheckIn[],
	streakId: string,
	day: LocalDateKey,
): boolean {
	return checkIns.some(
		(checkIn) => checkIn.streakId === streakId && checkIn.completedOn === day,
	);
}

export function createStreakCheckIn(
	streakId: string,
	completedOn: LocalDateKey,
): StreakCheckIn {
	return { streakId, completedOn };
}
