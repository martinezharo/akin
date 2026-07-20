/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoAccountDock } from "./account-dock";

vi.mock("@/shared/ui/modal-dialog", () => ({
	ModalDialog: ({ children }: { children: React.ReactNode }) => <div role="dialog">{children}</div>,
}));

afterEach(cleanup);

describe("coin streak settings", () => {
	it("shows the generic streak icon when a streak has no emoji", async () => {
		const user = userEvent.setup();
		const { container } = render(
			<DemoAccountDock
				dashboard={{
					user: { id: "user-1", name: "Ada", email: "ada@example.com" },
					wallet: { balance: 12, lifetimeEarned: 12 },
					streaks: [{ id: "streak-1", name: "Read", icon: null, coinEligible: true }],
				}}
				onToggleCoinEligible={vi.fn()}
				onResetWallet={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Open account and coin settings" }));

		expect(screen.getByText("Read")).toBeTruthy();
		expect(container.querySelector("svg.lucide-goal")).toBeTruthy();
	});
});
