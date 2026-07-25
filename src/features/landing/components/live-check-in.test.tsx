/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ui } from "@/i18n/en";
import { DEMO_PROMISES } from "@/features/streaks/model/demo-promises";
import { LiveCheckIn } from "./live-check-in";

afterEach(cleanup);

describe("LiveCheckIn", () => {
	it("lets a visitor keep a promise before they have an account", async () => {
		const user = userEvent.setup();
		const [promise] = DEMO_PROMISES;

		render(<LiveCheckIn />);

		const badge = screen.getByRole("button", {
			name: `Complete ${promise.name} for today. Current streak: ${promise.days}`,
		});
		expect(badge.getAttribute("aria-pressed")).toBe("false");

		await user.click(badge);

		// Keeping it advances the count the way the app does, and the badge locks.
		const kept = screen.getByRole("button", {
			name: `${promise.name} completed today. Current streak: ${promise.days + 1}`,
		});
		expect(kept.getAttribute("aria-pressed")).toBe("true");
		expect((kept as HTMLButtonElement).disabled).toBe(true);
		expect(kept.textContent).toContain(String(promise.days + 1));
	});

	it("pays a coin per promise and closes the loop on the last one", async () => {
		const user = userEvent.setup();

		render(<LiveCheckIn />);

		const wallet = screen.getByLabelText("Coins earned right here");
		expect(wallet.textContent).toBe("0");
		expect(screen.getByText(ui.landing.checkIn.prompt)).not.toBeNull();

		for (const [index, promise] of DEMO_PROMISES.entries()) {
			await user.click(
				screen.getByRole("button", {
					name: `Complete ${promise.name} for today. Current streak: ${promise.days}`,
				}),
			);

			// The tally counts down for real rather than repeating one fixed line.
			const left = DEMO_PROMISES.length - index - 1;
			if (left > 0) expect(screen.getByText(ui.landing.checkIn.midway(left))).not.toBeNull();
		}

		expect(wallet.textContent).toBe(String(DEMO_PROMISES.length));
		expect(screen.getByText(ui.landing.checkIn.done)).not.toBeNull();
	});
});
