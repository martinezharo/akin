"use client";

import { useMemo } from "react";
import type { CheckInIndex } from "@/domain/streaks/check-in-index";
import { getUnreviewedDays, type LocalDateKey } from "../model/calendar";
import { createCheckInIndex, type StreakCheckIn } from "../model/check-in";
import type { Streak } from "../model/streak";

export type StreakDerivations = {
	checkInIndex: CheckInIndex;
	unreviewedDays: LocalDateKey[];
	hasPendingReview: boolean;
	completedTodayStreakIds: string[];
};

/**
 * The state every streaks controller derives from the same three inputs.
 *
 * Both the local and the account-backed controller need this, and all of it is
 * a walk over days crossed with streaks, so it is computed once per data change
 * instead of on every render, and through a check-in index instead of repeated
 * linear scans.
 */
export function useStreakDerivations({
	streaks,
	checkIns,
	lastReviewedOn,
	today,
}: {
	streaks: readonly Streak[];
	checkIns: readonly StreakCheckIn[];
	lastReviewedOn: LocalDateKey;
	today: LocalDateKey;
}): StreakDerivations {
	return useMemo(() => {
		const checkInIndex = createCheckInIndex(checkIns);
		const unreviewedDays = getUnreviewedDays(lastReviewedOn, today).filter((day) =>
			streaks.some(
				(streak) => streak.createdOn <= day && !checkInIndex.has(streak.id, day),
			),
		);

		return {
			checkInIndex,
			unreviewedDays,
			hasPendingReview: streaks.length > 0 && unreviewedDays.length > 0,
			completedTodayStreakIds: streaks.flatMap((streak) =>
				checkInIndex.has(streak.id, today) ? [streak.id] : [],
			),
		};
	}, [checkIns, lastReviewedOn, streaks, today]);
}
