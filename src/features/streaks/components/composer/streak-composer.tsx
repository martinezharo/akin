"use client";

import { type FormEvent, useState } from "react";
import { ui } from "@/i18n";
import { STREAK_NAME_MAX_LENGTH } from "../../model/streak";
import { ComposerIconPicker } from "../icon-picker/icon-picker";
import {
	DEFAULT_STREAK_ICON,
	type StreakIconOption,
	type StreakIconValue,
} from "../icon-picker/streak-icons";
import styles from "./streak-composer.module.css";

type StreakComposerProps = {
	iconOptions: readonly StreakIconOption[];
	onCreate: (name: string, icon: StreakIconValue) => void;
	onRememberIcon: (icon: StreakIconValue) => void;
};

export function StreakComposer({
	iconOptions,
	onCreate,
	onRememberIcon,
}: StreakComposerProps) {
	const [name, setName] = useState("");
	const [icon, setIcon] = useState<StreakIconValue>(DEFAULT_STREAK_ICON);

	function selectIcon(selectedIcon: StreakIconValue) {
		setIcon(selectedIcon);
		onRememberIcon(selectedIcon);
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) return;

		onCreate(trimmedName, icon);
		setName("");
		setIcon(DEFAULT_STREAK_ICON);
	}

	return (
		<form className={styles.form} onSubmit={submit}>
			<ComposerIconPicker value={icon} onChange={selectIcon} options={iconOptions} />
			<label className="sr-only" htmlFor="streak-name">
				{ui.streaks.nameLabel}
			</label>
			<input
				id="streak-name"
				className={styles.input}
				name="streakName"
				type="text"
				value={name}
				onChange={(event) => setName(event.target.value)}
				placeholder={ui.streaks.namePlaceholder}
				maxLength={STREAK_NAME_MAX_LENGTH}
				autoComplete="off"
			/>
			<button
				className={styles.submit}
				type="submit"
				disabled={!name.trim()}
				aria-label={ui.streaks.addAction}
			>
				<svg aria-hidden="true" viewBox="0 0 24 24">
					<path d="M12 5v14M5 12h14" />
				</svg>
			</button>
		</form>
	);
}
