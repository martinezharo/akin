"use client";

import { Undo2, X } from "lucide-react";
import { type CSSProperties, type ReactNode, useState } from "react";
import { usePausableTimeout } from "../hooks/use-pausable-timeout";
import styles from "./undo-toast.module.css";

export const UNDO_TOAST_DURATION_MS = 7000;

type FuseStyle = CSSProperties & {
	"--undo-toast-duration": string;
};

export function UndoToast({
	message,
	icon,
	actionLabel,
	dismissLabel,
	durationMs = UNDO_TOAST_DURATION_MS,
	onUndo,
	onDismiss,
}: {
	message: ReactNode;
	icon: ReactNode;
	actionLabel: string;
	dismissLabel: string;
	durationMs?: number;
	onUndo: () => void;
	onDismiss: () => void;
}) {
	const [isPaused, setIsPaused] = useState(false);
	usePausableTimeout({ durationMs, paused: isPaused, onTimeout: onDismiss });

	const fuseStyle: FuseStyle = {
		"--undo-toast-duration": `${durationMs}ms`,
	};

	return (
		<div
			className={styles.toast}
			data-paused={isPaused}
			role="status"
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onFocusCapture={() => setIsPaused(true)}
			onBlurCapture={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
			}}
		>
			<span className={styles.sticker} aria-hidden="true">
				{icon}
			</span>
			<p className={styles.message}>{message}</p>
			<button className={styles.undo} type="button" onClick={onUndo}>
				<Undo2 aria-hidden="true" />
				<span>{actionLabel}</span>
			</button>
			<button
				className={styles.dismiss}
				type="button"
				aria-label={dismissLabel}
				onClick={onDismiss}
			>
				<X aria-hidden="true" />
			</button>
			<span className={styles.fuse} aria-hidden="true">
				<span className={styles.fuseProgress} style={fuseStyle} />
			</span>
		</div>
	);
}
