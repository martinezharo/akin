import { describe, expect, it } from "vitest";
import type { StreaksData } from "../persistence/storage";
import { resolveGap, resolveSingleDay } from "./progress";

const data: StreaksData = {
	lastReviewedOn: "2026-07-12",
	recentIcons: [],
	streaks: [
		{ id: "read", name: "Read", icon: "📚", days: 4, createdOn: "2026-07-01" },
		{ id: "walk", name: "Walk", icon: "🚶", days: 2, createdOn: "2026-07-14" },
	],
};

describe("streak progress", () => {
	it("increments completed streaks and resets missed streaks", () => {
		const resolved = resolveSingleDay(data, "2026-07-13", {
			read: true,
			walk: false,
		});

		expect(resolved.lastReviewedOn).toBe("2026-07-13");
		expect(resolved.streaks[0]?.days).toBe(5);
		expect(resolved.streaks[1]?.days).toBe(2);
	});

	it("counts only gap days for which a streak existed", () => {
		const resolved = resolveGap(
			data,
			["2026-07-13", "2026-07-14", "2026-07-15"],
			{ read: true, walk: true },
		);

		expect(resolved.lastReviewedOn).toBe("2026-07-15");
		expect(resolved.streaks[0]?.days).toBe(7);
		expect(resolved.streaks[1]?.days).toBe(4);
	});

	it("does not mutate the previous state", () => {
		const resolved = resolveSingleDay(data, "2026-07-13", { read: false });

		expect(resolved).not.toBe(data);
		expect(resolved.streaks[0]).not.toBe(data.streaks[0]);
		expect(data.streaks[0]?.days).toBe(4);
	});
});
