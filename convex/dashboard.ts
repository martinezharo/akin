import { query } from "./_generated/server";
import { isRewardEligible, listActiveStreaks } from "./lib/streaks";
import { getProfile, getWallet, requireAuthUser } from "./lib/users";

export const get = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireAuthUser(ctx);
		const [profile, wallet, streaks] = await Promise.all([
			getProfile(ctx, user._id),
			getWallet(ctx, user._id),
			listActiveStreaks(ctx, user._id),
		]);
		if (!profile || !wallet) return null;
		const checkIns = await ctx.db
			.query("checkIns")
			.withIndex("by_user_date", (queryBuilder) =>
				queryBuilder
					.eq("userId", user._id)
					.gte("localDate", profile.lastReviewedOn),
			)
			.collect();

		const clientIds = new Map(streaks.map((streak) => [streak._id, streak.clientId]));
		return {
			user: { id: user._id, name: user.name, email: user.email },
			lastReviewedOn: profile.lastReviewedOn,
			recentIcons: profile.recentIcons,
			streaks: streaks.map((streak) => ({
				id: streak.clientId,
				name: streak.name,
				icon: streak.icon,
				days: streak.days,
				createdOn: streak.createdOn,
				rewardEligible: isRewardEligible(streak),
			})),
			checkIns: checkIns.flatMap((checkIn) => {
				const streakId = clientIds.get(checkIn.streakId);
				return streakId
					? [{ streakId, completedOn: checkIn.localDate, completedAt: checkIn.completedAt }]
					: [];
			}),
			wallet: {
				balance: wallet.balance,
				lifetimeEarned: wallet.lifetimeEarned,
				xp: wallet.xp ?? 0,
			},
		};
	},
});
