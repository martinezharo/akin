import type { StreakIconValue } from "../components/icon-picker/streak-icons";
import type { LocalDateKey } from "./calendar";

export const STREAK_NAME_MAX_LENGTH = 72;

export type Streak = {
	id: string;
	name: string;
	icon: StreakIconValue;
	days: number;
	createdOn: LocalDateKey;
};

export function createStreak(
	name: string,
	icon: StreakIconValue,
	createdOn: LocalDateKey,
): Streak {
	return {
		id: crypto.randomUUID(),
		name,
		icon,
		days: 0,
		createdOn,
	};
}

export function renameStreak(streak: Streak, name: string): Streak {
	const trimmedName = name.trim();
	return trimmedName ? { ...streak, name: trimmedName } : streak;
}

export function adjustStreakDays(streak: Streak, days: number): Streak {
	return Number.isInteger(days) && days >= 0 ? { ...streak, days } : streak;
}
