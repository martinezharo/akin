"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
	getStreakIconOptions,
	type StreakIconValue,
} from "../components/icon-picker/streak-icons";
import {
	getUnreviewedDays,
	type LocalDateKey,
} from "../model/calendar";
import { hasStreakCheckIn, type StreakCheckIn } from "../model/check-in";
import type { ReviewAnswers } from "../model/progress";
import { createStreak, type Streak } from "../model/streak";
import {
	createEmptyStreaksData,
	loadStreaksData,
	STREAKS_STORAGE_KEY,
} from "../persistence/storage";
import type { CoinReward, StreaksController, UndoToast } from "./use-streaks-controller";
import { resolveReviewGapInBatches } from "./review-gap-batches";
import { importLocalDataInBatches } from "./local-import";

type RemoteUndo = UndoToast & { undoId: Id<"undoRecords"> };

function answersForServer(answers: ReviewAnswers) {
	return Object.entries(answers).map(([streakId, completed]) => ({ streakId, completed }));
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : "Something went sideways. Try that again.";
}

export function useRegisteredStreaksController(today: LocalDateKey) {
	const user = useQuery(api.users.current);
	const dashboard = useQuery(api.dashboard.get);
	const ensureUser = useMutation(api.users.ensure);
	const prepareLocalImport = useMutation(api.users.prepareLocalImport);
	const importLocalCheckIns = useMutation(api.users.importLocalCheckIns);
	const finishLocalImport = useMutation(api.users.finishLocalImport);
	const createRemote = useMutation(api.streaks.create);
	const rememberRemoteIcon = useMutation(api.streaks.rememberIcon);
	const updateRemoteIcon = useMutation(api.streaks.updateIcon);
	const renameRemote = useMutation(api.streaks.rename);
	const adjustRemoteDays = useMutation(api.streaks.adjustDays);
	const removeRemote = useMutation(api.streaks.remove);
	const completeRemoteToday = useMutation(api.progress.completeToday);
	const resolveRemoteDay = useMutation(api.progress.resolveDay);
	const resolveRemoteGap = useMutation(api.progress.resolveGap);
	const undoRemote = useMutation(api.progress.undo);
	const [undoToast, setUndoToast] = useState<RemoteUndo | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [coinReward, setCoinReward] = useState<CoinReward | null>(null);
	const initializedUserRef = useRef<string | null>(null);
	const importStartedRef = useRef<string | null>(null);
	const reviewSessionRef = useRef<string | null>(null);
	const reviewUndoRef = useRef<RemoteUndo | null>(null);
	const reviewCoinRewardRef = useRef(0);
	const resolvingGapRef = useRef(false);
	const toastKeyRef = useRef(0);
	const rewardIdRef = useRef(0);

	const report = useCallback((error: unknown) => setNotice(errorMessage(error)), []);
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	const openUndo = useCallback(
		(kind: UndoToast["kind"], name: string | null, undoId: Id<"undoRecords">) => {
			toastKeyRef.current += 1;
			setUndoToast({ key: toastKeyRef.current, kind, name, undoId });
		},
		[],
	);
	const showCoinReward = useCallback((amount: number, streakId: string | null = null) => {
		if (amount === 0) return;
		rewardIdRef.current += 1;
		setCoinReward({ id: rewardIdRef.current, amount, streakId });
	}, []);

	useEffect(() => {
		const initializationKey = user ? `${user.id}:${today}` : null;
		if (!user || initializedUserRef.current === initializationKey) return;
		initializedUserRef.current = initializationKey;
		void ensureUser({ today, timeZone }).catch(report);
	}, [ensureUser, report, timeZone, today, user]);

	useEffect(() => {
		if (!user?.isReady || !user.needsLocalImport || importStartedRef.current === user.id) return;
		importStartedRef.current = user.id;
		const local = loadStreaksData(STREAKS_STORAGE_KEY, createEmptyStreaksData(today));
		void importLocalDataInBatches({
			data: local,
			today,
			timeZone,
			operations: {
				prepare: prepareLocalImport,
				importCheckIns: importLocalCheckIns,
				finish: finishLocalImport,
			},
		}).catch((error) => {
			importStartedRef.current = null;
			report(error);
		});
	}, [finishLocalImport, importLocalCheckIns, prepareLocalImport, report, timeZone, today, user]);

	const data = useMemo(() => {
		if (!dashboard) return null;
		return {
			streaks: dashboard.streaks as Streak[],
			checkIns: dashboard.checkIns as (StreakCheckIn & { completedAt: number })[],
			recentIcons: dashboard.recentIcons,
			lastReviewedOn: dashboard.lastReviewedOn as LocalDateKey,
		};
	}, [dashboard]);

	const unreviewedDays = data
		? getUnreviewedDays(data.lastReviewedOn, today).filter((day) =>
				data.streaks.some(
					(streak) =>
						streak.createdOn <= day && !hasStreakCheckIn(data.checkIns, streak.id, day),
				),
			)
		: [];
	const hasPendingReview = Boolean(data?.streaks.length && unreviewedDays.length);

	useEffect(() => {
		if (!dashboard || hasPendingReview || !reviewUndoRef.current) return;
		setUndoToast(reviewUndoRef.current);
		reviewUndoRef.current = null;
		reviewSessionRef.current = null;
	}, [dashboard, hasPendingReview]);

	function reviewSessionId() {
		if (!reviewSessionRef.current) reviewSessionRef.current = crypto.randomUUID();
		return reviewSessionRef.current;
	}

	const streaks = data?.streaks ?? [];
	const completedTodayStreakIds = data
		? streaks.flatMap((streak) =>
				hasStreakCheckIn(data.checkIns, streak.id, today) ? [streak.id] : [],
			)
		: [];

	const controller: StreaksController = {
		today,
		streaks,
		completedTodayStreakIds,
		iconOptions: getStreakIconOptions(data?.recentIcons ?? []),
		unreviewedDays,
		hasPendingReview,
		undoToast,
		create: (name, icon) => {
			const streak = createStreak(name, icon, today);
			setUndoToast(null);
			void createRemote({
				clientId: streak.id,
				name,
				icon: icon ?? "✨",
				createdOn: today,
			})
				.then((result) => {
					if (!result.rewardEligible) {
						setNotice("This streak is saved, but only ten streaks can earn rewards. Choose them from your reward settings.");
					}
				})
				.catch(report);
			return streak.id;
		},
		rememberIcon: (icon: StreakIconValue) => {
			if (icon) void rememberRemoteIcon({ icon }).catch(report);
		},
		updateIcon: (streakId, icon) => {
			if (icon) void updateRemoteIcon({ streakId, icon }).catch(report);
		},
		rename: (streakId, name) => void renameRemote({ streakId, name }).catch(report),
		adjustDays: (streakId, days) => void adjustRemoteDays({ streakId, days }).catch(report),
		remove: (streakId) => {
			setUndoToast(null);
			void removeRemote({ streakId })
				.then((result) => openUndo("delete", result.name, result.undoId))
				.catch(report);
		},
		completeToday: (streakId) => {
			setUndoToast(null);
			void completeRemoteToday({ streakId, today })
				.then((result) => {
					showCoinReward(result.coinsAwarded, streakId);
					if (result.completed && result.undoId) openUndo("today", result.name, result.undoId);
				})
				.catch(report);
		},
		isCompletedOn: (streakId, day) =>
			Boolean(data && hasStreakCheckIn(data.checkIns, streakId, day)),
		resolveDay: (day, answers) => {
			setUndoToast(null);
			void resolveRemoteDay({
				day,
				today,
				answers: answersForServer(answers),
				reviewSessionId: reviewSessionId(),
			})
				.then((result) => {
					// A multi-day review is one moment of closure. The server still
					// records each day independently, but the user sees one combined
					// reward after answering the final card.
					if (unreviewedDays.length > 1) {
						reviewCoinRewardRef.current += result.coinsAwarded;
					} else {
						showCoinReward(reviewCoinRewardRef.current + result.coinsAwarded);
						reviewCoinRewardRef.current = 0;
					}
					toastKeyRef.current += 1;
					const reviewUndo: RemoteUndo = {
						key: toastKeyRef.current,
						kind: "review",
						name: null,
						undoId: result.undoId,
					};
					if (unreviewedDays.length === 1) {
						setUndoToast(reviewUndo);
						reviewUndoRef.current = null;
						reviewSessionRef.current = null;
					} else {
						reviewUndoRef.current = reviewUndo;
					}
				})
				.catch(report);
		},
		resolveGap: (days, answers) => {
			if (resolvingGapRef.current) return;
			resolvingGapRef.current = true;
			setUndoToast(null);
			const sessionId = reviewSessionId();
			void (async () => {
				const result = await resolveReviewGapInBatches(days, (batch) =>
					resolveRemoteGap({
						days: batch,
						today,
						answers: answersForServer(answers),
						reviewSessionId: sessionId,
					}),
				);
				if (result.finalUndoId) {
					showCoinReward(
						reviewCoinRewardRef.current + result.coinsAwarded,
					);
					reviewCoinRewardRef.current = 0;
					toastKeyRef.current += 1;
					setUndoToast({
						key: toastKeyRef.current,
						kind: "review",
						name: null,
						undoId: result.finalUndoId,
					});
					reviewUndoRef.current = null;
					reviewSessionRef.current = null;
				}
			})()
				.catch(report)
				.finally(() => {
					resolvingGapRef.current = false;
				});
		},
		undo: () => {
			if (undoToast) void undoRemote({ undoId: undoToast.undoId }).catch(report);
			setUndoToast(null);
			reviewUndoRef.current = null;
			reviewSessionRef.current = null;
			reviewCoinRewardRef.current = 0;
		},
		dismissUndo: () => setUndoToast(null),
		replaceData: () => undefined,
		coinReward,
	};

	return {
		controller,
		dashboard,
		isLoading: user === undefined || dashboard === undefined || dashboard === null,
		notice,
		dismissNotice: () => setNotice(null),
	};
}
