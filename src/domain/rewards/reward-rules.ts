export const MAX_REWARD_STREAKS = 10;

/** Coins a single streak can earn while resolving one review gap. */
export const MAX_REWARD_DAYS_PER_GAP = 3;

/**
 * A review gap never pays more than three days per streak, so catching up after
 * a long absence stays a relief instead of a jackpot.
 */
export function rewardedDayLimit(reviewDayCount: number): number {
	return reviewDayCount > MAX_REWARD_DAYS_PER_GAP ? MAX_REWARD_DAYS_PER_GAP : reviewDayCount;
}

/**
 * The day a streak is created never pays out: the first completion is the
 * commitment itself, not a kept promise.
 */
export function canRewardCompletion(streakCreatedOn: string, completionDay: string): boolean {
	return streakCreatedOn < completionDay;
}
