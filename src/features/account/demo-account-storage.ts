import { MAX_REWARD_STREAKS } from "@convex/lib/app_rules";

export const DEMO_ACCOUNT_STORAGE_KEY = "akin:demo-account:v1";
export const DEMO_STARTING_COINS = 999;
export const DEMO_ACCOUNT_UPDATED_EVENT = "akin:demo-account-updated";

export type DemoAccountState = {
	balance: number;
	lifetimeEarned: number;
	xp: number;
	rewardEligibleStreakIds: string[];
};

export type DemoWalletState = Pick<DemoAccountState, "balance" | "lifetimeEarned" | "xp">;

type StoredDemoAccountState = Partial<DemoAccountState> & {
	coinEligibleStreakIds?: unknown;
};

export function createDemoAccountState(streakIds: string[]): DemoAccountState {
	return {
		balance: DEMO_STARTING_COINS,
		lifetimeEarned: DEMO_STARTING_COINS,
		xp: 0,
		rewardEligibleStreakIds: streakIds.slice(0, MAX_REWARD_STREAKS),
	};
}

function isNonNegativeInteger(value: unknown): value is number {
	return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function parseStoredDemoAccount(serialized: string | null): StoredDemoAccountState | null {
	try {
		if (!serialized) return null;
		const value: unknown = JSON.parse(serialized);
		return value && typeof value === "object" ? value as StoredDemoAccountState : null;
	} catch {
		return null;
	}
}

function readStoredDemoAccount(): StoredDemoAccountState | null {
	try {
		return parseStoredDemoAccount(localStorage.getItem(DEMO_ACCOUNT_STORAGE_KEY));
	} catch {
		return null;
	}
}

function notifyDemoAccountChanged() {
	if (typeof window !== "undefined") window.dispatchEvent(new Event(DEMO_ACCOUNT_UPDATED_EVENT));
}

export function loadDemoAccountState(streakIds: string[]): DemoAccountState {
	const fallback = createDemoAccountState(streakIds);
	const persisted = readStoredDemoAccount();
	if (!persisted) return fallback;

	const storedEligibleIds = persisted.rewardEligibleStreakIds ?? persisted.coinEligibleStreakIds;
	const eligibleStreakIds = Array.isArray(storedEligibleIds) && storedEligibleIds.every((id) => typeof id === "string")
		? storedEligibleIds
		: fallback.rewardEligibleStreakIds;
	const activeIds = new Set(streakIds);
	return {
		balance: isNonNegativeInteger(persisted.balance) ? persisted.balance : fallback.balance,
		lifetimeEarned: isNonNegativeInteger(persisted.lifetimeEarned) ? persisted.lifetimeEarned : fallback.lifetimeEarned,
		xp: isNonNegativeInteger(persisted.xp) ? persisted.xp : fallback.xp,
		rewardEligibleStreakIds: [...new Set(eligibleStreakIds.filter((id) => activeIds.has(id)))].slice(0, MAX_REWARD_STREAKS),
	};
}

export function loadDemoWalletState(snapshot = getDemoAccountSnapshot()): DemoWalletState {
	const persisted = parseStoredDemoAccount(snapshot || null);
	return {
		balance: isNonNegativeInteger(persisted?.balance) ? persisted.balance : DEMO_STARTING_COINS,
		lifetimeEarned: isNonNegativeInteger(persisted?.lifetimeEarned) ? persisted.lifetimeEarned : DEMO_STARTING_COINS,
		xp: isNonNegativeInteger(persisted?.xp) ? persisted.xp : 0,
	};
}

export function spendDemoCoins(amount: number): DemoWalletState | null {
	if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Coin cost must be a non-negative integer");
	const wallet = loadDemoWalletState();
	if (wallet.balance < amount) return null;
	const stored = readStoredDemoAccount() ?? {};
	const nextWallet = { ...wallet, balance: wallet.balance - amount };
	try {
		localStorage.setItem(DEMO_ACCOUNT_STORAGE_KEY, JSON.stringify({ ...stored, ...nextWallet }));
		notifyDemoAccountChanged();
	} catch {
		return null;
	}
	return nextWallet;
}

export function getDemoAccountSnapshot(): string {
	try {
		return localStorage.getItem(DEMO_ACCOUNT_STORAGE_KEY) ?? "";
	} catch {
		return "";
	}
}

export function subscribeDemoAccount(listener: () => void): () => void {
	if (typeof window === "undefined") return () => undefined;
	const handleStorage = (event: StorageEvent) => {
		if (event.key === DEMO_ACCOUNT_STORAGE_KEY) listener();
	};
	window.addEventListener(DEMO_ACCOUNT_UPDATED_EVENT, listener);
	window.addEventListener("storage", handleStorage);
	return () => {
		window.removeEventListener(DEMO_ACCOUNT_UPDATED_EVENT, listener);
		window.removeEventListener("storage", handleStorage);
	};
}

export function saveDemoAccountState(account: DemoAccountState): void {
	try {
		localStorage.setItem(DEMO_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
		notifyDemoAccountChanged();
	} catch {
		// The demo remains usable for this session when storage is unavailable.
	}
}

export function clearDemoAccountStorage(): void {
	try {
		localStorage.removeItem(DEMO_ACCOUNT_STORAGE_KEY);
		notifyDemoAccountChanged();
	} catch {
		// Resetting the in-memory account is enough when storage is unavailable.
	}
}
