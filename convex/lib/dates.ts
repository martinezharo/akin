import { ConvexError } from "convex/values";

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function assertLocalDate(value: string): void {
	if (!LOCAL_DATE_PATTERN.test(value)) {
		throw new ConvexError({ code: "INVALID_DATE", message: "Invalid local date" });
	}
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year!, month! - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month! - 1 ||
		date.getUTCDate() !== day
	) {
		throw new ConvexError({ code: "INVALID_DATE", message: "Invalid local date" });
	}
}

export function isLocalDate(value: string): boolean {
	try {
		assertLocalDate(value);
		return true;
	} catch {
		return false;
	}
}

export function addLocalDays(value: string, amount: number): string {
	assertLocalDate(value);
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year!, month! - 1, day! + amount));
	return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function currentDateInTimeZone(timeZone: string): string {
	try {
		const parts = new Intl.DateTimeFormat("en-CA", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).formatToParts(new Date());
		const part = (type: Intl.DateTimeFormatPartTypes) =>
			parts.find((candidate) => candidate.type === type)?.value;
		const value = `${part("year")}-${part("month")}-${part("day")}`;
		assertLocalDate(value);
		return value;
	} catch {
		throw new ConvexError({ code: "INVALID_TIME_ZONE", message: "Invalid time zone" });
	}
}

export function assertCurrentLocalDate(value: string, timeZone: string): void {
	assertLocalDate(value);
	if (value !== currentDateInTimeZone(timeZone)) {
		throw new ConvexError({ code: "DATE_MISMATCH", message: "Local date is out of sync" });
	}
}

export function assertLocalDates(
	values: readonly string[],
	maxLength = 366,
): void {
	if (values.length === 0 || values.length > maxLength) {
		throw new ConvexError({ code: "INVALID_DATE_RANGE", message: "Invalid date range" });
	}
	for (const value of values) assertLocalDate(value);
	for (let index = 1; index < values.length; index += 1) {
		if (addLocalDays(values[index - 1]!, 1) !== values[index]!) {
			throw new ConvexError({ code: "INVALID_DATE_RANGE", message: "Dates must be consecutive" });
		}
	}
}
