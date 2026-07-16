"use client";

import { useEffect, useRef, useState } from "react";

export function usePopover({ onDismiss }: { onDismiss?: () => void } = {}) {
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const popoverRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const onDismissRef = useRef(onDismiss);

	useEffect(() => {
		onDismissRef.current = onDismiss;
	}, [onDismiss]);

	function dismiss({ restoreFocus = false }: { restoreFocus?: boolean } = {}) {
		setIsOpen(false);
		onDismissRef.current?.();
		if (restoreFocus) triggerRef.current?.focus();
	}

	function toggle() {
		setIsOpen((currentValue) => {
			if (currentValue) onDismissRef.current?.();
			return !currentValue;
		});
	}

	useEffect(() => {
		if (!isOpen) return;

		function handlePointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) dismiss();
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				event.preventDefault();
				dismiss({ restoreFocus: true });
			}
		}

		function handleFocusIn(event: FocusEvent) {
			if (!rootRef.current?.contains(event.target as Node)) dismiss();
		}

		const focusFrame = requestAnimationFrame(() => {
			const selectedOption = popoverRef.current?.querySelector<HTMLElement>(
				'[aria-pressed="true"]',
			);
			(selectedOption ?? popoverRef.current?.querySelector<HTMLElement>("button"))?.focus();
		});

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("focusin", handleFocusIn);

		return () => {
			cancelAnimationFrame(focusFrame);
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("focusin", handleFocusIn);
		};
	}, [isOpen]);

	return { isOpen, rootRef, popoverRef, triggerRef, dismiss, toggle };
}
