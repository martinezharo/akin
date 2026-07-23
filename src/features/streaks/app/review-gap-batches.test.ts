import { describe, expect, it, vi } from "vitest";
import { addLocalDays } from "../model/calendar";
import {
	resolveReviewGapInBatches,
	REVIEW_GAP_BATCH_DAYS,
} from "./review-gap-batches";

describe("remote review gap batches", () => {
	it("resolves more than a year sequentially as one logical review", async () => {
		const days = Array.from(
			{ length: 401 },
			(_, index) => addLocalDays("2025-01-01", index),
		);
		let sequence = 0;
		const resolveBatch = vi.fn(async (batch: string[]) => {
			expect(batch.length).toBeLessThanOrEqual(REVIEW_GAP_BATCH_DAYS);
			return {
				coinsAwarded: sequence++ === 0 ? 3 : 0,
				undoId: `undo-${sequence}`,
			};
		});

		const result = await resolveReviewGapInBatches(days, resolveBatch);

		expect(resolveBatch).toHaveBeenCalledTimes(14);
		expect(resolveBatch.mock.calls.every(([batch]) =>
			batch.length <= REVIEW_GAP_BATCH_DAYS,
		)).toBe(true);
		expect(resolveBatch.mock.calls.flatMap(([batch]) => batch)).toEqual(days);
		expect(result).toEqual({ coinsAwarded: 3, finalUndoId: "undo-14" });
	});
});
