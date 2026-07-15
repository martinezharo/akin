import type { StreakIconValue } from "./streak-icons";

export type Streak = {
	id: string;
	name: string;
	icon: StreakIconValue;
	days: number;
};

const MIN_STREAK_DAYS = 0;
const MAX_STREAK_DAYS = 1100;

export function createStreak(name: string, icon: StreakIconValue): Streak {
	return {
		id: crypto.randomUUID(),
		name,
		icon,
		days:
			Math.floor(Math.random() * (MAX_STREAK_DAYS - MIN_STREAK_DAYS + 1)) + MIN_STREAK_DAYS,
	};
}
