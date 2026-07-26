import { Goal, SmilePlus } from "lucide-react";
import { ui, type Ui } from "@/i18n";
import styles from "./streak-icons.module.css";

export type StreakIconValue = string | null;

export type StreakIconOption = {
	readonly value: string;
	readonly label: string;
};

export const DEFAULT_STREAK_ICON: StreakIconValue = null;

/**
 * The emoji never change; their labels do. Keeping the catalog key here instead
 * of the translated label means the list can be built in whichever language is
 * active when it is rendered.
 */
const STREAK_ICONS = [
	{ value: "💪", labelKey: "strength" },
	{ value: "🧠", labelKey: "learning" },
	{ value: "📚", labelKey: "reading" },
	{ value: "🏃", labelKey: "running" },
	{ value: "🧘", labelKey: "meditation" },
	{ value: "💧", labelKey: "hydration" },
	{ value: "🥗", labelKey: "healthyFood" },
	{ value: "😴", labelKey: "sleep" },
	{ value: "✍️", labelKey: "writing" },
	{ value: "🎨", labelKey: "creativity" },
	{ value: "🎸", labelKey: "music" },
	{ value: "🌱", labelKey: "growth" },
	{ value: "🧹", labelKey: "tidying" },
	{ value: "💸", labelKey: "saving" },
	{ value: "❤️", labelKey: "wellbeing" },
	{ value: "☀️", labelKey: "morning" },
	{ value: "🌙", labelKey: "evening" },
	{ value: "✅", labelKey: "dailyGoal" },
	{ value: "✨", labelKey: "somethingSpecial" },
] as const satisfies ReadonlyArray<{ value: string; labelKey: keyof Ui["streaks"]["iconLabels"] }>;

export const STREAK_ICON_COUNT = STREAK_ICONS.length;

/** Call while rendering: the labels resolve in the language on screen. */
export function streakIconOptions(): StreakIconOption[] {
	return STREAK_ICONS.map(({ value, labelKey }) => ({ value, label: ui.streaks.iconLabels[labelKey] }));
}

export function getStreakIconOptions(recentIcons: readonly string[]): StreakIconOption[] {
	const catalogOptions = streakIconOptions();
	const optionByValue = new Map(catalogOptions.map((option) => [option.value, option]));
	const seenIcons = new Set<string>();
	const options: StreakIconOption[] = [];

	for (const value of recentIcons) {
		if (seenIcons.has(value)) continue;

		seenIcons.add(value);
		options.push(
			optionByValue.get(value) ?? {
				value,
				label: ui.streaks.recentlyUsedEmoji(value),
			},
		);
	}

	for (const option of catalogOptions) {
		if (seenIcons.has(option.value)) continue;

		seenIcons.add(option.value);
		options.push(option);
	}

	return options.slice(0, STREAK_ICON_COUNT);
}

export function IconPickerIcon({ value }: { value: StreakIconValue }) {
	if (value === DEFAULT_STREAK_ICON) {
		return <SmilePlus className={styles.defaultIcon} aria-hidden="true" />;
	}

	return <StreakIcon value={value} />;
}

export function StreakIcon({ value }: { value: StreakIconValue }) {
	if (value !== DEFAULT_STREAK_ICON) {
		return (
				<span className={styles.emoji} aria-hidden="true">
				{value}
			</span>
		);
	}

	return <Goal className={styles.defaultIcon} aria-hidden="true" />;
}
