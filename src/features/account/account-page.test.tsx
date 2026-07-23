/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountPageView } from "./account-page";

vi.mock("@/features/preferences/app-preferences", () => ({ AppPreferences: () => null }));
vi.mock("@/shared/ui/app-navigation", () => ({
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
		const wallet = screen.getByLabelText("128 coins, 84 XP");
		expect(wallet.className).toContain("walletPills");
	});
});
