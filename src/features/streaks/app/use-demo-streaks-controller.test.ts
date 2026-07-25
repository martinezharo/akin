/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useDemoWallet } from "@/features/account/demo/use-demo-account";
import { addLocalDays, type LocalDateKey } from "../model/calendar";
import type { StreaksData } from "../persistence/storage";
import { useDemoStreaksController } from "./use-demo-streaks-controller";
import { useStreaksController } from "./use-streaks-controller";

const today: LocalDateKey = "2026-07-19";

function createData(lastReviewedOn = addLocalDays(today, -1)): StreaksData {
	return {
		checkIns: [],
		streaks: [
			{ id: "read", name: "Read", icon: "📚", days: 24, createdOn: "2026-06-01" },
			{ id: "move", name: "Move", icon: "🏃", days: 6, createdOn: "2026-06-01" },
		],
		recentIcons: ["📚", "🏃"],
		lastReviewedOn,
	};
}

function renderDemo(data = createData()) {
	return renderHook(() => {
		const base = useStreaksController({
			today,
			storageKey: "akin:test-demo-streaks",
			createFallbackData: () => data,
		});
		// Other demo surfaces (friends, pet) read the wallet through this hook.
		return { ...useDemoStreaksController(base), sharedWallet: useDemoWallet() };
	});
}

beforeEach(() => {
	localStorage.clear();
});

describe("demo account", () => {
	it("starts with a fictional user and 999 spendable coins", () => {
		const { result } = renderDemo();

		expect(result.current.dashboard.user.email).toBe("mika@demo.akin");
		expect(result.current.dashboard.user.username).toBe("demo");
		expect(result.current.dashboard.wallet).toEqual({
			balance: 999,
			lifetimeEarned: 999,
			xp: 0,
		});
		expect(result.current.dashboard.streaks.every((streak) => streak.rewardEligible)).toBe(true);
	});

	it("awards a coin for today and restores the wallet on undo", () => {
		const { result } = renderDemo();

		act(() => result.current.controller.completeToday("read"));
		expect(result.current.dashboard.wallet.balance).toBe(1_000);
		expect(result.current.dashboard.wallet.xp).toBe(1);

		act(() => result.current.controller.undo());
		expect(result.current.dashboard.wallet.balance).toBe(999);
		expect(result.current.dashboard.wallet.xp).toBe(0);
		expect(result.current.controller.completedTodayStreakIds).not.toContain("read");
	});

	it("lets a new streak be completed without awarding a same-day coin", () => {
		const { result } = renderDemo();
		let streakId = "";

		act(() => {
			streakId = result.current.controller.create("Fresh streak", "✨");
		});
		act(() => result.current.controller.completeToday(streakId));

		expect(result.current.controller.completedTodayStreakIds).toContain(streakId);
		expect(result.current.dashboard.wallet.balance).toBe(999);
		expect(result.current.dashboard.wallet.xp).toBe(0);
	});

	it("shares one wallet with every other demo surface", () => {
		const { result } = renderDemo();

		act(() => result.current.controller.completeToday("read"));

		expect(result.current.sharedWallet).toEqual(result.current.dashboard.wallet);
		expect(result.current.sharedWallet.balance).toBe(1_000);
	});

	it("caps a long-gap reward at three coins per eligible streak", () => {
		const data = createData(addLocalDays(today, -5));
		const { result } = renderDemo(data);
		const days = result.current.controller.unreviewedDays;

		expect(days).toHaveLength(4);
		act(() => result.current.controller.resolveGap(days, { read: true, move: true }));

		expect(result.current.dashboard.wallet.balance).toBe(1_005);
		expect(result.current.dashboard.wallet.xp).toBe(6);
	});
});
