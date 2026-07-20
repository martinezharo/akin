"use client";

import { Check } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { usePausableTimeout } from "../hooks/use-pausable-timeout";
import styles from "./undo-toast.module.css";

export const UNDO_TOAST_DURATION_MS = 7000;
const EXIT_DURATION_MS = 180;

export function UndoToast({
	message,
	actionLabel,
	durationMs = UNDO_TOAST_DURATION_MS,
	onUndo,
	onDismiss,
	statusIcon,
	variant = "success",
}: {
	message: ReactNode;
	actionLabel: string;
	durationMs?: number;
	onUndo: () => void;
	onDismiss: () => void;
	statusIcon?: ReactNode;
	variant?: "success" | "warning";
}) {
	const [isPaused, setIsPaused] = useState(false);
	const [isExiting, setIsExiting] = useState(false);
	usePausableTimeout({
		durationMs,
		paused: isPaused,
		onTimeout: () => setIsExiting(true),
	});

	useEffect(() => {
		if (!isExiting) return;

		const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches
			? 0
			: EXIT_DURATION_MS;
		const timeout = window.setTimeout(onDismiss, delay);
		return () => window.clearTimeout(timeout);
	}, [isExiting, onDismiss]);

	return (
		<div
			className={styles.toast}
			data-exiting={isExiting}
			data-paused={isPaused}
			role="status"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onFocusCapture={() => setIsPaused(true)}
			onBlurCapture={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
			}}
		>
			<span className={styles.status} data-variant={variant} aria-hidden="true">
				{statusIcon ?? <Check />}
			</span>
			<p className={styles.message}>{message}</p>
			<span className={styles.divider} aria-hidden="true" />
			<button className={styles.undo} type="button" onClick={onUndo}>
				<span>{actionLabel}</span>
			</button>
		</div>
	);
}
