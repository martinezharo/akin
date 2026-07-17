"use client";

import { useEffect, useRef } from "react";

/**
 * Counts down `durationMs` and fires `onTimeout`, freezing the countdown while
 * `paused` is true. Remaining time survives pause/resume cycles. Remount the
 * consumer (e.g. with a `key`) to restart the countdown from scratch.
 */
export function usePausableTimeout({
	durationMs,
	paused,
	onTimeout,
}: {
	durationMs: number;
	paused: boolean;
	onTimeout: () => void;
}) {
	const remainingMsRef = useRef(durationMs);
	const onTimeoutRef = useRef(onTimeout);

	useEffect(() => {
		onTimeoutRef.current = onTimeout;
	}, [onTimeout]);

	useEffect(() => {
		if (paused) return;

		const startedAt = performance.now();
		const timeout = window.setTimeout(
			() => onTimeoutRef.current(),
			remainingMsRef.current,
		);

		return () => {
			window.clearTimeout(timeout);
			remainingMsRef.current = Math.max(
				0,
				remainingMsRef.current - (performance.now() - startedAt),
			);
		};
	}, [paused, durationMs]);
}
