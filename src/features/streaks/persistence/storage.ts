import { addLocalDays, isLocalDateKey, type LocalDateKey } from "../model/calendar";
import type { Streak } from "../model/streak";

export type StreaksData = {
	streaks: Streak[];
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

function isStreaksData(value: unknown): value is StreaksData {
	if (!value || typeof value !== "object") return false;

	const data = value as Partial<StreaksData>;
	return (
		Array.isArray(data.streaks) &&
		data.streaks.every(isStreak) &&
		Array.isArray(data.recentIcons) &&
		data.recentIcons.every((icon) => typeof icon === "string") &&
		isLocalDateKey(data.lastReviewedOn)
	);
}

export function createEmptyStreaksData(today: LocalDateKey): StreaksData {
	return {
		streaks: [],
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
		recentIcons: ["🏃", "📚", "🌙"],
		lastReviewedOn: addLocalDays(today, -1),
	};
}

export function loadStreaksData(
	storageKey: string,
	fallback: StreaksData,
): StreaksData {
	try {
		const serializedData = localStorage.getItem(storageKey);
		if (!serializedData) return fallback;

		const data: unknown = JSON.parse(serializedData);
		return isStreaksData(data) ? data : fallback;
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
		return isLocalDateKey(storedDate) ? storedDate : fallback;
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
