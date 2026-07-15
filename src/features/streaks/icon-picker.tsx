"use client";

import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ui } from "@/i18n/en";
import { parseSingleEmoji } from "./emoji";
import {
	IconPickerIcon,
	STREAK_ICON_OPTIONS,
	StreakIcon,
	type StreakIconValue,
} from "./streak-icons";

type IconPickerProps = {
	value: StreakIconValue;
	onChange: (icon: StreakIconValue) => void;
	variant?: "composer" | "streak";
	triggerLabel?: string;
};

export function IconPicker({
	value,
	onChange,
	variant = "composer",
	triggerLabel = ui.streaks.iconAction,
}: IconPickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const isStreakVariant = variant === "streak";

	useEffect(() => {
		if (!isOpen) return;

		function handlePointerDown(event: PointerEvent) {
			if (!pickerRef.current?.contains(event.target as Node)) {
				setIsOpen(false);
				setIsCustomInputOpen(false);
			}
		}

		function handleKeyDown(event: KeyboardEvent) {
			if (event.key === "Escape") {
				setIsOpen(false);
				setIsCustomInputOpen(false);
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
		setIsCustomInputOpen(false);
		triggerRef.current?.focus();
	}

	function togglePicker() {
		if (isOpen) setIsCustomInputOpen(false);
		setIsOpen((currentValue) => !currentValue);
	}

	function handleCustomEmojiChange(inputValue: string) {
		const emoji = parseSingleEmoji(inputValue);
		if (emoji) selectIcon(emoji);
	}

	return (
		<div className={`icon-picker icon-picker-${variant}`} ref={pickerRef}>
			<button
				className={isStreakVariant ? "streak-icon streak-icon-trigger" : "icon-picker-trigger"}
				type="button"
				ref={triggerRef}
				aria-label={triggerLabel}
				aria-expanded={isOpen}
				aria-haspopup="dialog"
				onClick={togglePicker}
			>
				{isStreakVariant ? <StreakIcon value={value} /> : <IconPickerIcon value={value} />}
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
						{isCustomInputOpen ? (
							<input
								className="custom-emoji-input"
								type="text"
								value=""
								onChange={(event) => handleCustomEmojiChange(event.currentTarget.value)}
								placeholder="☺️"
								autoComplete="off"
								autoCorrect="off"
								autoFocus
								spellCheck={false}
								aria-label={ui.streaks.customIconLabel}
								aria-describedby="custom-emoji-hint"
							/>
						) : (
							<button
								className="icon-option icon-option-custom"
								type="button"
								aria-label={ui.streaks.customIconAction}
								onClick={() => setIsCustomInputOpen(true)}
							>
								<Plus aria-hidden="true" />
							</button>
						)}
					</div>

					{isCustomInputOpen ? (
						<p className="custom-emoji-hint" id="custom-emoji-hint">
							{ui.streaks.customIconHint}
						</p>
					) : null}
				</div>
			) : null}
		</div>
	);
}
