import { ui } from "@/i18n/en";

/**
 * The three promises Akin uses as its worked example — the ones the demo seeds
 * and the ones the landing lets a visitor tap. They live here so the shop
 * window and the shop always show the same product; changing a name or a count
 * in one place changes it in both.
 *
 * The counts are chosen to span the badge tiers: glass, silver, fire.
 */
export const DEMO_PROMISES = [
	{ id: "demo-move", name: ui.demo.streakNames.move, icon: "🏃", days: 6 },
	{ id: "demo-read", name: ui.demo.streakNames.read, icon: "📚", days: 24 },
	{ id: "demo-sleep", name: ui.demo.streakNames.sleep, icon: "🌙", days: 103 },
] as const;

export const DEMO_PROMISE_ICONS = DEMO_PROMISES.map((promise) => promise.icon);
