import { chunkLocalDates, type LocalDateKey } from "../model/calendar";

export const REVIEW_GAP_BATCH_DAYS = 30;

export async function resolveReviewGapInBatches<TUndoId>(
	days: readonly LocalDateKey[],
	resolveBatch: (
		batch: LocalDateKey[],
	) => Promise<{ coinsAwarded: number; undoId: TUndoId }>,
) {
	let coinsAwarded = 0;
	let finalUndoId: TUndoId | null = null;
	for (const batch of chunkLocalDates(days, REVIEW_GAP_BATCH_DAYS)) {
		const result = await resolveBatch(batch);
		coinsAwarded += result.coinsAwarded;
		finalUndoId = result.undoId;
	}
	return { coinsAwarded, finalUndoId };
}
