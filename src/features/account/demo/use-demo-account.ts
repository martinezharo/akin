"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { Streak } from "@/features/streaks/model/streak";
import type { AccountDashboardView } from "../model/account-types";
import {
	createDemoAccountState,
	type DemoAccountState,
	type DemoWalletState,
	getDemoAccountSnapshot,
	loadDemoAccountState,
	loadDemoWalletState,
	saveDemoAccountState,
	subscribeDemoAccount,
} from "./demo-account-storage";

export const DEMO_USER = {
	id: "demo-user",
	name: "Mika Daydream",
	email: "mika@demo.akin",
	username: "demo",
};

const ID_SEPARATOR = "\u0000";

/**
 * Every demo surface — streaks, account, friends, pet — reads the wallet from
 * this one store, so a coin earned on the home page is already spent-able on
 * the pet page without any page owning a private copy of the account.
 */
function useDemoAccountSnapshot(): string {
	return useSyncExternalStore(subscribeDemoAccount, getDemoAccountSnapshot, () => "");
}

export function useDemoWallet(): DemoWalletState {
	const snapshot = useDemoAccountSnapshot();
	return useMemo(() => loadDemoWalletState(snapshot), [snapshot]);
}

export function useDemoAccount(streakIds: readonly string[]) {
	const snapshot = useDemoAccountSnapshot();
	// Streak ids arrive as a fresh array every render; join them so the derived
	// account only recomputes when the ids themselves change.
	const idKey = streakIds.join(ID_SEPARATOR);
	const ids = useMemo(() => (idKey ? idKey.split(ID_SEPARATOR) : []), [idKey]);
	const account = useMemo(() => loadDemoAccountState(ids, snapshot), [ids, snapshot]);

	const update = useCallback(
		(updater: (current: DemoAccountState) => DemoAccountState) => {
			// Read back from storage so concurrent updates from other surfaces
			// (a pet purchase, another tab) are never overwritten.
			saveDemoAccountState(updater(loadDemoAccountState(ids)));
		},
		[ids],
	);

	const reset = useCallback((nextStreakIds: readonly string[]) => {
		saveDemoAccountState(createDemoAccountState(nextStreakIds));
	}, []);

	return { account, update, reset };
}

export function toDemoDashboard(
	streaks: Streak[],
	account: DemoAccountState,
): AccountDashboardView {
	return {
		user: DEMO_USER,
		wallet: { balance: account.balance, lifetimeEarned: account.lifetimeEarned, xp: account.xp },
		streaks: streaks.map((streak) => ({
			...streak,
			rewardEligible: account.rewardEligibleStreakIds.includes(streak.id),
		})),
	};
}
