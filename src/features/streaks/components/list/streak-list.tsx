"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ui } from "@/i18n/en";
import type { Streak } from "../../model/streak";
import { StreakBadge } from "../badge/streak-badge";
import { StreakIconPicker } from "../icon-picker/icon-picker";
import type { StreakIconOption, StreakIconValue } from "../icon-picker/streak-icons";
import { StreakActions } from "../streak-actions/streak-actions";
import styles from "./streak-list.module.css";

const EMPTY_STREAK_PREVIEW = [
	{ icon: "💧", name: ui.streaks.emptyExamples.hydration, days: 9 },
	{ icon: "📚", name: ui.streaks.emptyExamples.reading, days: 23 },
	{ icon: "🌱", name: ui.streaks.emptyExamples.progress, days: 25 },
] as const;

type StreakNameStyle = CSSProperties & {
	"--streak-name-distance": string;
	"--streak-name-duration": string;
};

function OverflowingStreakName({ name }: { name: string }) {
	const viewportRef = useRef<HTMLSpanElement>(null);
	const trackRef = useRef<HTMLSpanElement>(null);
	const [overflowDistance, setOverflowDistance] = useState(0);

	useEffect(() => {
		const viewport = viewportRef.current;
		const track = trackRef.current;
		if (!viewport || !track) return;

		function measureOverflow() {
			const currentViewport = viewportRef.current;
			const currentTrack = trackRef.current;
			if (!currentViewport || !currentTrack) return;

			const distance = Math.max(
				0,
				Math.ceil(currentTrack.scrollWidth - currentViewport.clientWidth),
			);
			setOverflowDistance((currentDistance) =>
				currentDistance === distance ? currentDistance : distance,
			);
		}

		measureOverflow();
		const resizeObserver = new ResizeObserver(measureOverflow);
		resizeObserver.observe(viewport);
		resizeObserver.observe(track);
		return () => resizeObserver.disconnect();
	}, [name]);

	const style: StreakNameStyle = {
		"--streak-name-distance": `${overflowDistance}px`,
		"--streak-name-duration": `${Math.min(18, Math.max(7, overflowDistance / 30 + 5))}s`,
	};

	return (
		<span className={styles.name} ref={viewportRef}>
			<span
				className={styles.nameTrack}
				data-overflowing={overflowDistance > 0}
				ref={trackRef}
				style={style}
			>
				{name}
			</span>
		</span>
	);
}

function EmptyStreakPreview() {
	return (
		<>
			{EMPTY_STREAK_PREVIEW.map((streak) => (
				<li
					className={`${styles.row} ${styles.emptyRow}`}
					key={streak.name}
					aria-hidden="true"
				>
					<span className={styles.emptyIcon}>{streak.icon}</span>
					<span className={styles.emptyName}>{streak.name}</span>
					<StreakBadge
						days={streak.days}
						ariaLabel={ui.streaks.currentCountLabel(streak.days)}
					/>
				</li>
			))}
		</>
	);
}

export function StreakList({
	streaks,
	iconOptions,
	onUpdateIcon,
	onRename,
	onAdjustDays,
	onRemove,
	adjustHintStreakId,
	onDismissAdjustHint,
	completedTodayStreakIds = [],
	celebratingStreakId = null,
	onCompleteToday,
}: {
	streaks: Streak[];
	iconOptions: readonly StreakIconOption[];
	onUpdateIcon: (streakId: string, icon: StreakIconValue) => void;
	onRename: (streakId: string, name: string) => void;
	onAdjustDays: (streakId: string, days: number) => void;
	onRemove: (streakId: string) => void;
	adjustHintStreakId: string | null;
	onDismissAdjustHint: () => void;
	completedTodayStreakIds?: readonly string[];
	celebratingStreakId?: string | null;
	onCompleteToday?: (streakId: string) => void;
}) {
	const isEmpty = streaks.length === 0;
	const completedTodayIds = new Set(completedTodayStreakIds);

	return (
		<>
			{isEmpty ? <p className={styles.emptyHint}>{ui.streaks.emptyPreview}</p> : null}
			<ul
				className={`${styles.list} ${isEmpty ? styles.emptyList : ""}`}
				aria-label={ui.streaks.listLabel}
				aria-live="polite"
			>
				{isEmpty ? (
					<EmptyStreakPreview />
				) : (
					streaks.map((streak) => {
						const completedToday = completedTodayIds.has(streak.id);

						return (
						<li className={styles.row} data-streak-id={streak.id} key={streak.id}>
							<StreakIconPicker
								value={streak.icon}
								onChange={(icon) => onUpdateIcon(streak.id, icon)}
								options={iconOptions}
								triggerLabel={ui.streaks.changeIconAction(streak.name)}
							/>
							<OverflowingStreakName name={streak.name} />
							<StreakBadge
								days={streak.days}
								ariaLabel={ui.streaks.currentCountLabel(streak.days)}
								completed={completedToday}
								celebrating={celebratingStreakId === streak.id}
								completeLabel={ui.streaks.completeToday(streak.name, streak.days)}
								completedLabel={ui.streaks.completedToday(
									streak.name,
									streak.days,
								)}
								onComplete={
									onCompleteToday
										? () => onCompleteToday(streak.id)
										: undefined
								}
							/>
							<StreakActions
								streak={streak}
								onRename={(name) => onRename(streak.id, name)}
								onAdjustDays={(days) => onAdjustDays(streak.id, days)}
								onRemove={() => onRemove(streak.id)}
								showAdjustHint={adjustHintStreakId === streak.id}
								onDismissAdjustHint={onDismissAdjustHint}
							/>
						</li>
						);
					})
				)}
			</ul>
		</>
	);
}
