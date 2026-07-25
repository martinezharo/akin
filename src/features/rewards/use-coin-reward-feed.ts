"use client";

import { useCallback, useRef, useState } from "react";
import type { CoinReward } from "./coin-reward";

export type CoinRewardFeed = {
	coinReward: CoinReward | null;
	/** Announces a reward straight away. Zero-coin rewards stay silent. */
	show: (amount: number, streakId?: string | null) => void;
	/**
	 * A multi-day review is one moment of closure. Every day is still resolved
	 * independently, but the coins only fly once the final card is answered.
	 */
	collectReviewReward: (amount: number, options: { isFinalDay: boolean }) => void;
	/** Drops any coins held back for a review that was undone or replaced. */
	reset: () => void;
};

export function useCoinRewardFeed(): CoinRewardFeed {
	const [coinReward, setCoinReward] = useState<CoinReward | null>(null);
	const rewardIdRef = useRef(0);
	const pendingReviewCoinsRef = useRef(0);

	const show = useCallback((amount: number, streakId: string | null = null) => {
		if (amount === 0) return;
		rewardIdRef.current += 1;
		setCoinReward({ id: rewardIdRef.current, amount, streakId });
	}, []);

	const collectReviewReward = useCallback(
		(amount: number, { isFinalDay }: { isFinalDay: boolean }) => {
			if (!isFinalDay) {
				pendingReviewCoinsRef.current += amount;
				return;
			}
			show(pendingReviewCoinsRef.current + amount);
			pendingReviewCoinsRef.current = 0;
		},
		[show],
	);

	const reset = useCallback(() => {
		pendingReviewCoinsRef.current = 0;
	}, []);

	return { coinReward, show, collectReviewReward, reset };
}
