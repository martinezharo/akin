"use client";

import { useEffect, useState } from "react";
import {
	getStreakIconOptions,
	STREAK_ICON_OPTIONS,
	type StreakIconOption,
	type StreakIconValue,
} from "../components/icon-picker/streak-icons";
import { addLocalDays, getUnreviewedDays, type LocalDateKey } from "../model/calendar";
import { resolveGap, resolveSingleDay, type ReviewAnswers } from "../model/progress";
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

export type StreaksController = {
	today: LocalDateKey;
	streaks: Streak[];
	iconOptions: StreakIconOption[];
	unreviewedDays: LocalDateKey[];
	hasPendingReview: boolean;
	create: (name: string, icon: StreakIconValue) => string;
	rememberIcon: (icon: StreakIconValue) => void;
	updateIcon: (streakId: string, icon: StreakIconValue) => void;
	rename: (streakId: string, name: string) => void;
	adjustDays: (streakId: string, days: number) => void;
	remove: (streakId: string) => void;
	resolveDay: (day: LocalDateKey, answers: ReviewAnswers) => void;
	resolveGap: (days: LocalDateKey[], answers: ReviewAnswers) => void;
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

	useEffect(() => {
		saveStreaksData(storageKey, data);
	}, [data, storageKey]);

	const unreviewedDays = getUnreviewedDays(data.lastReviewedOn, today);
	const hasPendingReview = data.streaks.length > 0 && unreviewedDays.length > 0;

	function rememberIcon(icon: StreakIconValue) {
		setData((currentData) => withRememberedIcon(currentData, icon));
	}

	function create(name: string, icon: StreakIconValue) {
		const streak = createStreak(name, icon, today);
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
		setData((currentData) => ({
			...currentData,
			streaks: currentData.streaks.map((streak) =>
				streak.id === streakId ? updater(streak) : streak,
			),
		}));
	}

	return {
		today,
		streaks: data.streaks,
		iconOptions: getStreakIconOptions(data.recentIcons),
		unreviewedDays,
		hasPendingReview,
		create,
		rememberIcon,
		updateIcon,
		rename: (streakId, name) =>
			updateStreak(streakId, (streak) => renameStreak(streak, name)),
		adjustDays: (streakId, days) =>
			updateStreak(streakId, (streak) => adjustStreakDays(streak, days)),
		remove: (streakId) =>
			setData((currentData) => ({
				...currentData,
				streaks: currentData.streaks.filter((streak) => streak.id !== streakId),
			})),
		resolveDay: (day, answers) =>
			setData((currentData) => resolveSingleDay(currentData, day, answers)),
		resolveGap: (days, answers) =>
			setData((currentData) => resolveGap(currentData, days, answers)),
		replaceData: setData,
	};
}
