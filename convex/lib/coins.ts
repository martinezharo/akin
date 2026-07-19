import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { getWallet } from "./users";

export function rewardedDayLimit(reviewDayCount: number): number {
	return reviewDayCount > 3 ? 3 : reviewDayCount;
}

export function canRewardCompletion(
	streakCreatedOn: string,
	completionDay: string,
): boolean {
	return streakCreatedOn < completionDay;
}

export async function awardCompletionCoin(
	ctx: MutationCtx,
	args: {
		userId: string;
		checkInId: Id<"checkIns">;
		streakId: Id<"streaks">;
		localDate: string;
	},
) {
	const existing = await ctx.db
		.query("coinLedger")
		.withIndex("by_check_in", (query) => query.eq("checkInId", args.checkInId))
		.unique();
	if (existing) return null;

	const wallet = await getWallet(ctx, args.userId);
	if (!wallet) throw new Error("Wallet missing for authenticated user");

	const ledgerId = await ctx.db.insert("coinLedger", {
		...args,
		amount: 1,
		reason: "streak_completion",
		createdAt: Date.now(),
	});
	await ctx.db.patch(wallet._id, {
		balance: wallet.balance + 1,
		lifetimeEarned: wallet.lifetimeEarned + 1,
		updatedAt: Date.now(),
	});
	return ledgerId;
}
