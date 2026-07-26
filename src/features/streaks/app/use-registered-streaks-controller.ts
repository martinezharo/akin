"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@convex/_generated/api";
import { ui } from "@/i18n/en";
import { MAX_REWARD_STREAKS } from "@/domain/rewards/reward-rules";
import type { Id } from "@convex/_generated/dataModel";
import {
	getStreakIconOptions,
	type StreakIconValue,
} from "../components/icon-picker/streak-icons";
import { getLocalDateKey, type LocalDateKey } from "../model/calendar";
import type { StreakCheckIn } from "../model/check-in";
import type { ReviewAnswers } from "../model/progress";
import { createStreak, type Streak } from "../model/streak";
import {
	clearStreaksData,
	createEmptyStreaksData,
	loadStreaksData,
	STREAKS_STORAGE_KEY,
} from "../persistence/storage";
import { useCoinRewardFeed } from "@/features/rewards/use-coin-reward-feed";
import type { StreaksController, UndoToast } from "./use-streaks-controller";
import { resolveReviewGapInBatches } from "./review-gap-batches";
import { importLocalDataInBatches } from "./local-import";
import { useStreakDerivations } from "./use-streak-derivations";
import {
	completeTodayOptimistically,
	patchDashboardStreak,
	removeStreakOptimistically,
} from "./dashboard-optimistic";

type RemoteUndo = UndoToast & { undoId: Id<"undoRecords"> };

// Stable identities, so the derivations keep their memo while the dashboard loads.
const EMPTY_STREAKS: Streak[] = [];
const EMPTY_CHECK_INS: StreakCheckIn[] = [];

function answersForServer(answers: ReviewAnswers) {
	return Object.entries(answers).map(([streakId, completed]) => ({ streakId, completed }));
}

function errorMessage(error: unknown) {
	return error instanceof Error ? error.message : ui.account.error.generic;
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
	// Every edit below is a field the user is looking at while they change it, so
	// each one paints locally first and lets Convex reconcile the server's answer.
	const updateRemoteIcon = useMutation(api.streaks.updateIcon).withOptimisticUpdate(
		(localStore, { streakId, icon }) =>
			patchDashboardStreak(localStore, streakId, (streak) => ({ ...streak, icon })),
	);
	const renameRemote = useMutation(api.streaks.rename).withOptimisticUpdate(
		(localStore, { streakId, name }) =>
			patchDashboardStreak(localStore, streakId, (streak) => ({ ...streak, name })),
	);
	const adjustRemoteDays = useMutation(api.streaks.adjustDays).withOptimisticUpdate(
		(localStore, { streakId, days }) =>
			patchDashboardStreak(localStore, streakId, (streak) => ({ ...streak, days })),
	);
	const removeRemote = useMutation(api.streaks.remove).withOptimisticUpdate(
		removeStreakOptimistically,
	);
	const completeRemoteToday = useMutation(api.progress.completeToday).withOptimisticUpdate(
		completeTodayOptimistically,
	);
	const resolveRemoteDay = useMutation(api.progress.resolveDay);
	const resolveRemoteGap = useMutation(api.progress.resolveGap);
	const undoRemote = useMutation(api.progress.undo);
	const [undoToast, setUndoToast] = useState<RemoteUndo | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const { coinReward, show: showCoinReward, collectReviewReward, reset: resetCoinRewards } =
		useCoinRewardFeed();
	const [importFailed, setImportFailed] = useState(false);
	const initializedUserRef = useRef<string | null>(null);
	const importStartedRef = useRef<string | null>(null);
	const reviewSessionRef = useRef<string | null>(null);
	const reviewUndoRef = useRef<RemoteUndo | null>(null);
	const resolvingGapRef = useRef(false);
	const toastKeyRef = useRef(0);

	const report = useCallback((error: unknown) => setNotice(errorMessage(error)), []);
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	const openUndo = useCallback(
		(kind: UndoToast["kind"], name: string | null, undoId: Id<"undoRecords">) => {
			toastKeyRef.current += 1;
			setUndoToast({ key: toastKeyRef.current, kind, name, undoId });
		},
		[],
	);
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
			resolveToday: getLocalDateKey,
			timeZone,
			operations: {
				prepare: prepareLocalImport,
				importCheckIns: importLocalCheckIns,
				finish: finishLocalImport,
			},
		})
			.then((result) => {
				// A `false` here means the account was imported from another browser
				// while this run was in flight; that copy stays on this device
				// untouched rather than being merged in behind the user's back.
				if (result.imported) clearStreaksData(STREAKS_STORAGE_KEY);
			})
			.catch((error) => {
				importStartedRef.current = null;
				setImportFailed(true);
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

	const { checkInIndex, unreviewedDays, hasPendingReview, completedTodayStreakIds } =
		useStreakDerivations({
			streaks: data?.streaks ?? EMPTY_STREAKS,
			checkIns: data?.checkIns ?? EMPTY_CHECK_INS,
			lastReviewedOn: data?.lastReviewedOn ?? today,
			today,
		});

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

	const streaks = data?.streaks ?? EMPTY_STREAKS;

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
						setNotice(ui.account.error.rewardEligibleNotice(MAX_REWARD_STREAKS));
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
		isCompletedOn: (streakId, day) => checkInIndex.has(streakId, day),
		resolveDay: (day, answers, { isFinalDay }) => {
			setUndoToast(null);
			void resolveRemoteDay({
				day,
				today,
				answers: answersForServer(answers),
				reviewSessionId: reviewSessionId(),
			})
				.then((result) => {
					collectReviewReward(result.coinsAwarded, { isFinalDay });
					toastKeyRef.current += 1;
					const reviewUndo: RemoteUndo = {
						key: toastKeyRef.current,
						kind: "review",
						name: null,
						undoId: result.undoId,
					};
					if (isFinalDay) {
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
					collectReviewReward(result.coinsAwarded, { isFinalDay: true });
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
			resetCoinRewards();
		},
		dismissUndo: () => setUndoToast(null),
		replaceData: () => undefined,
		coinReward,
	};

	// The dashboard is live from the moment the profile exists, so without this
	// gate the import would paint a half-filled board — streaks with no history,
	// then a review backlog appearing out of nowhere once it finishes. The flag
	// is the server's own, so a reload mid-import keeps waiting; a failed import
	// releases the gate instead of locking the user out of their streaks.
	const isImporting = user?.isReady === true && user.needsLocalImport && !importFailed;

	return {
		user,
		controller,
		dashboard,
		isLoading: user === undefined || dashboard === undefined || dashboard === null,
		isImporting,
		notice,
		dismissNotice: () => setNotice(null),
	};
}
