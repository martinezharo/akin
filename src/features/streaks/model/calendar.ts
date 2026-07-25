import { MAX_REVIEW_GAP_DAYS } from "@/domain/streaks/review-window";
import { APP_LOCALE } from "@/i18n/config";

export type LocalDateKey = `${number}-${number}-${number}`;

const LOCAL_DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalDateKey(date = new Date()): LocalDateKey {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}` as LocalDateKey;
}

export function isLocalDateKey(value: unknown): value is LocalDateKey {
	if (typeof value !== "string" || !LOCAL_DATE_KEY_PATTERN.test(value)) return false;

	return getLocalDateKey(fromLocalDateKey(value as LocalDateKey)) === value;
}

export function fromLocalDateKey(dateKey: LocalDateKey): Date {
	const [year, month, day] = dateKey.split("-").map(Number);

	// Midday is deliberately used so DST changes cannot move this into a neighbouring day.
	return new Date(year, month - 1, day, 12);
}

export function addLocalDays(dateKey: LocalDateKey, amount: number): LocalDateKey {
	const date = fromLocalDateKey(dateKey);
	date.setDate(date.getDate() + amount);
	return getLocalDateKey(date);
}

/**
 * Days between the last review and today, oldest first.
 *
 * The walk is capped at `MAX_REVIEW_GAP_DAYS`: `lastReviewedOn` comes from
 * storage and an ancient value would otherwise spin for thousands of iterations
 * and feed an equally large review flow. When the cap bites, the most recent
 * days are the ones kept, since those are the ones the user can still recall.
 */
export function getUnreviewedDays(
	lastReviewedOn: LocalDateKey,
	today: LocalDateKey,
): LocalDateKey[] {
	const earliestDay = addLocalDays(today, -MAX_REVIEW_GAP_DAYS);
	const days: LocalDateKey[] = [];
	let day = addLocalDays(lastReviewedOn, 1);
	if (day < earliestDay) day = earliestDay;

	while (day < today) {
		days.push(day);
		day = addLocalDays(day, 1);
	}

	return days;
}

export function chunkLocalDates(
	days: readonly LocalDateKey[],
	batchSize: number,
): LocalDateKey[][] {
	if (!Number.isSafeInteger(batchSize) || batchSize <= 0) {
		throw new Error("Batch size must be a positive integer");
	}
	const batches: LocalDateKey[][] = [];
	for (let index = 0; index < days.length; index += batchSize) {
		batches.push(days.slice(index, index + batchSize));
	}
	return batches;
}

export function formatLocalDate(dateKey: LocalDateKey, locale = APP_LOCALE): string {
	return new Intl.DateTimeFormat(locale, {
		weekday: "long",
		month: "long",
		day: "numeric",
	}).format(fromLocalDateKey(dateKey));
}

export function millisecondsUntilNextLocalDay(now = new Date()): number {
	const nextMidnight = new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate() + 1,
		0,
		0,
		0,
		100,
	);

	return nextMidnight.getTime() - now.getTime();
}
