export const DEMO_ACCOUNT_STORAGE_KEY = "akin:demo-account:v1";
export const DEMO_STARTING_COINS = 999;

export type DemoAccountState = {
	balance: number;
	lifetimeEarned: number;
	coinEligibleStreakIds: string[];
};

export function createDemoAccountState(streakIds: string[]): DemoAccountState {
	return {
		balance: DEMO_STARTING_COINS,
		lifetimeEarned: DEMO_STARTING_COINS,
		coinEligibleStreakIds: streakIds.slice(0, 10),
	};
}

function isDemoAccountState(value: unknown): value is DemoAccountState {
	if (!value || typeof value !== "object") return false;

	const account = value as Partial<DemoAccountState>;
	return (
		typeof account.balance === "number" &&
		Number.isSafeInteger(account.balance) &&
		account.balance >= 0 &&
		typeof account.lifetimeEarned === "number" &&
		Number.isSafeInteger(account.lifetimeEarned) &&
		account.lifetimeEarned >= 0 &&
		Array.isArray(account.coinEligibleStreakIds) &&
		account.coinEligibleStreakIds.every((id) => typeof id === "string")
	);
}

export function loadDemoAccountState(streakIds: string[]): DemoAccountState {
	const fallback = createDemoAccountState(streakIds);
	try {
		const serialized = localStorage.getItem(DEMO_ACCOUNT_STORAGE_KEY);
		if (!serialized) return fallback;
		const account: unknown = JSON.parse(serialized);
		if (!isDemoAccountState(account)) return fallback;

		const activeIds = new Set(streakIds);
		return {
			...account,
			coinEligibleStreakIds: [
				...new Set(account.coinEligibleStreakIds.filter((id) => activeIds.has(id))),
			].slice(0, 10),
		};
	} catch {
		return fallback;
	}
}

export function saveDemoAccountState(account: DemoAccountState): void {
	try {
		localStorage.setItem(DEMO_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
	} catch {
		// The demo remains usable for this session when storage is unavailable.
	}
}

export function clearDemoAccountStorage(): void {
	try {
		localStorage.removeItem(DEMO_ACCOUNT_STORAGE_KEY);
	} catch {
		// Resetting the in-memory account is enough when storage is unavailable.
	}
}
