"use client";

import { type CSSProperties, type FormEvent, useEffect, useRef, useState } from "react";
import { ui } from "@/i18n/en";
import { createStreak, type Streak } from "./create-streak";
import { IconPicker } from "./icon-picker";
import { StreakBadge } from "./streak-badge";
import { DEFAULT_STREAK_ICON, StreakIcon, type StreakIconValue } from "./streak-icons";

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

	const isOverflowing = overflowDistance > 0;
	const animationDuration = Math.min(18, Math.max(7, overflowDistance / 30 + 5));
	const style: StreakNameStyle = {
		"--streak-name-distance": `${overflowDistance}px`,
		"--streak-name-duration": `${animationDuration}s`,
	};

	return (
		<span className="streak-name" ref={viewportRef}>
			<span
				className="streak-name-track"
				data-overflowing={isOverflowing}
				ref={trackRef}
				style={style}
			>
				{name}
			</span>
		</span>
	);
}

export function Streaks() {
	const [name, setName] = useState("");
	const [icon, setIcon] = useState<StreakIconValue>(DEFAULT_STREAK_ICON);
	const [streaks, setStreaks] = useState<Streak[]>([]);

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const trimmedName = name.trim();
		if (!trimmedName) return;

		setStreaks((currentStreaks) => [createStreak(trimmedName, icon), ...currentStreaks]);
		setName("");
		setIcon(DEFAULT_STREAK_ICON);
	}

	return (
		<section className="streaks-shell" aria-labelledby="streaks-title">
			<h1 id="streaks-title" className="sr-only">
				{ui.streaks.title}
			</h1>

			<form className="streak-form" onSubmit={handleSubmit}>
				<IconPicker value={icon} onChange={setIcon} />
				<label className="sr-only" htmlFor="streak-name">
					{ui.streaks.nameLabel}
				</label>
				<input
					id="streak-name"
					className="streak-input"
					name="streakName"
					type="text"
					value={name}
					onChange={(event) => setName(event.target.value)}
					placeholder={ui.streaks.namePlaceholder}
					maxLength={72}
					autoComplete="off"
				/>
				<button
					className="add-streak-button"
					type="submit"
					disabled={!name.trim()}
					aria-label={ui.streaks.addAction}
				>
					<svg aria-hidden="true" viewBox="0 0 24 24">
						<path d="M12 5v14M5 12h14" />
					</svg>
				</button>
			</form>

			<ul className="streak-list" aria-label={ui.streaks.listLabel} aria-live="polite">
				{streaks.map((streak) => (
					<li className="streak-row" key={streak.id}>
						<span className="streak-icon">
							<StreakIcon value={streak.icon} />
						</span>
						<OverflowingStreakName name={streak.name} />
						<StreakBadge
							days={streak.days}
							ariaLabel={ui.streaks.currentCountLabel(streak.days)}
						/>
					</li>
				))}
			</ul>
		</section>
	);
}
