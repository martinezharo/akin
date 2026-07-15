export const ui = {
	streaks: {
		title: "Streaks",
		nameLabel: "Streak name",
		namePlaceholder: "Add a streak",
		addAction: "Add streak",
		emojiAction: "Choose an icon",
		emojiPickerLabel: "Streak icon picker",
		emojiPickerTitle: "Choose your icon",
		listLabel: "Your streaks",
		currentCountLabel: (days: number) => `Current streak: ${days}`,
	},
} as const;
