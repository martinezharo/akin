import { cronJobs } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

/**
 * Undo records are write-once and read at most once, inside a 30 second window.
 * Nothing in the request path deletes them, so without this sweep the table
 * grows by one document per check-in forever.
 */
export const PURGE_BATCH_SIZE = 200;

export const purgeExpiredUndoRecords = internalMutation({
	args: { cursor: v.optional(v.number()) },
	handler: async (ctx, args) => {
		const expiredBefore = args.cursor ?? Date.now();
		const expired = await ctx.db
			.query("undoRecords")
			.withIndex("by_expires_at", (query) => query.lt("expiresAt", expiredBefore))
			.take(PURGE_BATCH_SIZE);

		for (const record of expired) await ctx.db.delete(record._id);

		// A backlog can exceed one transaction's write budget, so continue in a
		// fresh transaction rather than letting the sweep fail as a whole.
		if (expired.length === PURGE_BATCH_SIZE) {
			await ctx.scheduler.runAfter(0, internal.crons.purgeExpiredUndoRecords, {
				cursor: expiredBefore,
			});
		}
		return { deleted: expired.length };
	},
});

const crons = cronJobs();

crons.interval(
	"purge expired undo records",
	{ hours: 1 },
	internal.crons.purgeExpiredUndoRecords,
	{},
);

export default crons;
