import { Goal, SmilePlus } from "lucide-react";

export type StreakIconValue = string | null;

export type StreakIconOption = {
	readonly value: string;
	readonly label: string;
};

export const DEFAULT_STREAK_ICON: StreakIconValue = null;

export const STREAK_ICON_OPTIONS = [
	{ value: "💪", label: "Strength" },
	{ value: "🧠", label: "Learning" },
	{ value: "📚", label: "Reading" },
	{ value: "🏃", label: "Running" },
	{ value: "🧘", label: "Meditation" },
	{ value: "💧", label: "Hydration" },
	{ value: "🥗", label: "Healthy food" },
	{ value: "😴", label: "Sleep" },
	{ value: "✍️", label: "Writing" },
	{ value: "🎨", label: "Creativity" },
	{ value: "🎸", label: "Music" },
	{ value: "🌱", label: "Growth" },
	{ value: "🧹", label: "Tidying" },
	{ value: "💸", label: "Saving" },
	{ value: "❤️", label: "Wellbeing" },
	{ value: "☀️", label: "Morning" },
	{ value: "🌙", label: "Evening" },
	{ value: "✅", label: "Daily goal" },
	{ value: "✨", label: "Something special" },
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
				label: `Recently used emoji ${value}`,
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
		return <SmilePlus className="default-streak-icon" aria-hidden="true" />;
	}

	return <StreakIcon value={value} />;
}

export function StreakIcon({ value }: { value: StreakIconValue }) {
	if (value !== DEFAULT_STREAK_ICON) {
		return (
			<span className="streak-icon-emoji" aria-hidden="true">
				{value}
			</span>
		);
	}

	return <Goal className="default-streak-icon" aria-hidden="true" />;
}
