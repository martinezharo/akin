import { Goal, SmilePlus } from "lucide-react";

export type StreakIconValue = string | null;

export const DEFAULT_STREAK_ICON: StreakIconValue = null;

export const STREAK_ICON_OPTIONS = [
	{ value: "🔥", label: "Fire" },
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
] as const satisfies ReadonlyArray<{ value: StreakIconValue; label: string }>;

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
