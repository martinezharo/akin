/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoAccountDock } from "./account-dock";

vi.mock("@/shared/ui/modal-dialog", () => ({
	ModalDialog: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
}));

afterEach(cleanup);

describe("reward streak settings", () => {
	it("shows the generic streak icon when a streak has no emoji", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<DemoAccountDock
				dashboard={{
					user: { id: "user-1", name: "Ada", email: "ada@example.com" },
					wallet: { balance: 12, lifetimeEarned: 12, xp: 4 },
					streaks: [{ id: "streak-1", name: "Read", icon: null, rewardEligible: true }],
				}}
				onToggleRewardEligible={vi.fn()}
				onResetWallet={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Open account and reward settings" }));

		expect(screen.getByText("Read")).toBeTruthy();
		expect(container.querySelector("svg.lucide-goal")).toBeTruthy();
	});

	it("shows a ten-streak preview and expands the remaining choices on request", async () => {
		const user = userEvent.setup();
		const streaks = Array.from({ length: 12 }, (_, index) => ({
			id: `streak-${index + 1}`,
			name: `Streak ${index + 1}`,
			icon: "🎯",
			rewardEligible: false,
		}));
		render(
			<DemoAccountDock
				dashboard={{
					user: { id: "user-1", name: "Ada", email: "ada@example.com" },
					wallet: { balance: 12, lifetimeEarned: 12, xp: 4 },
					streaks,
				}}
				onToggleRewardEligible={vi.fn()}
				onResetWallet={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Open account and reward settings" }));

		expect(screen.getByText("Streak 10")).toBeTruthy();
		expect(screen.queryByText("Streak 11")).toBeNull();

		await user.click(screen.getByRole("button", { name: "Show all 12 streaks" }));

		expect(screen.getByText("Streak 12")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Show less" }).getAttribute("aria-expanded")).toBe("true");
	});

	it("explains why an eleventh reward streak cannot be enabled", async () => {
		const user = userEvent.setup();
		const onToggleRewardEligible = vi.fn();
		const streaks = Array.from({ length: 11 }, (_, index) => ({
			id: `streak-${index + 1}`,
			name: `Streak ${index + 1}`,
			icon: "🎯",
			rewardEligible: index < 10,
		}));
		render(
			<DemoAccountDock
				dashboard={{
					user: { id: "user-1", name: "Ada", email: "ada@example.com" },
					wallet: { balance: 12, lifetimeEarned: 12, xp: 4 },
					streaks,
				}}
				onToggleRewardEligible={onToggleRewardEligible}
				onResetWallet={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Open account and reward settings" }));
		await user.click(screen.getByRole("button", { name: "Show all 11 streaks" }));
		await user.click(screen.getByText("Streak 11"));

		expect(screen.getByText("Reward crew full — swap one out first.")).toBeTruthy();
		expect(onToggleRewardEligible).not.toHaveBeenCalled();
	});
});
