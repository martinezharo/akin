import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export const UNDO_WINDOW_MS = 30_000;

export type ProgressUndoSnapshot = {
	type: "progress";
	streakDays: Array<{ streakId: Id<"streaks">; days: number }>;
	checkInIds: Array<Id<"checkIns">>;
	ledgerIds: Array<Id<"coinLedger">>;
	wallet: { walletId: Id<"wallets">; balance: number; lifetimeEarned: number; xp: number };
	profile?: { profileId: Id<"profiles">; lastReviewedOn: string };
};

export type DeleteUndoSnapshot = {
	type: "delete";
	streakId: Id<"streaks">;
};

export type UndoSnapshot = ProgressUndoSnapshot | DeleteUndoSnapshot;

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
		snapshot,
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
			snapshot,
			createdAt: now,
			expiresAt: now + UNDO_WINDOW_MS,
		});
	}

	const previous = existing.snapshot as ProgressUndoSnapshot;
	const recordedStreaks = new Set(previous.streakDays.map((item) => item.streakId));
	const merged: ProgressUndoSnapshot = {
		...previous,
		streakDays: [
			...previous.streakDays,
			...snapshot.streakDays.filter((item) => !recordedStreaks.has(item.streakId)),
		],
		checkInIds: [...previous.checkInIds, ...snapshot.checkInIds],
		ledgerIds: [...previous.ledgerIds, ...snapshot.ledgerIds],
	};
	await ctx.db.patch(existing._id, {
		snapshot: merged,
		expiresAt: Date.now() + UNDO_WINDOW_MS,
	});
	return existing._id;
}
