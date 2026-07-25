"use client";

import { useMemo } from "react";
import { getLocalDateKey } from "@/features/streaks/model/calendar";
import {
	createDemoStreaksData,
	DEMO_STREAKS_STORAGE_KEY,
	loadDemoDate,
	loadStreaksData,
} from "@/features/streaks/persistence/storage";
import { withRewardEligibility, withResetWallet } from "./demo-account-storage";
import { toDemoDashboard, useDemoAccount } from "./use-demo-account";

/**
 * The standalone demo account page only needs the streaks as a list to toggle
 * rewards on, so it reads them straight from demo storage instead of booting
 * the whole streaks engine. The wallet still comes from the shared demo store,
 * so coins earned on the home page are already reflected here.
 */
export function useDemoDashboard() {
	const streaks = useMemo(
		() =>
			loadStreaksData(
				DEMO_STREAKS_STORAGE_KEY,
				createDemoStreaksData(loadDemoDate(getLocalDateKey())),
			).streaks,
		[],
	);
	const { account, update } = useDemoAccount(streaks.map((streak) => streak.id));

	return {
		dashboard: toDemoDashboard(streaks, account),
		toggleRewardEligible: (streakId: string, rewardEligible: boolean) =>
			update((current) => withRewardEligibility(current, streakId, rewardEligible)),
		resetWallet: () => update(withResetWallet),
	};
}
