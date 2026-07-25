"use client";

import { useEffect, useState } from "react";

/**
 * Holds a value back until it stops changing.
 *
 * Typing into a search box otherwise opens one server subscription per
 * keystroke. `useDeferredValue` only reschedules the render, so it does not
 * help there — the query has to be the thing that waits.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value);

	useEffect(() => {
		if (value === debouncedValue) return;

		const timeout = setTimeout(() => setDebouncedValue(value), delayMs);
		return () => clearTimeout(timeout);
	}, [debouncedValue, delayMs, value]);

	return debouncedValue;
}
