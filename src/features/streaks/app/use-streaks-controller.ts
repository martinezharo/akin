"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	getStreakIconOptions,
	STREAK_ICON_OPTIONS,
	type StreakIconOption,
	type StreakIconValue,
} from "../components/icon-picker/streak-icons";
import { addLocalDays, getUnreviewedDays, type LocalDateKey } from "../model/calendar";
import { hasStreakCheckIn } from "../model/check-in";
import {
	completeStreakOn,
	resolveGap,
	resolveSingleDay,
	type ReviewAnswers,
} from "../model/progress";
import {
	adjustStreakDays,
	createStreak,
	renameStreak,
	type Streak,
} from "../model/streak";
import {
	loadStreaksData,
	saveStreaksData,
	type StreaksData,
} from "../persistence/storage";

type StreaksControllerOptions = {
	today: LocalDateKey;
	storageKey: string;
	createFallbackData: () => StreaksData;
};

export type UndoToast = {
	key: number;
	kind: "review" | "delete" | "today";
	/** Name of the affected streak, when the toast relates to a single streak. */
	name: string | null;
};

type UndoToastState = UndoToast & {
	snapshot: StreaksData;
};

export type StreaksController = {
	today: LocalDateKey;
	streaks: Streak[];
	completedTodayStreakIds: string[];
	iconOptions: StreakIconOption[];
	unreviewedDays: LocalDateKey[];
	hasPendingReview: boolean;
	undoToast: UndoToast | null;
	create: (name: string, icon: StreakIconValue) => string;
	rememberIcon: (icon: StreakIconValue) => void;
	updateIcon: (streakId: string, icon: StreakIconValue) => void;
	rename: (streakId: string, name: string) => void;
	adjustDays: (streakId: string, days: number) => void;
	remove: (streakId: string) => void;
	completeToday: (streakId: string) => void;
	isCompletedOn: (streakId: string, day: LocalDateKey) => boolean;
	resolveDay: (day: LocalDateKey, answers: ReviewAnswers) => void;
	resolveGap: (days: LocalDateKey[], answers: ReviewAnswers) => void;
	undo: () => void;
	dismissUndo: () => void;
	replaceData: (data: StreaksData) => void;
};

function withRememberedIcon(data: StreaksData, icon: StreakIconValue): StreaksData {
	if (icon === null) return data;

	return {
		...data,
		recentIcons: [icon, ...data.recentIcons.filter((recentIcon) => recentIcon !== icon)].slice(
			0,
			STREAK_ICON_OPTIONS.length,
		),
	};
}

