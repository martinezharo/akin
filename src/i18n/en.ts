export const ui = {
	streaks: {
		title: "Streaks",
		nameLabel: "Streak name",
		namePlaceholder: "Add a streak",
		addAction: "Add streak",
		iconAction: "Choose an icon",
		iconPickerLabel: "Streak icon picker",
		iconPickerTitle: "Choose your icon",
		changeIconAction: (name: string) => `Change icon for ${name}`,
		customIconAction: "Add your own emoji",
		customIconLabel: "Custom emoji",
		customIconHint: "Use your emoji keyboard · one emoji only",
		listLabel: "Your streaks",
		currentCountLabel: (days: number) => `Current streak: ${days}`,
	},
} as const;
