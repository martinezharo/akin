export const ui = {
	streaks: {
		title: "Streaks",
		nameLabel: "Streak name",
		namePlaceholder: "Add a streak",
		addAction: "Add streak",
		iconAction: "Choose an icon",
		iconPickerLabel: "Streak icon picker",
		iconPickerTitle: "Choose your icon",
		listLabel: "Your streaks",
		currentCountLabel: (days: number) => `Current streak: ${days}`,
	},
} as const;
