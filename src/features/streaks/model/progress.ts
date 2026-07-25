import type { StreaksData } from "../persistence/storage";
import type { LocalDateKey } from "./calendar";
import {
	createCheckInIndex,
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
	const checkedIn = createCheckInIndex(data.checkIns);
	const isUnresolved = (streak: StreaksData["streaks"][number]) =>
		streak.createdOn <= day && !checkedIn.has(streak.id, day);

	const newCheckIns = data.streaks.flatMap((streak) =>
		isUnresolved(streak) && answers[streak.id]
			? [createStreakCheckIn(streak.id, day)]
			: [],
	);

	return {
		...data,
		checkIns: [...data.checkIns, ...newCheckIns],
		lastReviewedOn: day,
		streaks: data.streaks.map((streak) => {
			if (!isUnresolved(streak)) return streak;

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

	const checkedIn = createCheckInIndex(data.checkIns);
	// Each streak's unresolved days are needed twice — to mint the check-ins and
	// to advance the counter — so the walk over days happens once per streak.
	const unresolvedDaysByStreak = new Map(
		data.streaks.map((streak) => [
			streak.id,
			days.filter(
				(day) => streak.createdOn <= day && !checkedIn.has(streak.id, day),
			),
		]),
	);

	const newCheckIns = data.streaks.flatMap((streak) =>
		answers[streak.id]
			? (unresolvedDaysByStreak.get(streak.id) ?? []).map((day) =>
					createStreakCheckIn(streak.id, day),
				)
			: [],
	);

	return {
		...data,
		checkIns: [...data.checkIns, ...newCheckIns],
		lastReviewedOn: lastDay,
		streaks: data.streaks.map((streak) => {
			const unresolvedEligibleDayCount = (
				unresolvedDaysByStreak.get(streak.id) ?? []
			).length;
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
