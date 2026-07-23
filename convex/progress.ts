import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, type MutationCtx } from "./_generated/server";
import {
	awardCompletionReward,
	canRewardCompletion,
	rewardedDayLimit,
} from "./lib/coins";
import {
	addLocalDays,
	assertCurrentLocalDate,
	assertLocalDate,
	assertLocalDates,
	datesAfterThrough,
} from "./lib/dates";
import { findOwnedStreak, hasCheckIn, isRewardEligible, listActiveStreaks } from "./lib/streaks";
import {
	createUndoRecord,
	type LegacyUndoSnapshot,
	type ProgressUndoSnapshot,
	shouldRestoreStreakDays,
	subtractRewardBalances,
	type UndoSnapshot,
	upsertReviewUndoRecord,
} from "./lib/undo";
import { getProfile, getWallet, requireAuthUser } from "./lib/users";

const answer = v.object({ streakId: v.string(), completed: v.boolean() });

async function createCheckIn(
	ctx: MutationCtx,
	args: {
		userId: string;
		streakId: Id<"streaks">;
		localDate: string;
		source: "today" | "review";
		awardCoin: boolean;
	},
) {
	const checkInId = await ctx.db.insert("checkIns", {
		userId: args.userId,
		streakId: args.streakId,
		localDate: args.localDate,
		completedAt: Date.now(),
		source: args.source,
	});
	const ledgerId = args.awardCoin
		? await awardCompletionReward(ctx, {
				userId: args.userId,
				checkInId,
				streakId: args.streakId,
				localDate: args.localDate,
			})
		: null;
	return { checkInId, ledgerId };
}

async function baseUndoSnapshot(
): Promise<ProgressUndoSnapshot> {
	return {
		version: 2,
		type: "progress",
		streaks: [],
		checkInIds: [],
		ledgerIds: [],
	};
}

export const completeToday = mutation({
	args: { streakId: v.string(), today: v.string() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const profile = await getProfile(ctx, user._id);
		if (!profile) throw new Error("Profile missing for authenticated user");
		assertCurrentLocalDate(args.today, profile.timeZone ?? "UTC");
		const streak = await findOwnedStreak(ctx, user._id, args.streakId);
		if (streak.createdOn > args.today) {
			throw new ConvexError({ code: "INVALID_DATE", message: "Streak did not exist yet" });
		}
		if (await hasCheckIn(ctx, user._id, streak._id, args.today)) {
			return { completed: false, coinsAwarded: 0, undoId: null, name: streak.name };
		}

		const snapshot = await baseUndoSnapshot();
		snapshot.streaks.push({
			streakId: streak._id,
			daysBefore: streak.days,
			daysAfter: streak.days + 1,
		});
		const created = await createCheckIn(ctx, {
			userId: user._id,
			streakId: streak._id,
			localDate: args.today,
			source: "today",
			awardCoin:
				isRewardEligible(streak) && canRewardCompletion(streak.createdOn, args.today),
		});
		snapshot.checkInIds.push(created.checkInId);
		if (created.ledgerId) snapshot.ledgerIds.push(created.ledgerId);
		await ctx.db.patch(streak._id, { days: streak.days + 1, updatedAt: Date.now() });
		const undoId = await createUndoRecord(ctx, user._id, "today", snapshot);
		return {
			completed: true,
			coinsAwarded: created.ledgerId ? 1 : 0,
			undoId,
			name: streak.name,
		};
	},
});

