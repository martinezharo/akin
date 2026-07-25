/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountPageView } from "./account-page-view";

vi.mock("@/features/preferences/app-preferences", () => ({ AppPreferences: () => null }));
vi.mock("@/features/navigation/app-navigation", () => ({
	AppNavigation: () => <nav aria-label="App navigation" />,
}));

afterEach(cleanup);

describe("account page", () => {
	it("uses the shared header for identity, coins, and XP", () => {
		render(
			<AccountPageView
				dashboard={{
					user: {
						id: "user-1",
						name: "Akin Friend",
						email: "friend@example.com",
						username: "akin_friend",
					},
					wallet: { balance: 128, lifetimeEarned: 240, xp: 84 },
					streaks: [],
				}}
				onToggleRewardEligible={vi.fn()}
				footer={<span>Account footer</span>}
			/>,
		);

		expect(screen.getByLabelText("Signed in as @akin_friend")).toBeTruthy();
		expect(screen.getByRole("heading", { level: 1, name: "@akin_friend" })).toBeTruthy();
		expect(screen.queryByText("Akin Friend")).toBeNull();
		expect(screen.queryByText("friend@example.com")).toBeNull();
		const wallet = screen.getByLabelText("128 coins, 84 XP");
		expect(wallet.className).toContain("walletPills");
	});
});
