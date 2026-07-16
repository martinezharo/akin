"use client";

import { ChevronDown, ChevronUp, Clock3, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";
import { ui } from "@/i18n/en";
import { formatLocalDate, type LocalDateKey } from "../../model/calendar";
import styles from "./demo-time-controls.module.css";

export function DemoTimeControls({
	today,
	hasPendingReview,
	onAdvance,
	onReset,
}: {
	today: LocalDateKey;
	hasPendingReview: boolean;
	onAdvance: (days: number) => void;
	onReset: () => void;
}) {
	const [isCollapsed, setIsCollapsed] = useState(hasPendingReview);

	function advance(days: number) {
		setIsCollapsed(true);
		onAdvance(days);
	}

	function reset() {
		setIsCollapsed(false);
		onReset();
	}

	return (
		<aside className={styles.clock} data-collapsed={isCollapsed} aria-label={ui.demo.title}>
			<button
				className={styles.heading}
				type="button"
				aria-expanded={!isCollapsed}
				aria-controls="demo-clock-panel"
				aria-label={isCollapsed ? ui.demo.expand : ui.demo.collapse}
				onClick={() => setIsCollapsed((currentValue) => !currentValue)}
			>
				<span className={styles.icon}>
					<Clock3 aria-hidden="true" />
				</span>
				<div className={styles.copy}>
					<p>{ui.demo.title}</p>
					<time dateTime={today}>{formatLocalDate(today)}</time>
				</div>
				{isCollapsed ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
			</button>
			<div className={styles.panel} id="demo-clock-panel" hidden={isCollapsed}>
				<div className={styles.actions}>
				<button type="button" disabled={hasPendingReview} onClick={() => advance(1)}>
					<span>{ui.demo.tomorrow}</span>
					<Sparkles aria-hidden="true" />
				</button>
				<button type="button" disabled={hasPendingReview} onClick={() => advance(3)}>
					<span>{ui.demo.threeDays}</span>
					<Sparkles aria-hidden="true" />
				</button>
				<button type="button" disabled={hasPendingReview} onClick={() => advance(4)}>
					<span>{ui.demo.fourDays}</span>
					<Sparkles aria-hidden="true" />
				</button>
				<button
					className={styles.reset}
					type="button"
					aria-label={ui.demo.reset}
					onClick={reset}
				>
					<RotateCcw aria-hidden="true" />
				</button>
				</div>
				{hasPendingReview ? <p className={styles.hint}>{ui.demo.finishReview}</p> : null}
			</div>
		</aside>
	);
}
