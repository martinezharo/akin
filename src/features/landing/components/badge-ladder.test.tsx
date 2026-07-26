/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { getStreakBadgeTier, STREAK_BADGE_TIERS } from "@/features/streaks/components/badge/streak-badge";
import { ui } from "@/i18n";
import { BadgeLadder } from "./badge-ladder";

afterEach(cleanup);

describe("BadgeLadder", () => {
	it("shows every tier at the count that actually unlocks it", () => {
		render(<BadgeLadder />);

		expect(screen.getAllByRole("listitem")).toHaveLength(STREAK_BADGE_TIERS.length);

		for (const { tier, minDays } of STREAK_BADGE_TIERS) {
			const copy = ui.landing.ladder.tiers[tier];
			const badge = screen.getByLabelText(ui.landing.ladder.tierLabel(copy.name, minDays));

			expect(badge.dataset.tier).toBe(tier);
			expect(screen.getByText(copy.name)).not.toBeNull();
		}
	});

	// The whole point of reading the thresholds from the badge: a rung can never
	// advertise a material the badge would not actually award at that count.
	it("keeps each advertised count on the right side of its threshold", () => {
		for (const { tier, minDays } of STREAK_BADGE_TIERS) {
			expect(getStreakBadgeTier(minDays)).toBe(tier);
			if (minDays > 1) expect(getStreakBadgeTier(minDays - 1)).not.toBe(tier);
		}
	});
});
