"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ui } from "@/i18n/en";
import type { Streak } from "../../model/streak";
import { StreakBadge } from "../badge/streak-badge";
import { StreakIconPicker } from "../icon-picker/icon-picker";
import type { StreakIconOption, StreakIconValue } from "../icon-picker/streak-icons";
import styles from "./streak-list.module.css";

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

export function StreakList({
	streaks,
	iconOptions,
	onUpdateIcon,
}: {
	streaks: Streak[];
	iconOptions: readonly StreakIconOption[];
	onUpdateIcon: (streakId: string, icon: StreakIconValue) => void;
}) {
	return (
		<ul className={styles.list} aria-label={ui.streaks.listLabel} aria-live="polite">
			{streaks.map((streak) => (
				<li className={styles.row} key={streak.id}>
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
					/>
				</li>
			))}
		</ul>
	);
}
