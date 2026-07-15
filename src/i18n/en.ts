export const ui = {
	streaks: {
		title: "Streaks",
		nameLabel: "Streak name",
		namePlaceholder: "Add a streak",
		addAction: "Add streak",
		listLabel: "Your streaks",
		currentCountLabel: (days: number) => `Current streak: ${days}`,
	},
} as const;
