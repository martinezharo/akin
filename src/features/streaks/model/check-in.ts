import type { LocalDateKey } from "./calendar";

export type StreakCheckIn = {
	streakId: string;
	completedOn: LocalDateKey;
};

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
