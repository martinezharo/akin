/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccountRewardsBalance } from "./account-rewards-balance";

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
});
