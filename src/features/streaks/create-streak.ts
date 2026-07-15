export type Streak = {
	id: string;
	name: string;
	emoji: string;
	days: number;
};

const MIN_STREAK_DAYS = 1;
const MAX_STREAK_DAYS = 99;

export function createStreak(name: string, emoji: string): Streak {
	return {
		id: crypto.randomUUID(),
		name,
		emoji,
		days:
			Math.floor(Math.random() * (MAX_STREAK_DAYS - MIN_STREAK_DAYS + 1)) + MIN_STREAK_DAYS,
	};
}
