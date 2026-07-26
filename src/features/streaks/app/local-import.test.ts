import { describe, expect, it, vi } from "vitest";
import { importLocalDataInBatches } from "./local-import";
import type { LocalDateKey } from "../model/calendar";

const noWait = async () => undefined;

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
			resolveToday: () => "2026-07-23",
			timeZone: "Europe/Madrid",
			operations: { prepare, importCheckIns, finish },
			wait: noWait,
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

	it("re-dates every attempt so a midnight rollover does not strand the import", async () => {
		// The clock crosses midnight while the batch is in flight, so the server
		// rejects a call dated to the day that just ended.
		const serverDay: LocalDateKey = "2026-07-24";
		let today: LocalDateKey = "2026-07-23";
		const prepare = vi.fn(async () => ({ ready: true }));
		const importCheckIns = vi.fn(async ({ today: day }: { today: LocalDateKey }) => {
			if (day !== serverDay) throw new Error("DATE_MISMATCH");
		});
		const finish = vi.fn(async () => undefined);

		const result = await importLocalDataInBatches({
			data: {
				lastReviewedOn: "2026-07-22",
				recentIcons: [],
				streaks: [],
				checkIns: [{ streakId: "streak-1", completedOn: "2026-07-22" }],
			},
			resolveToday: () => today,
			timeZone: "Europe/Madrid",
			operations: { prepare, importCheckIns, finish },
			wait: async () => {
				today = "2026-07-24";
			},
		});

		expect(result).toEqual({ imported: true });
		expect(importCheckIns).toHaveBeenCalledTimes(2);
		expect(importCheckIns.mock.calls.map(([args]) => args.today)).toEqual([
			"2026-07-23",
			"2026-07-24",
		]);
		expect(finish).toHaveBeenCalledWith(expect.objectContaining({ today: "2026-07-24" }));
	});

	it("stops before touching check-ins when the account was already imported", async () => {
		const prepare = vi.fn(async () => ({ ready: false }));
		const importCheckIns = vi.fn(async () => undefined);
		const finish = vi.fn(async () => undefined);

		const result = await importLocalDataInBatches({
			data: {
				lastReviewedOn: "2026-07-22",
				recentIcons: [],
				streaks: [],
				checkIns: [{ streakId: "streak-1", completedOn: "2026-07-22" }],
			},
			resolveToday: () => "2026-07-23",
			timeZone: "Europe/Madrid",
			operations: { prepare, importCheckIns, finish },
			wait: noWait,
		});

		expect(result).toEqual({ imported: false });
		expect(importCheckIns).not.toHaveBeenCalled();
		expect(finish).not.toHaveBeenCalled();
	});

	it("gives up after exhausting the retries instead of finishing a partial import", async () => {
		const prepare = vi.fn(async () => ({ ready: true }));
		const importCheckIns = vi.fn(async () => {
			throw new Error("offline");
		});
		const finish = vi.fn(async () => undefined);

		await expect(
			importLocalDataInBatches({
				data: {
					lastReviewedOn: "2026-07-22",
					recentIcons: [],
					streaks: [],
					checkIns: [{ streakId: "streak-1", completedOn: "2026-07-22" }],
				},
				resolveToday: () => "2026-07-23",
				timeZone: "Europe/Madrid",
				operations: { prepare, importCheckIns, finish },
				wait: noWait,
			}),
		).rejects.toThrow("offline");
		expect(importCheckIns).toHaveBeenCalledTimes(3);
		expect(finish).not.toHaveBeenCalled();
	});
});