export function useStreaksController({
	today,
	storageKey,
	createFallbackData,
}: StreaksControllerOptions): StreaksController {
	const [data, setData] = useState<StreaksData>(() =>
		loadStreaksData(storageKey, createFallbackData()),
	);
	const [undoToast, setUndoToast] = useState<UndoToastState | null>(null);
	const undoToastKeyRef = useRef(0);
	// Snapshot taken when a review session starts, so the whole session can be
	// undone from a single toast once the flow is fully resolved.
	const reviewSnapshotRef = useRef<StreaksData | null>(null);

	useEffect(() => {
		saveStreaksData(storageKey, data);
	}, [data, storageKey]);

	const unreviewedDays = getUnreviewedDays(data.lastReviewedOn, today).filter((day) =>
		data.streaks.some(
			(streak) =>
				streak.createdOn <= day &&
				!hasStreakCheckIn(data.checkIns, streak.id, day),
		),
	);
	const hasPendingReview = data.streaks.length > 0 && unreviewedDays.length > 0;
	const completedTodayStreakIds = data.streaks.flatMap((streak) =>
		hasStreakCheckIn(data.checkIns, streak.id, today) ? [streak.id] : [],
	);

	const openUndoToast = useCallback(
		(toast: Omit<UndoToast, "key">, snapshot: StreaksData) => {
			undoToastKeyRef.current += 1;
			setUndoToast({ ...toast, key: undoToastKeyRef.current, snapshot });
		},
		[],
	);

	useEffect(() => {
		if (hasPendingReview || reviewSnapshotRef.current === null) return;

		openUndoToast({ kind: "review", name: null }, reviewSnapshotRef.current);
		reviewSnapshotRef.current = null;
	}, [hasPendingReview, openUndoToast]);

	function rememberIcon(icon: StreakIconValue) {
		setData((currentData) => withRememberedIcon(currentData, icon));
	}

	function create(name: string, icon: StreakIconValue) {
		const streak = createStreak(name, icon, today);
		setUndoToast(null);
		setData((currentData) =>
			withRememberedIcon(
				{
					...currentData,
					lastReviewedOn:
						currentData.streaks.length === 0
							? addLocalDays(today, -1)
							: currentData.lastReviewedOn,
					streaks: [streak, ...currentData.streaks],
				},
				icon,
			),
		);
		return streak.id;
	}

	function updateIcon(streakId: string, icon: StreakIconValue) {
		setUndoToast(null);
		setData((currentData) =>
			withRememberedIcon(
				{
					...currentData,
					streaks: currentData.streaks.map((streak) =>
						streak.id === streakId ? { ...streak, icon } : streak,
					),
				},
				icon,
			),
		);
	}

	function updateStreak(
		streakId: string,
		updater: (streak: Streak) => Streak,
	) {
		setUndoToast(null);
		setData((currentData) => ({
			...currentData,
			streaks: currentData.streaks.map((streak) =>
				streak.id === streakId ? updater(streak) : streak,
			),
		}));
	}

	function captureReviewSnapshot() {
		if (reviewSnapshotRef.current !== null) return;

		reviewSnapshotRef.current = data;
		setUndoToast(null);
	}

	return {
		today,
		streaks: data.streaks,
		completedTodayStreakIds,
		iconOptions: getStreakIconOptions(data.recentIcons),
		unreviewedDays,
		hasPendingReview,
		undoToast: undoToast && {
			key: undoToast.key,
			kind: undoToast.kind,
			name: undoToast.name,
		},
		create,
		rememberIcon,
		updateIcon,
		rename: (streakId, name) =>
			updateStreak(streakId, (streak) => renameStreak(streak, name)),
		adjustDays: (streakId, days) =>
			updateStreak(streakId, (streak) => adjustStreakDays(streak, days)),
		remove: (streakId) => {
			openUndoToast(
				{
					kind: "delete",
					name:
						data.streaks.find((streak) => streak.id === streakId)?.name ?? null,
				},
				data,
			);
			setData((currentData) => ({
				...currentData,
				streaks: currentData.streaks.filter((streak) => streak.id !== streakId),
				checkIns: currentData.checkIns.filter(
					(checkIn) => checkIn.streakId !== streakId,
				),
			}));
		},
		completeToday: (streakId) => {
			const streak = data.streaks.find((candidate) => candidate.id === streakId);
			if (!streak || hasStreakCheckIn(data.checkIns, streakId, today)) return;

			openUndoToast({ kind: "today", name: streak.name }, data);
			setData((currentData) => completeStreakOn(currentData, streakId, today));
		},
		isCompletedOn: (streakId, day) =>
			hasStreakCheckIn(data.checkIns, streakId, day),
		resolveDay: (day, answers) => {
			captureReviewSnapshot();
			setData((currentData) => resolveSingleDay(currentData, day, answers));
		},
		resolveGap: (days, answers) => {
			captureReviewSnapshot();
			setData((currentData) => resolveGap(currentData, days, answers));
		},
		undo: () => {
			if (undoToast) setData(undoToast.snapshot);
			reviewSnapshotRef.current = null;
			setUndoToast(null);
		},
		dismissUndo: () => setUndoToast(null),
		replaceData: (nextData) => {
			reviewSnapshotRef.current = null;
			setUndoToast(null);
			setData(nextData);
		},
	};
}
