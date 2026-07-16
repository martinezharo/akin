import type { StreakIconValue } from "../components/icon-picker/streak-icons";
import type { LocalDateKey } from "./calendar";

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
