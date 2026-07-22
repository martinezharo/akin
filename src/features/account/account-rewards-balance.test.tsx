/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountRewardsBalance, GuestRewardsBalance } from "./account-rewards-balance";

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

describe("AccountRewardsBalance", () => {
	it("renders equal coin and XP values without duplicate-key warnings", () => {
		const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

		render(<AccountRewardsBalance balance={0} xp={0} />);

		expect(screen.getByLabelText("0 coins, 0 XP")).toBeTruthy();
		expect(consoleError).not.toHaveBeenCalled();
	});

	it("keeps guest reward values private and requests sign-in from both pills", async () => {
		const user = userEvent.setup();
		const onRequestAccess = vi.fn();

		render(<GuestRewardsBalance onRequestAccess={onRequestAccess} />);

		expect(screen.getByLabelText("Account rewards, sign in to reveal")).toBeTruthy();
		expect(screen.getByText("128").getAttribute("aria-hidden")).toBe("true");
		await user.click(screen.getByRole("button", { name: "Sign in to reveal your coins" }));
		await user.click(screen.getByRole("button", { name: "Sign in to reveal your XP" }));
		expect(onRequestAccess).toHaveBeenCalledTimes(2);
	});
});
