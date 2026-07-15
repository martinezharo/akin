"use client";

import { useEffect, useRef, useState } from "react";
import { ui } from "@/i18n/en";
import {
	IconPickerIcon,
	STREAK_ICON_OPTIONS,
	StreakIcon,
	type StreakIconValue,
} from "./streak-icons";

type IconPickerProps = {
	value: StreakIconValue;
	onChange: (icon: StreakIconValue) => void;
};

export function IconPicker({ value, onChange }: IconPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!isOpen) return;

		function handlePointerDown(event: PointerEvent) {
			if (!pickerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
				triggerRef.current?.focus();
			}
		}

		document.addEventListener("pointerdown", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	function selectIcon(icon: StreakIconValue) {
		onChange(icon);
		setIsOpen(false);
		triggerRef.current?.focus();
	}

	return (
		<div className="icon-picker" ref={pickerRef}>
			<button
				className="icon-picker-trigger"
				type="button"
				ref={triggerRef}
				aria-label={ui.streaks.iconAction}
				aria-expanded={isOpen}
				aria-haspopup="dialog"
				onClick={() => setIsOpen((currentValue) => !currentValue)}
			>
				<IconPickerIcon value={value} />
			</button>

			{isOpen ? (
				<div className="icon-picker-popover" role="dialog" aria-label={ui.streaks.iconPickerLabel}>
					<p className="icon-picker-title">{ui.streaks.iconPickerTitle}</p>
					<div className="icon-picker-grid">
						{STREAK_ICON_OPTIONS.map((option) => (
							<button
								className="icon-option"
								type="button"
								key={option.value ?? "default"}
								aria-label={option.label}
								aria-pressed={value === option.value}
								onClick={() => selectIcon(option.value)}
							>
								<StreakIcon value={option.value} />
							</button>
						))}
					</div>
				</div>
			) : null}
		</div>
	);
}
