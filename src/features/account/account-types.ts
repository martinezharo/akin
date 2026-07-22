export type AccountDashboardView = {
	user: { id: string; name: string; email: string };
	wallet: { balance: number; lifetimeEarned: number; xp: number };
	streaks: Array<{
		id: string;
		name: string;
		icon: string | null;
		rewardEligible: boolean;
	}>;
};
