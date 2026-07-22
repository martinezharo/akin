/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDemoAccountState,
	DEMO_ACCOUNT_UPDATED_EVENT,
	loadDemoAccountState,
	loadDemoWalletState,
	saveDemoAccountState,
	spendDemoCoins,
} from "./demo-account-storage";

beforeEach(() => localStorage.clear());

describe("demo wallet storage", () => {
	it("uses the same 999-coin wallet on direct pet visits", () => {
		expect(loadDemoWalletState()).toEqual({ balance: 999, lifetimeEarned: 999, xp: 0 });
	});

	it("spends coins without changing XP or purchased lifetime totals", () => {
		const account = { ...createDemoAccountState(["read"]), xp: 7 };
		saveDemoAccountState(account);

		expect(spendDemoCoins(35)).toEqual({ balance: 964, lifetimeEarned: 999, xp: 7 });
		expect(loadDemoAccountState(["read"]).rewardEligibleStreakIds).toEqual(["read"]);
	});

	it("preserves default reward streaks when the pet creates the wallet first", () => {
		expect(spendDemoCoins(55)?.balance).toBe(944);
		expect(loadDemoAccountState(["read", "move"])).toMatchObject({
			balance: 944,
			rewardEligibleStreakIds: ["read", "move"],
		});
	});

	it("does not mutate the wallet when funds are insufficient", () => {
		expect(spendDemoCoins(1_000)).toBeNull();
		expect(loadDemoWalletState().balance).toBe(999);
	});

	it("notifies mounted headers when the balance changes", () => {
		const listener = vi.fn();
		window.addEventListener(DEMO_ACCOUNT_UPDATED_EVENT, listener);
		spendDemoCoins(35);
		expect(listener).toHaveBeenCalledOnce();
		window.removeEventListener(DEMO_ACCOUNT_UPDATED_EVENT, listener);
	});
});
