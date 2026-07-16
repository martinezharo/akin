"use client";

import {
	type RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

export type PopoverPlacement = "top" | "bottom";

export function getAdaptivePopoverPlacement({
	triggerTop,
	triggerBottom,
	popoverHeight,
	viewportTop,
	viewportBottom,
	gap,
}: {
	triggerTop: number;
	triggerBottom: number;
	popoverHeight: number;
	viewportTop: number;
	viewportBottom: number;
	gap: number;
}): PopoverPlacement {
	const spaceAbove = triggerTop - viewportTop - gap;
	const spaceBelow = viewportBottom - triggerBottom - gap;

	if (spaceBelow >= popoverHeight) return "bottom";
	if (spaceAbove >= popoverHeight) return "top";
	return spaceAbove > spaceBelow ? "top" : "bottom";
}

export function useAdaptivePopoverPlacement({
	isOpen,
	triggerRef,
	popoverRef,
	gap = 8,
}: {
	isOpen: boolean;
	triggerRef: RefObject<HTMLElement | null>;
	popoverRef: RefObject<HTMLElement | null>;
	gap?: number;
}): PopoverPlacement {
	const [placement, setPlacement] = useState<PopoverPlacement>("bottom");

	useLayoutEffect(() => {
		if (!isOpen) return;

		const visualViewport = window.visualViewport;
		const scrollOptions = { capture: true, passive: true } as const;

		function updatePlacement() {
			const trigger = triggerRef.current;
			const popover = popoverRef.current;
			if (!trigger || !popover) return;

			const triggerRect = trigger.getBoundingClientRect();
			const viewportTop = visualViewport?.offsetTop ?? 0;
			const viewportBottom =
				viewportTop + (visualViewport?.height ?? window.innerHeight);
			const nextPlacement = getAdaptivePopoverPlacement({
				triggerTop: triggerRect.top,
				triggerBottom: triggerRect.bottom,
				popoverHeight: popover.offsetHeight,
				viewportTop,
				viewportBottom,
				gap,
			});

			setPlacement((currentPlacement) =>
				currentPlacement === nextPlacement ? currentPlacement : nextPlacement,
			);
		}

		updatePlacement();
		window.addEventListener("resize", updatePlacement);
		window.addEventListener("scroll", updatePlacement, scrollOptions);
		visualViewport?.addEventListener("resize", updatePlacement);
		visualViewport?.addEventListener("scroll", updatePlacement, scrollOptions);

		return () => {
			window.removeEventListener("resize", updatePlacement);
			window.removeEventListener("scroll", updatePlacement, scrollOptions);
			visualViewport?.removeEventListener("resize", updatePlacement);
			visualViewport?.removeEventListener("scroll", updatePlacement, scrollOptions);
		};
	}, [gap, isOpen, popoverRef, triggerRef]);

	return placement;
}

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
