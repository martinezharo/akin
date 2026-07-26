import { addLocalDays, isLocalDateKey, type LocalDateKey } from "../model/calendar";
import type { StreakCheckIn } from "../model/check-in";
import { DEMO_PROMISE_ICONS, DEMO_PROMISES } from "../model/demo-promises";
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
		streaks: DEMO_PROMISES.map((promise) => ({ ...promise, createdOn })),
		checkIns: [],
		recentIcons: [...DEMO_PROMISE_ICONS],
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

/**
 * Drops a guest browser's streaks once the account owns them.
 *
 * Leaving the copy behind would resurrect it as guest data after a sign-out,
 * and — on a shared browser — hand it to whoever signs in next, since a fresh
 * account imports whatever this key holds.
 */
export function clearStreaksData(storageKey: string): void {
	try {
		localStorage.removeItem(storageKey);
	} catch {
		// The account already holds the data; a stale local copy is not fatal.
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