export const resolveDay = mutation({
	args: { day: v.string(), today: v.string(), answers: v.array(answer), reviewSessionId: v.string() },
	handler: async (ctx, args) => {
		assertLocalDate(args.day);
		const user = await requireAuthUser(ctx);
		const [profile, streaks] = await Promise.all([
			getProfile(ctx, user._id),
			listActiveStreaks(ctx, user._id),
		]);
		if (!profile) throw new Error("Profile missing for authenticated user");
		assertCurrentLocalDate(args.today, profile.timeZone ?? "UTC");
		if (args.day !== addLocalDays(profile.lastReviewedOn, 1) || args.day >= args.today) {
			throw new ConvexError({ code: "INVALID_REVIEW_DAY", message: "Review day is out of sequence" });
		}
		const answers = new Map(args.answers.map((item) => [item.streakId, item.completed]));
		const snapshot = await baseUndoSnapshot();
		snapshot.profile = {
			profileId: profile._id,
			lastReviewedOnBefore: profile.lastReviewedOn,
			lastReviewedOnAfter: args.day,
		};
		let coinsAwarded = 0;

		for (const streak of streaks) {
			if (streak.createdOn > args.day || (await hasCheckIn(ctx, user._id, streak._id, args.day))) continue;
			if (answers.get(streak.clientId) === true) {
				snapshot.streaks.push({
					streakId: streak._id,
					daysBefore: streak.days,
					daysAfter: streak.days + 1,
				});
				const created = await createCheckIn(ctx, {
					userId: user._id,
					streakId: streak._id,
					localDate: args.day,
					source: "review",
					awardCoin: isRewardEligible(streak),
				});
				snapshot.checkInIds.push(created.checkInId);
				if (created.ledgerId) {
					snapshot.ledgerIds.push(created.ledgerId);
					coinsAwarded += 1;
				}
				await ctx.db.patch(streak._id, { days: streak.days + 1, updatedAt: Date.now() });
			} else {
				snapshot.streaks.push({
					streakId: streak._id,
					daysBefore: streak.days,
					daysAfter: 0,
				});
				await ctx.db.patch(streak._id, { days: 0, updatedAt: Date.now() });
			}
		}

		await ctx.db.patch(profile._id, { lastReviewedOn: args.day, updatedAt: Date.now() });
		const undoId = await upsertReviewUndoRecord(
			ctx,
			user._id,
			args.reviewSessionId,
			snapshot,
		);
		return { undoId, coinsAwarded };
	},
});

export const resolveGap = mutation({
	args: { days: v.array(v.string()), today: v.string(), answers: v.array(answer), reviewSessionId: v.string() },
	handler: async (ctx, args) => {
		assertLocalDates(args.days);
		const user = await requireAuthUser(ctx);
		const [profile, streaks] = await Promise.all([
			getProfile(ctx, user._id),
			listActiveStreaks(ctx, user._id),
		]);
		if (!profile) throw new Error("Profile missing for authenticated user");
		assertCurrentLocalDate(args.today, profile.timeZone ?? "UTC");
		const expectedDays = datesAfterThrough(profile.lastReviewedOn, addLocalDays(args.today, -1));
		if (
			expectedDays.length <= 3 ||
			expectedDays.length !== args.days.length ||
			expectedDays.some((day, index) => day !== args.days[index])
		) {
			throw new ConvexError({ code: "INVALID_REVIEW_GAP", message: "Review gap is out of sequence" });
		}
		const answers = new Map(args.answers.map((item) => [item.streakId, item.completed]));
		const snapshot = await baseUndoSnapshot();
		snapshot.profile = {
			profileId: profile._id,
			lastReviewedOnBefore: profile.lastReviewedOn,
			lastReviewedOnAfter: args.days.at(-1)!,
		};
		let coinsAwarded = 0;

		for (const streak of streaks) {
			const unresolvedDays: string[] = [];
			for (const day of args.days) {
				if (streak.createdOn <= day && !(await hasCheckIn(ctx, user._id, streak._id, day))) {
					unresolvedDays.push(day);
				}
			}
			if (unresolvedDays.length === 0) continue;
			if (answers.get(streak.clientId) === true) {
				snapshot.streaks.push({
					streakId: streak._id,
					daysBefore: streak.days,
					daysAfter: streak.days + unresolvedDays.length,
				});
				let streakCoins = 0;
				for (const day of unresolvedDays) {
					const canAward = isRewardEligible(streak) && streakCoins < rewardedDayLimit(args.days.length);
					const created = await createCheckIn(ctx, {
						userId: user._id,
						streakId: streak._id,
						localDate: day,
						source: "review",
						awardCoin: canAward,
					});
					snapshot.checkInIds.push(created.checkInId);
					if (created.ledgerId) {
						snapshot.ledgerIds.push(created.ledgerId);
						streakCoins += 1;
						coinsAwarded += 1;
					}
				}
				await ctx.db.patch(streak._id, {
					days: streak.days + unresolvedDays.length,
					updatedAt: Date.now(),
				});
			} else {
				snapshot.streaks.push({
					streakId: streak._id,
					daysBefore: streak.days,
					daysAfter: 0,
				});
				await ctx.db.patch(streak._id, { days: 0, updatedAt: Date.now() });
			}
		}

		await ctx.db.patch(profile._id, {
			lastReviewedOn: args.days.at(-1)!,
			updatedAt: Date.now(),
		});
		const undoId = await upsertReviewUndoRecord(
			ctx,
			user._id,
			args.reviewSessionId,
			snapshot,
		);
		return { undoId, coinsAwarded };
	},
});

