import type { StreaksData } from "../persistence/storage";
import type { LocalDateKey } from "./calendar";
import {
	createStreakCheckIn,
	hasStreakCheckIn,
} from "./check-in";

export type ReviewAnswers = Record<string, boolean>;

export function completeStreakOn(
	data: StreaksData,
	streakId: string,
	day: LocalDateKey,
): StreaksData {
	const streak = data.streaks.find((candidate) => candidate.id === streakId);
	if (
		!streak ||
		streak.createdOn > day ||
		hasStreakCheckIn(data.checkIns, streakId, day)
	) {
		return data;
	}

	return {
		...data,
		checkIns: [...data.checkIns, createStreakCheckIn(streakId, day)],
		streaks: data.streaks.map((candidate) =>
			candidate.id === streakId
				? { ...candidate, days: candidate.days + 1 }
				: candidate,
		),
	};
}

export function resolveSingleDay(
	data: StreaksData,
	day: LocalDateKey,
	answers: ReviewAnswers,
): StreaksData {
	const newCheckIns = data.streaks.flatMap((streak) => {
		if (
			streak.createdOn > day ||
			!answers[streak.id] ||
			hasStreakCheckIn(data.checkIns, streak.id, day)
		) {
			return [];
		}

		return [createStreakCheckIn(streak.id, day)];
	});

	return {
		...data,
		checkIns: [...data.checkIns, ...newCheckIns],
		lastReviewedOn: day,
		streaks: data.streaks.map((streak) => {
			if (streak.createdOn > day) return streak;
			if (hasStreakCheckIn(data.checkIns, streak.id, day)) return streak;

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
	const newCheckIns = data.streaks.flatMap((streak) => {
		if (!answers[streak.id]) return [];

		return days.flatMap((day) =>
			streak.createdOn <= day &&
			!hasStreakCheckIn(data.checkIns, streak.id, day)
				? [createStreakCheckIn(streak.id, day)]
				: [],
		);
	});

	return {
		...data,
		checkIns: [...data.checkIns, ...newCheckIns],
		lastReviewedOn: lastDay,
		streaks: data.streaks.map((streak) => {
			const unresolvedEligibleDayCount = days.reduce(
				(count, day) =>
					count +
					Number(
						streak.createdOn <= day &&
							!hasStreakCheckIn(data.checkIns, streak.id, day),
					),
				0,
			);
			if (unresolvedEligibleDayCount === 0) return streak;

			return {
				...streak,
				days: answers[streak.id]
					? streak.days + unresolvedEligibleDayCount
					: 0,
			};
		}),
	};
}
