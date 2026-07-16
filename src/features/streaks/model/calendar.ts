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

export function getUnreviewedDays(
	lastReviewedOn: LocalDateKey,
	today: LocalDateKey,
): LocalDateKey[] {
	const days: LocalDateKey[] = [];
	let day = addLocalDays(lastReviewedOn, 1);

	while (day < today) {
		days.push(day);
		day = addLocalDays(day, 1);
	}

	return days;
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
