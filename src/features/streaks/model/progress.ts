import type { StreaksData } from "../persistence/storage";
import type { LocalDateKey } from "./calendar";

export type ReviewAnswers = Record<string, boolean>;

export function resolveSingleDay(
	data: StreaksData,
	day: LocalDateKey,
	answers: ReviewAnswers,
): StreaksData {
	return {
		...data,
		lastReviewedOn: day,
		streaks: data.streaks.map((streak) => {
			if (streak.createdOn > day) return streak;

			return {
				...streak,
				days: answers[streak.id] ? streak.days + 1 : 0,
			};
		}),
	};
}

export function resolveGap(
	data: StreaksData,
	days: LocalDateKey[],
	answers: ReviewAnswers,
): StreaksData {
	const lastDay = days.at(-1);
	if (!lastDay) return data;

	return {
		...data,
		lastReviewedOn: lastDay,
		streaks: data.streaks.map((streak) => {
			const eligibleDayCount = days.reduce(
				(count, day) => count + Number(streak.createdOn <= day),
				0,
			);
			if (eligibleDayCount === 0) return streak;

			return {
				...streak,
				days: answers[streak.id] ? streak.days + eligibleDayCount : 0,
			};
		}),
	};
}
