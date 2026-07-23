/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RewardStreakSettings } from "./reward-streak-settings";

vi.mock("@/features/streaks/components/icon-picker/streak-icons", () => ({
	StreakIcon: () => <span aria-hidden="true">◎</span>,
}));

afterEach(cleanup);

describe("reward streak settings", () => {
	it("keeps the shared reward limit at the interaction boundary", async () => {
		const user = userEvent.setup();
		const onToggleRewardEligible = vi.fn();
		const streaks = Array.from({ length: 11 }, (_, index) => ({
			id: `streak-${index + 1}`,
			name: `Streak ${index + 1}`,
			icon: null,
			rewardEligible: index < 10,
		}));

		render(
			<RewardStreakSettings
				streaks={streaks}
				onToggleRewardEligible={onToggleRewardEligible}
			/>,
		);

		await user.click(screen.getByText("Streak 11"));

		expect(screen.getByText("Reward crew full — swap one out first.")).toBeTruthy();
		expect(onToggleRewardEligible).not.toHaveBeenCalled();
	});
});
