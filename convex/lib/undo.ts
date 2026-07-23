import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export const UNDO_WINDOW_MS = 30_000;

export type LegacyProgressUndoSnapshot = {
	type: "progress";
	streakDays: Array<{ streakId: Id<"streaks">; days: number }>;
	checkInIds: Array<Id<"checkIns">>;
	ledgerIds: Array<Id<"coinLedger">>;
	wallet: { walletId: Id<"wallets">; balance: number; lifetimeEarned: number; xp: number };
	profile?: { profileId: Id<"profiles">; lastReviewedOn: string };
};

export type LegacyDeleteUndoSnapshot = {
	type: "delete";
	streakId: Id<"streaks">;
};

export type LegacyUndoSnapshot = LegacyProgressUndoSnapshot | LegacyDeleteUndoSnapshot;

export type ProgressUndoSnapshot = {
	version: 2;
	type: "progress";
	streaks: Array<{
		streakId: Id<"streaks">;
		daysBefore: number;
		daysAfter: number;
	}>;
	checkInIds: Array<Id<"checkIns">>;
	ledgerIds: Array<Id<"coinLedger">>;
	profile?: {
		profileId: Id<"profiles">;
		lastReviewedOnBefore: string;
		lastReviewedOnAfter: string;
	};
};

export type DeleteUndoSnapshot = {
	version: 2;
	type: "delete";
	streakId: Id<"streaks">;
	deletedAt: number;
};

export type UndoSnapshot = ProgressUndoSnapshot | DeleteUndoSnapshot;

export function mergeProgressUndoSnapshots(
	previous: ProgressUndoSnapshot,
	snapshot: ProgressUndoSnapshot,
): ProgressUndoSnapshot {
	const latestByStreak = new Map(snapshot.streaks.map((item) => [item.streakId, item]));
	return {
		...previous,
		streaks: [
			...previous.streaks.map((item) => ({
				...item,
				daysAfter: latestByStreak.get(item.streakId)?.daysAfter ?? item.daysAfter,
			})),
			...snapshot.streaks.filter((item) =>
				!previous.streaks.some((previousItem) => previousItem.streakId === item.streakId),
			),
		],
		checkInIds: [...previous.checkInIds, ...snapshot.checkInIds],
		ledgerIds: [...previous.ledgerIds, ...snapshot.ledgerIds],
		profile: snapshot.profile
			? {
					...snapshot.profile,
					lastReviewedOnBefore:
						previous.profile?.lastReviewedOnBefore ??
						snapshot.profile.lastReviewedOnBefore,
				}
			: previous.profile,
	};
}

export function shouldRestoreStreakDays(
	currentDays: number,
	snapshot: ProgressUndoSnapshot["streaks"][number],
): boolean {
	return currentDays === snapshot.daysAfter;
}

export function subtractRewardBalances(
	wallet: { balance: number; lifetimeEarned: number; xp?: number },
	rewardAmount: number,
) {
	return {
		balance: Math.max(0, wallet.balance - rewardAmount),
		lifetimeEarned: Math.max(0, wallet.lifetimeEarned - rewardAmount),
		xp: Math.max(0, (wallet.xp ?? 0) - rewardAmount),
	};
}

export async function createUndoRecord(
	ctx: MutationCtx,
	userId: string,
	kind: "today" | "review" | "delete",
	snapshot: UndoSnapshot,
) {
	const now = Date.now();
	return await ctx.db.insert("undoRecords", {
		userId,
		kind,
		snapshotV2: snapshot,
		createdAt: now,
		expiresAt: now + UNDO_WINDOW_MS,
	});
}

export async function upsertReviewUndoRecord(
	ctx: MutationCtx,
	userId: string,
	sessionId: string,
	snapshot: ProgressUndoSnapshot,
) {
	const existing = await ctx.db
		.query("undoRecords")
		.withIndex("by_user_session", (query) =>
			query.eq("userId", userId).eq("sessionId", sessionId),
		)
		.unique();
	if (!existing) {
		const now = Date.now();
		return await ctx.db.insert("undoRecords", {
			userId,
			sessionId,
			kind: "review",
			snapshotV2: snapshot,
			createdAt: now,
			expiresAt: now + UNDO_WINDOW_MS,
		});
	}

	const previous = existing.snapshotV2 as ProgressUndoSnapshot | undefined;
	if (!previous || previous.type !== "progress") {
		const now = Date.now();
		await ctx.db.patch(existing._id, {
			snapshotV2: snapshot,
			snapshot: undefined,
			createdAt: now,
			expiresAt: now + UNDO_WINDOW_MS,
			usedAt: undefined,
		});
		return existing._id;
	}

	const merged = mergeProgressUndoSnapshots(previous, snapshot);
	await ctx.db.patch(existing._id, {
		snapshotV2: merged,
		snapshot: undefined,
		expiresAt: Date.now() + UNDO_WINDOW_MS,
	});
	return existing._id;
}
