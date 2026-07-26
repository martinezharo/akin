"use client";

import { ArrowRight, ChevronDown, Clock3, RotateCcw, Sparkles } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { ui } from "@/i18n";
import { formatLocalDate, type LocalDateKey } from "../../model/calendar";
import styles from "./demo-time-controls.module.css";

const DEFAULT_CUSTOM_DAYS = 7;
const MAX_CUSTOM_DAYS = 3650;

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
	const customDaysId = useId();

	function advance(days: number) {
		setIsCollapsed(true);
		onAdvance(days);
	}

	function reset() {
		setIsCollapsed(false);
		onReset();
	}

	function advanceCustom(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const value = new FormData(event.currentTarget).get("days");
		const days = typeof value === "string" ? Number(value) : Number.NaN;

		if (!Number.isSafeInteger(days) || days < 1 || days > MAX_CUSTOM_DAYS) return;

		advance(days);
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
				<div className={styles.copy} aria-hidden={isCollapsed}>
					<p>{ui.demo.title}</p>
					<time dateTime={today}>{formatLocalDate(today)}</time>
				</div>
				<ChevronDown className={styles.chevron} aria-hidden="true" />
			</button>
			<div
				className={styles.panel}
				id="demo-clock-panel"
				aria-hidden={isCollapsed}
				inert={isCollapsed}
			>
				<div className={styles.panelContent}>
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
					<form
						className={styles.customJump}
						data-disabled={hasPendingReview}
						onSubmit={advanceCustom}
					>
						<label className={styles.customCopy} htmlFor={customDaysId}>
							<span>{ui.demo.customLeap}</span>
							<small>{ui.demo.customHint}</small>
						</label>
						<div className={styles.customControl}>
							<input
								id={customDaysId}
								name="days"
								type="number"
								inputMode="numeric"
								min={1}
								max={MAX_CUSTOM_DAYS}
								step={1}
								defaultValue={DEFAULT_CUSTOM_DAYS}
								disabled={hasPendingReview}
								required
								aria-label={ui.demo.customDaysLabel}
							/>
							<span aria-hidden="true">{ui.demo.days}</span>
							<button
								type="submit"
								disabled={hasPendingReview}
								aria-label={ui.demo.leap}
							>
								<ArrowRight aria-hidden="true" />
							</button>
						</div>
					</form>
					{hasPendingReview ? <p className={styles.hint}>{ui.demo.finishReview}</p> : null}
				</div>
			</div>
		</aside>
	);
}
