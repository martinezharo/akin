import { Goal, SmilePlus } from "lucide-react";
import { ui } from "@/i18n/en";
import styles from "./streak-icons.module.css";

export type StreakIconValue = string | null;

export type StreakIconOption = {
	readonly value: string;
	readonly label: string;
};

export const DEFAULT_STREAK_ICON: StreakIconValue = null;

export const STREAK_ICON_OPTIONS = [
	{ value: "💪", label: ui.streaks.iconLabels.strength },
	{ value: "🧠", label: ui.streaks.iconLabels.learning },
	{ value: "📚", label: ui.streaks.iconLabels.reading },
	{ value: "🏃", label: ui.streaks.iconLabels.running },
	{ value: "🧘", label: ui.streaks.iconLabels.meditation },
	{ value: "💧", label: ui.streaks.iconLabels.hydration },
	{ value: "🥗", label: ui.streaks.iconLabels.healthyFood },
	{ value: "😴", label: ui.streaks.iconLabels.sleep },
	{ value: "✍️", label: ui.streaks.iconLabels.writing },
	{ value: "🎨", label: ui.streaks.iconLabels.creativity },
	{ value: "🎸", label: ui.streaks.iconLabels.music },
	{ value: "🌱", label: ui.streaks.iconLabels.growth },
	{ value: "🧹", label: ui.streaks.iconLabels.tidying },
	{ value: "💸", label: ui.streaks.iconLabels.saving },
	{ value: "❤️", label: ui.streaks.iconLabels.wellbeing },
	{ value: "☀️", label: ui.streaks.iconLabels.morning },
	{ value: "🌙", label: ui.streaks.iconLabels.evening },
	{ value: "✅", label: ui.streaks.iconLabels.dailyGoal },
	{ value: "✨", label: ui.streaks.iconLabels.somethingSpecial },
] as const satisfies ReadonlyArray<StreakIconOption>;

const STREAK_ICON_OPTION_BY_VALUE = new Map<string, StreakIconOption>(
	STREAK_ICON_OPTIONS.map((option) => [option.value, option]),
);

export function getStreakIconOptions(recentIcons: readonly string[]): StreakIconOption[] {
	const seenIcons = new Set<string>();
	const options: StreakIconOption[] = [];

	for (const value of recentIcons) {
		if (seenIcons.has(value)) continue;

		seenIcons.add(value);
		options.push(
			STREAK_ICON_OPTION_BY_VALUE.get(value) ?? {
				value,
				label: ui.streaks.recentlyUsedEmoji(value),
			},
		);
	}

	for (const option of STREAK_ICON_OPTIONS) {
		if (seenIcons.has(option.value)) continue;

		seenIcons.add(option.value);
		options.push(option);
	}

	return options.slice(0, STREAK_ICON_OPTIONS.length);
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
