import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { undoSnapshotV2Validator } from "./lib/undo_schema";

export default defineSchema({
	profiles: defineTable({
		userId: v.string(),
		displayName: v.string(),
		email: v.string(),
		petSkin: v.optional(v.string()),
		petHair: v.optional(v.string()),
		ownedPetSkins: v.optional(v.array(v.string())),
		timeZone: v.optional(v.string()),
		lastReviewedOn: v.string(),
		recentIcons: v.array(v.string()),
		importedLocalDataAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	streaks: defineTable({
		userId: v.string(),
		clientId: v.string(),
		name: v.string(),
		icon: v.string(),
		days: v.number(),
		createdOn: v.string(),
		// Keep the legacy field optional while existing documents adopt the
		// generic reward-streak vocabulary.
		coinEligible: v.optional(v.boolean()),
		rewardEligible: v.optional(v.boolean()),
		sortOrder: v.number(),
		deletedAt: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_client", ["userId", "clientId"]),

	checkIns: defineTable({
		userId: v.string(),
		streakId: v.id("streaks"),
		localDate: v.string(),
		completedAt: v.number(),
		source: v.union(v.literal("today"), v.literal("review"), v.literal("import")),
	})
		.index("by_user", ["userId"])
		.index("by_user_date", ["userId", "localDate"])
		.index("by_user_streak_date", ["userId", "streakId", "localDate"]),

	wallets: defineTable({
		userId: v.string(),
		balance: v.number(),
		lifetimeEarned: v.number(),
		xp: v.optional(v.number()),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	coinLedger: defineTable({
		userId: v.string(),
		checkInId: v.id("checkIns"),
		streakId: v.id("streaks"),
		localDate: v.string(),
		amount: v.number(),
		reason: v.literal("streak_completion"),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_check_in", ["checkInId"]),

	undoRecords: defineTable({
		userId: v.string(),
		sessionId: v.optional(v.string()),
		kind: v.union(v.literal("today"), v.literal("review"), v.literal("delete")),
		// Deprecated after V2. Keep it optional until every pre-deploy undo record
		// has expired; new records are always validated through snapshotV2.
		snapshot: v.optional(v.any()),
		snapshotV2: v.optional(undoSnapshotV2Validator),
		createdAt: v.number(),
		expiresAt: v.number(),
		usedAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_user_session", ["userId", "sessionId"]),
});
