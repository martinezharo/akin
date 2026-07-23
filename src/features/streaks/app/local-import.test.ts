import { describe, expect, it, vi } from "vitest";
import { importLocalDataInBatches } from "./local-import";
import type { LocalDateKey } from "../model/calendar";

describe("local account import", () => {
	it("retries idempotent check-in batches and finishes only after all succeed", async () => {
		const events: string[] = [];
		let secondBatchAttempts = 0;
		const prepare = vi.fn(async () => {
			events.push("prepare");
			return { ready: true };
		});
		const importCheckIns = vi.fn(async ({ checkIns }: { checkIns: Array<{ streakId: string }> }) => {
			const batch = checkIns[0]?.streakId ?? "empty";
			events.push(`batch:${batch}`);
			if (batch === "streak-50" && secondBatchAttempts++ === 0) {
				throw new Error("temporary network failure");
			}
		});
		const finish = vi.fn(async () => {
			events.push("finish");
		});
		const checkIns = Array.from({ length: 121 }, (_, index) => ({
			streakId: `streak-${index}`,
			completedOn: "2026-07-20" as LocalDateKey,
		}));

		const result = await importLocalDataInBatches({
			data: {
				lastReviewedOn: "2026-07-22",
				recentIcons: [],
				streaks: [],
				checkIns,
			},
			today: "2026-07-23",
			timeZone: "Europe/Madrid",
			operations: { prepare, importCheckIns, finish },
		});

		expect(result).toEqual({ imported: true });
		expect(importCheckIns).toHaveBeenCalledTimes(4);
		expect(importCheckIns.mock.calls.map(([args]) => args.checkIns.length)).toEqual([
			50,
			50,
			50,
			21,
		]);
		expect(events.at(-1)).toBe("finish");
	});
});
