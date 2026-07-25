"use client";

import { useRef } from "react";
import {
	canRewardCompletion,
	MAX_REWARD_STREAKS,
	rewardedDayLimit,
} from "@/domain/rewards/reward-rules";
import {
	type DemoAccountState,
	withRewardEligibility,
	withResetWallet,
	withRewards,
} from "@/features/account/demo/demo-account-storage";
import { toDemoDashboard, useDemoAccount } from "@/features/account/demo/use-demo-account";
import { useCoinRewardFeed } from "@/features/rewards/use-coin-reward-feed";
import type { LocalDateKey } from "../model/calendar";
import type { ReviewAnswers } from "../model/progress";
import type { StreaksController } from "./use-streaks-controller";

function coinsForDay(
	controller: StreaksController,
	eligibleIds: ReadonlySet<string>,
	day: LocalDateKey,
	answers: ReviewAnswers,
) {
	return controller.streaks.filter(
		(streak) =>
			eligibleIds.has(streak.id) &&
			canRewardCompletion(streak.createdOn, day) &&
			answers[streak.id] === true &&
			!controller.isCompletedOn(streak.id, day),
	).length;
}

function coinsForGap(
	controller: StreaksController,
	eligibleIds: ReadonlySet<string>,
	days: LocalDateKey[],
	answers: ReviewAnswers,
) {
	const perStreakLimit = rewardedDayLimit(days.length);
	return controller.streaks.reduce((total, streak) => {
		if (!eligibleIds.has(streak.id) || answers[streak.id] !== true) return total;
		// The creation day still advances the counter, it just never pays.
		const unresolvedDays = days.filter(
			(day) =>
				canRewardCompletion(streak.createdOn, day) &&
				!controller.isCompletedOn(streak.id, day),
		).length;
		return total + Math.min(unresolvedDays, perStreakLimit);
	}, 0);
}

/**
 * Wraps the local controller with the demo wallet, so the demo pays out under
 * exactly the reward rules the backend applies to a real account.
 */
export function useDemoStreaksController(base: StreaksController) {
	const { account, update: updateAccount, reset: resetAccountState } = useDemoAccount(
		base.streaks.map((streak) => streak.id),
	);
	const undoAccountRef = useRef<DemoAccountState | null>(null);
	const reviewAccountRef = useRef<DemoAccountState | null>(null);
	const { coinReward, show: showCoinReward, collectReviewReward, reset: resetCoinRewards } =
		useCoinRewardFeed();

	function discardUndo() {
		undoAccountRef.current = null;
		reviewAccountRef.current = null;
	}

	function rememberUndo() {
		undoAccountRef.current = account;
	}

	function rememberReviewUndo() {
		if (!reviewAccountRef.current) reviewAccountRef.current = account;
		undoAccountRef.current = reviewAccountRef.current;
	}

	function eligibleIds() {
		return new Set(account.rewardEligibleStreakIds);
	}

	function awardCoins(amount: number) {
		if (amount === 0) return;
		updateAccount((current) => withRewards(current, amount));
	}

	const controller: StreaksController = {
		...base,
		create: (name, icon) => {
			discardUndo();
			const id = base.create(name, icon);
			updateAccount((current) =>
				current.rewardEligibleStreakIds.length >= MAX_REWARD_STREAKS
					? current
					: { ...current, rewardEligibleStreakIds: [id, ...current.rewardEligibleStreakIds] },
			);
			return id;
		},
		rememberIcon: (icon) => {
			discardUndo();
			base.rememberIcon(icon);
		},
		updateIcon: (streakId, icon) => {
			discardUndo();
			base.updateIcon(streakId, icon);
		},
		rename: (streakId, name) => {
			discardUndo();
			base.rename(streakId, name);
		},
		adjustDays: (streakId, days) => {
			discardUndo();
			base.adjustDays(streakId, days);
		},
		remove: (streakId) => {
			rememberUndo();
			base.remove(streakId);
			updateAccount((current) => withRewardEligibility(current, streakId, false));
		},
		completeToday: (streakId) => {
			const streak = base.streaks.find((candidate) => candidate.id === streakId);
			const canComplete = Boolean(
				streak &&
					streak.createdOn <= base.today &&
					!base.isCompletedOn(streakId, base.today),
			);
			if (!canComplete) {
				base.completeToday(streakId);
				return;
			}
			rememberUndo();
			base.completeToday(streakId);
			if (
				streak &&
				canRewardCompletion(streak.createdOn, base.today) &&
				account.rewardEligibleStreakIds.includes(streakId)
			) {
				awardCoins(1);
				showCoinReward(1, streakId);
			}
		},
		resolveDay: (day, answers, options) => {
			rememberReviewUndo();
			const reward = coinsForDay(base, eligibleIds(), day, answers);
			base.resolveDay(day, answers, options);
			awardCoins(reward);
			collectReviewReward(reward, options);
		},
		resolveGap: (days, answers) => {
			rememberReviewUndo();
			const reward = coinsForGap(base, eligibleIds(), days, answers);
			base.resolveGap(days, answers);
			awardCoins(reward);
			collectReviewReward(reward, { isFinalDay: true });
		},
		undo: () => {
			base.undo();
			const restored = undoAccountRef.current;
			if (restored) updateAccount(() => restored);
			discardUndo();
			resetCoinRewards();
		},
		dismissUndo: () => {
			base.dismissUndo();
			discardUndo();
		},
		replaceData: (data) => {
			discardUndo();
			resetCoinRewards();
			base.replaceData(data);
		},
		coinReward,
	};

	return {
		controller,
		dashboard: toDemoDashboard(base.streaks, account),
		toggleRewardEligible: (streakId: string, rewardEligible: boolean) => {
			discardUndo();
			base.dismissUndo();
			updateAccount((current) => withRewardEligibility(current, streakId, rewardEligible));
		},
		resetWallet: () => {
			discardUndo();
			base.dismissUndo();
			updateAccount(withResetWallet);
		},
		resetAccount: (streakIds: string[]) => {
			discardUndo();
			resetAccountState(streakIds);
		},
	};
}
