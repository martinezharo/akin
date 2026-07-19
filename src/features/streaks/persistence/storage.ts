import { addLocalDays, isLocalDateKey, type LocalDateKey } from "../model/calendar";
import type { StreakCheckIn } from "../model/check-in";
import type { Streak } from "../model/streak";

export type StreaksData = {
	streaks: Streak[];
	checkIns: StreakCheckIn[];
	recentIcons: string[];
	lastReviewedOn: LocalDateKey;
};

export const STREAKS_STORAGE_KEY = "akin:streaks:v1";
export const DEMO_STREAKS_STORAGE_KEY = "akin:demo-streaks:v1";
export const DEMO_CLOCK_STORAGE_KEY = "akin:demo-clock:v1";

function isStreak(value: unknown): value is Streak {
	if (!value || typeof value !== "object") return false;

	const streak = value as Partial<Streak>;
	return (
		typeof streak.id === "string" &&
		typeof streak.name === "string" &&
		(streak.icon === null || typeof streak.icon === "string") &&
		typeof streak.days === "number" &&
		Number.isInteger(streak.days) &&
		streak.days >= 0 &&
		isLocalDateKey(streak.createdOn)
	);
}

function isStreakCheckIn(value: unknown): value is StreakCheckIn {
	if (!value || typeof value !== "object") return false;

	const checkIn = value as Partial<StreakCheckIn>;
	return typeof checkIn.streakId === "string" && isLocalDateKey(checkIn.completedOn);
}

function parseStreaksData(value: unknown): StreaksData | null {
	if (!value || typeof value !== "object") return null;

	const data = value as Partial<StreaksData>;
	if (
		!Array.isArray(data.streaks) ||
		!data.streaks.every(isStreak) ||
		!Array.isArray(data.recentIcons) ||
		!data.recentIcons.every((icon) => typeof icon === "string") ||
		!isLocalDateKey(data.lastReviewedOn)
	) {
		return null;
	}

	const checkIns = data.checkIns ?? [];
	if (!Array.isArray(checkIns) || !checkIns.every(isStreakCheckIn)) return null;

	const streakIds = new Set(data.streaks.map((streak) => streak.id));
	return {
		streaks: data.streaks,
		checkIns: checkIns.filter((checkIn) => streakIds.has(checkIn.streakId)),
		recentIcons: data.recentIcons,
		lastReviewedOn: data.lastReviewedOn,
	};
}

function readStreaksData(storageKey: string): StreaksData | null {
	const serializedData = localStorage.getItem(storageKey);
	if (!serializedData) return null;

	const data: unknown = JSON.parse(serializedData);
	return parseStreaksData(data);
}

export function createEmptyStreaksData(today: LocalDateKey): StreaksData {
	return {
		streaks: [],
		checkIns: [],
		recentIcons: [],
		lastReviewedOn: addLocalDays(today, -1),
	};
}

export function createDemoStreaksData(today: LocalDateKey): StreaksData {
	const createdOn = addLocalDays(today, -140);

	return {
		streaks: [
			{ id: "demo-move", name: "Move my body", icon: "🏃", days: 6, createdOn },
			{ id: "demo-read", name: "Read ten pages", icon: "📚", days: 24, createdOn },
			{ id: "demo-sleep", name: "Phone-free bedtime", icon: "🌙", days: 103, createdOn },
		],
		checkIns: [],
		recentIcons: ["🏃", "📚", "🌙"],
		lastReviewedOn: addLocalDays(today, -1),
	};
}

export function loadStreaksData(
	storageKey: string,
	fallback: StreaksData,
): StreaksData {
	try {
		return readStreaksData(storageKey) ?? fallback;
	} catch {
		return fallback;
	}
}

export function saveStreaksData(storageKey: string, data: StreaksData): void {
	try {
		localStorage.setItem(storageKey, JSON.stringify(data));
	} catch {
		// The app remains usable if storage is disabled or full.
	}
}

export function loadDemoDate(fallback: LocalDateKey): LocalDateKey {
	try {
		const storedDate = localStorage.getItem(DEMO_CLOCK_STORAGE_KEY);
		const date = isLocalDateKey(storedDate) ? storedDate : fallback;
		const demoData = readStreaksData(DEMO_STREAKS_STORAGE_KEY);
		if (!demoData) return date;

		// The clock and streak data live in separate keys. If a browser restores,
		// evicts or writes only one of them, the clock can end up behind the last
		// completed review and time travel appears to do nothing. Move it to the
		// first valid day without discarding the user's demo progress.
		const firstDayAfterReview = addLocalDays(demoData.lastReviewedOn, 1);
		return date < firstDayAfterReview ? firstDayAfterReview : date;
	} catch {
		return fallback;
	}
}

export function saveDemoDate(date: LocalDateKey): void {
	try {
		localStorage.setItem(DEMO_CLOCK_STORAGE_KEY, date);
	} catch {
		// The demo clock can still work for this session without persistence.
	}
}

export function clearDemoStorage(): void {
	try {
		localStorage.removeItem(DEMO_STREAKS_STORAGE_KEY);
		localStorage.removeItem(DEMO_CLOCK_STORAGE_KEY);
	} catch {
		// Resetting the in-memory state is enough when storage is unavailable.
	}
}
