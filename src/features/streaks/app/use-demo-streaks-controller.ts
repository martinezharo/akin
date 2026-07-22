"use client";

import { useEffect, useRef, useState } from "react";
import {
	createDemoAccountState,
	DEMO_STARTING_COINS,
	loadDemoAccountState,
	saveDemoAccountState,
	type DemoAccountState,
} from "@/features/account/demo-account-storage";
import type { AccountDashboardView } from "@/features/account/account-types";
import type { LocalDateKey } from "../model/calendar";
import type { ReviewAnswers } from "../model/progress";
import type { Streak } from "../model/streak";
import type { CoinReward, StreaksController } from "./use-streaks-controller";

const DEMO_USER = {
	id: "demo-user",
	name: "Mika Daydream",
	email: "mika@demo.akin",
};

function coinsForDay(
	controller: StreaksController,
	eligibleIds: ReadonlySet<string>,
	day: LocalDateKey,
	answers: ReviewAnswers,
) {
	return controller.streaks.filter(
		(streak) =>
			eligibleIds.has(streak.id) &&
			streak.createdOn <= day &&
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
	const perStreakLimit = days.length > 3 ? 3 : days.length;
	return controller.streaks.reduce((total, streak) => {
		if (!eligibleIds.has(streak.id) || answers[streak.id] !== true) return total;
		const unresolvedDays = days.filter(
			(day) =>
				streak.createdOn <= day &&
				!controller.isCompletedOn(streak.id, day),
		).length;
		return total + Math.min(unresolvedDays, perStreakLimit);
	}, 0);
}

function withRewards(account: DemoAccountState, amount: number): DemoAccountState {
	if (amount === 0) return account;
	return {
		...account,
		balance: account.balance + amount,
		lifetimeEarned: account.lifetimeEarned + amount,
		xp: account.xp + amount,
	};
}

export function useDemoStreaksController(base: StreaksController) {
	const [account, setAccount] = useState<DemoAccountState>(() =>
		loadDemoAccountState(base.streaks.map((streak) => streak.id)),
	);
	const undoAccountRef = useRef<DemoAccountState | null>(null);
	const reviewAccountRef = useRef<DemoAccountState | null>(null);
	const reviewCoinRewardRef = useRef(0);
	const rewardIdRef = useRef(0);
	const [coinReward, setCoinReward] = useState<CoinReward | null>(null);

	useEffect(() => {
		saveDemoAccountState(account);
	}, [account]);

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

	function addRewardsToWallet(amount: number) {
		if (amount === 0) return;
		setAccount((current) => withRewards(current, amount));
	}

	function showCoinReward(amount: number, streakId: string | null = null) {
		if (amount === 0) return;
		rewardIdRef.current += 1;
		setCoinReward({ id: rewardIdRef.current, amount, streakId });
	}

	function awardCoins(amount: number, streakId: string | null = null) {
		addRewardsToWallet(amount);
		showCoinReward(amount, streakId);
	}

	const controller: StreaksController = {
		...base,
		create: (name, icon) => {
			discardUndo();
			const id = base.create(name, icon);
			setAccount((current) =>
				current.rewardEligibleStreakIds.length >= 10
					? current
					: {
							...current,
							rewardEligibleStreakIds: [id, ...current.rewardEligibleStreakIds],
						},
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
			setAccount((current) => ({
				...current,
				rewardEligibleStreakIds: current.rewardEligibleStreakIds.filter(
					(id) => id !== streakId,
				),
			}));
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
				streak.createdOn < base.today &&
				account.rewardEligibleStreakIds.includes(streakId)
			) {
				awardCoins(1, streakId);
			}
		},
		resolveDay: (day, answers) => {
			rememberReviewUndo();
			const reward = coinsForDay(base, eligibleIds(), day, answers);
			base.resolveDay(day, answers);
			addRewardsToWallet(reward);
			if (base.unreviewedDays.length > 1) {
				reviewCoinRewardRef.current += reward;
			} else {
				showCoinReward(reviewCoinRewardRef.current + reward);
				reviewCoinRewardRef.current = 0;
			}
		},
		resolveGap: (days, answers) => {
			rememberReviewUndo();
			const reward = coinsForGap(base, eligibleIds(), days, answers);
			base.resolveGap(days, answers);
			addRewardsToWallet(reward);
			showCoinReward(reviewCoinRewardRef.current + reward);
			reviewCoinRewardRef.current = 0;
		},
		undo: () => {
			base.undo();
			if (undoAccountRef.current) setAccount(undoAccountRef.current);
			discardUndo();
			reviewCoinRewardRef.current = 0;
		},
		dismissUndo: () => {
			base.dismissUndo();
			discardUndo();
		},
		replaceData: (data) => {
			discardUndo();
			reviewCoinRewardRef.current = 0;
			base.replaceData(data);
		},
		coinReward,
	};

	const streaksWithRewards = base.streaks.map((streak: Streak) => ({
		...streak,
		rewardEligible: account.rewardEligibleStreakIds.includes(streak.id),
	}));
	const dashboard: AccountDashboardView = {
		user: DEMO_USER,
		wallet: { balance: account.balance, lifetimeEarned: account.lifetimeEarned, xp: account.xp },
		streaks: streaksWithRewards,
	};

	return {
		controller,
			dashboard,
			toggleRewardEligible: (streakId: string, rewardEligible: boolean) => {
			discardUndo();
			base.dismissUndo();
			setAccount((current) => {
				const ids = current.rewardEligibleStreakIds.filter((id) => id !== streakId);
				if (!rewardEligible) return { ...current, rewardEligibleStreakIds: ids };
				if (ids.length >= 10) return current;
				return { ...current, rewardEligibleStreakIds: [streakId, ...ids] };
			});
		},
		resetWallet: () => {
			discardUndo();
			base.dismissUndo();
			setAccount((current) => ({
				...current,
				balance: DEMO_STARTING_COINS,
				lifetimeEarned: DEMO_STARTING_COINS,
				xp: 0,
			}));
		},
		resetAccount: (streakIds: string[]) => {
			discardUndo();
			setAccount(createDemoAccountState(streakIds));
		},
	};
}
