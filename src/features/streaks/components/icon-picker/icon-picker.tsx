"use client";

import { Plus } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { usePopover } from "@/shared/hooks/use-popover";
import { ui } from "@/i18n";
import { parseSingleEmoji } from "./emoji";
import {
	IconPickerIcon,
	streakIconOptions,
	StreakIcon,
	type StreakIconOption,
	type StreakIconValue,
} from "./streak-icons";
import styles from "./icon-picker.module.css";

type SharedIconPickerProps = {
	value: StreakIconValue;
	onChange: (icon: StreakIconValue) => void;
	triggerLabel: string;
	triggerClassName: string;
	triggerIcon: ReactNode;
	options: readonly StreakIconOption[];
};

function SharedIconPicker({
	value,
	onChange,
	triggerLabel,
	triggerClassName,
	triggerIcon,
	options,
}: SharedIconPickerProps) {
	const [isCustomInputOpen, setIsCustomInputOpen] = useState(false);
	const {
		isOpen,
		rootRef,
		popoverRef,
		triggerRef,
		dismiss,
		toggle,
	} = usePopover({ onDismiss: () => setIsCustomInputOpen(false) });
	const popoverId = useId();
	const hintId = useId();

	function selectIcon(icon: StreakIconValue) {
		onChange(icon);
		dismiss({ restoreFocus: true });
	}

	function handleGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		const keys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];
		if (!keys.includes(event.key)) return;

		const focusableOptions = Array.from(
			event.currentTarget.querySelectorAll<HTMLElement>("button, input"),
		);
		const currentIndex = focusableOptions.indexOf(document.activeElement as HTMLElement);
		if (currentIndex < 0) return;

		const offsets: Record<string, number> = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -5,
			ArrowDown: 5,
		};
		let nextIndex = currentIndex + (offsets[event.key] ?? 0);
		if (event.key === "Home") nextIndex = 0;
		if (event.key === "End") nextIndex = focusableOptions.length - 1;
		nextIndex = Math.max(0, Math.min(focusableOptions.length - 1, nextIndex));

		event.preventDefault();
		focusableOptions[nextIndex]?.focus();
	}

	return (
		<div
			className={styles.picker}
			data-icon-picker-open={isOpen}
			ref={rootRef}
		>
			<button
				className={triggerClassName}
				type="button"
				ref={triggerRef}
				aria-label={triggerLabel}
				aria-expanded={isOpen}
				aria-controls={isOpen ? popoverId : undefined}
				aria-haspopup="dialog"
				onClick={toggle}
			>
				{triggerIcon}
			</button>

			{isOpen ? (
				<div
					className={styles.popover}
					id={popoverId}
					ref={popoverRef}
					role="dialog"
					aria-label={ui.streaks.iconPickerLabel}
				>
					<p className={styles.title}>{ui.streaks.iconPickerTitle}</p>
					<div className={styles.grid} onKeyDown={handleGridKeyDown}>
						{options.map((option) => (
							<button
								className={styles.option}
								type="button"
								key={option.value}
								aria-label={option.label}
								aria-pressed={value === option.value}
								onClick={() => selectIcon(option.value)}
							>
								<StreakIcon value={option.value} />
							</button>
						))}
						{isCustomInputOpen ? (
							<input
								className={styles.customInput}
								type="text"
								value=""
								onChange={(event) => {
									const emoji = parseSingleEmoji(event.currentTarget.value);
									if (emoji) selectIcon(emoji);
								}}
								placeholder="☺️"
								autoComplete="off"
								autoCorrect="off"
								autoFocus
								spellCheck={false}
								aria-label={ui.streaks.customIconLabel}
								aria-describedby={hintId}
							/>
						) : (
							<button
								className={`${styles.option} ${styles.customOption}`}
								type="button"
								aria-label={ui.streaks.customIconAction}
								onClick={() => setIsCustomInputOpen(true)}
							>
								<Plus aria-hidden="true" />
							</button>
						)}
					</div>

					{isCustomInputOpen ? (
						<p className={styles.hint} id={hintId}>
							{ui.streaks.customIconHint}
						</p>
					) : null}
				</div>
			) : null}
		</div>
	);
}

type PublicIconPickerProps = {
	value: StreakIconValue;
	onChange: (icon: StreakIconValue) => void;
	options?: readonly StreakIconOption[];
};

export function ComposerIconPicker({
	value,
	onChange,
	options = streakIconOptions(),
}: PublicIconPickerProps) {
	return (
		<SharedIconPicker
			value={value}
			onChange={onChange}
			options={options}
			triggerLabel={ui.streaks.iconAction}
			triggerClassName={styles.composerTrigger}
			triggerIcon={<IconPickerIcon value={value} />}
		/>
	);
}

export function StreakIconPicker({
	value,
	onChange,
	triggerLabel,
	options = streakIconOptions(),
}: PublicIconPickerProps & { triggerLabel: string }) {
	return (
		<SharedIconPicker
			value={value}
			onChange={onChange}
			options={options}
			triggerLabel={triggerLabel}
			triggerClassName={styles.streakTrigger}
			triggerIcon={<StreakIcon value={value} />}
		/>
	);
}
