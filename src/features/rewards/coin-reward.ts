export type CoinReward = {
	/** Changes for every reward, including equal-sized consecutive rewards. */
	id: number;
	amount: number;
	/** The streak that produced the reward, when there is a single clear origin. */
	streakId: string | null;
};