export const undo = mutation({
	args: { undoId: v.id("undoRecords") },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const record = await ctx.db.get(args.undoId);
		if (!record || record.userId !== user._id || record.usedAt !== undefined || record.expiresAt < Date.now()) {
			throw new ConvexError({ code: "UNDO_EXPIRED", message: "Undo is no longer available" });
		}

		const snapshot = (record.snapshotV2 ?? record.snapshot) as
			| UndoSnapshot
			| LegacyUndoSnapshot;
		if (!snapshot) {
			throw new ConvexError({ code: "UNDO_INVALID", message: "Undo data is unavailable" });
		}
		if (!("version" in snapshot)) {
			if (snapshot.type === "delete") {
				await ctx.db.patch(snapshot.streakId, { deletedAt: undefined, updatedAt: Date.now() });
			} else {
				for (const item of snapshot.streakDays) {
					await ctx.db.patch(item.streakId, { days: item.days, updatedAt: Date.now() });
				}
				for (const ledgerId of snapshot.ledgerIds) {
					if (await ctx.db.get(ledgerId)) await ctx.db.delete(ledgerId);
				}
				for (const checkInId of snapshot.checkInIds) {
					if (await ctx.db.get(checkInId)) await ctx.db.delete(checkInId);
				}
				await ctx.db.patch(snapshot.wallet.walletId, {
					balance: snapshot.wallet.balance,
					lifetimeEarned: snapshot.wallet.lifetimeEarned,
					xp: snapshot.wallet.xp,
					updatedAt: Date.now(),
				});
				if (snapshot.profile) {
					await ctx.db.patch(snapshot.profile.profileId, {
						lastReviewedOn: snapshot.profile.lastReviewedOn,
						updatedAt: Date.now(),
					});
				}
			}
			await ctx.db.patch(record._id, { usedAt: Date.now() });
			return;
		}

		if (snapshot.type === "delete") {
			const streak = await ctx.db.get(snapshot.streakId);
			if (
				streak?.userId === user._id &&
				streak.deletedAt === snapshot.deletedAt
			) {
				await ctx.db.patch(snapshot.streakId, { deletedAt: undefined, updatedAt: Date.now() });
			}
		} else {
			for (const item of snapshot.streaks) {
				const streak = await ctx.db.get(item.streakId);
				if (
					streak?.userId === user._id &&
					shouldRestoreStreakDays(streak.days, item)
				) {
					await ctx.db.patch(item.streakId, {
						days: item.daysBefore,
						updatedAt: Date.now(),
					});
				}
			}
			let rewardAmount = 0;
			for (const ledgerId of snapshot.ledgerIds) {
				const ledger = await ctx.db.get(ledgerId);
				if (ledger?.userId === user._id) {
					rewardAmount += ledger.amount;
					await ctx.db.delete(ledgerId);
				}
			}
			for (const checkInId of snapshot.checkInIds) {
				const checkIn = await ctx.db.get(checkInId);
				if (checkIn?.userId === user._id) await ctx.db.delete(checkInId);
			}
			const wallet = await getWallet(ctx, user._id);
			if (wallet && rewardAmount > 0) {
				const reverted = subtractRewardBalances(wallet, rewardAmount);
				await ctx.db.patch(wallet._id, {
					...reverted,
					updatedAt: Date.now(),
				});
			}
			if (snapshot.profile) {
				const profile = await ctx.db.get(snapshot.profile.profileId);
				if (
					profile?.userId === user._id &&
					profile.lastReviewedOn === snapshot.profile.lastReviewedOnAfter
				) {
					await ctx.db.patch(snapshot.profile.profileId, {
						lastReviewedOn: snapshot.profile.lastReviewedOnBefore,
						updatedAt: Date.now(),
					});
				}
			}
		}

		await ctx.db.patch(record._id, { usedAt: Date.now() });
	},
});
