import { ui } from "@/i18n";

/**
 * The three promises Akin uses as its worked example — the ones the demo seeds
 * and the ones the landing lets a visitor tap. They live here so the shop
 * window and the shop always show the same product; changing a name or a count
 * in one place changes it in both.
 *
 * The counts are chosen to span the badge tiers: glass, silver, fire.
 */
const DEMO_PROMISE_SEEDS = [
	{ id: "demo-move", nameKey: "move", icon: "🏃", days: 6 },
	{ id: "demo-read", nameKey: "read", icon: "📚", days: 24 },
	{ id: "demo-sleep", nameKey: "sleep", icon: "🌙", days: 103 },
] as const;

export const DEMO_PROMISE_ICONS = DEMO_PROMISE_SEEDS.map((promise) => promise.icon);
export const DEMO_PROMISE_COUNT = DEMO_PROMISE_SEEDS.length;

/** Call while rendering or seeding: the names resolve in the active language. */
export function demoPromises() {
	return DEMO_PROMISE_SEEDS.map(({ nameKey, ...promise }) => ({
		...promise,
		name: ui.demo.streakNames[nameKey],
	}));
}
