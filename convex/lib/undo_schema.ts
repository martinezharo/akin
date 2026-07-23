import { v } from "convex/values";

const streakProgress = v.object({
	streakId: v.id("streaks"),
	daysBefore: v.number(),
	daysAfter: v.number(),
});

export const undoSnapshotV2Validator = v.union(
	v.object({
		version: v.literal(2),
		type: v.literal("progress"),
		streaks: v.array(streakProgress),
		checkInIds: v.array(v.id("checkIns")),
		ledgerIds: v.array(v.id("coinLedger")),
		profile: v.optional(v.object({
			profileId: v.id("profiles"),
			lastReviewedOnBefore: v.string(),
			lastReviewedOnAfter: v.string(),
		})),
	}),
	v.object({
		version: v.literal(2),
		type: v.literal("delete"),
		streakId: v.id("streaks"),
		deletedAt: v.number(),
	}),
);
