"use client";

import { useEffect, useRef, useState } from "react";
import { ui } from "@/i18n/en";
import { STREAK_EMOJIS } from "./streak-emojis";

type EmojiPickerProps = {
	value: string;
	onChange: (emoji: string) => void;
};

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
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

	function selectEmoji(emoji: string) {
		onChange(emoji);
		setIsOpen(false);
		triggerRef.current?.focus();
	}

	return (
		<div className="emoji-picker" ref={pickerRef}>
			<button
				className="emoji-picker-trigger"
				type="button"
				ref={triggerRef}
				aria-label={ui.streaks.emojiAction}
				aria-expanded={isOpen}
				aria-haspopup="dialog"
				onClick={() => setIsOpen((currentValue) => !currentValue)}
			>
				<span aria-hidden="true">{value}</span>
			</button>

			{isOpen ? (
				<div className="emoji-picker-popover" role="dialog" aria-label={ui.streaks.emojiPickerLabel}>
					<p className="emoji-picker-title">{ui.streaks.emojiPickerTitle}</p>
					<div className="emoji-picker-grid">
						{STREAK_EMOJIS.map((option) => (
							<button
								className="emoji-option"
								type="button"
								key={option.emoji}
								aria-label={option.label}
								aria-pressed={value === option.emoji}
								onClick={() => selectEmoji(option.emoji)}
							>
								<span aria-hidden="true">{option.emoji}</span>
							</button>
						))}
					</div>
				</div>
			) : null}
		</div>
	);
}
