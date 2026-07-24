/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UsernameSetupModal } from "./username-setup-modal";

const mocks = vi.hoisted(() => ({
	setUsername: vi.fn(),
}));

vi.mock("convex/react", () => ({
	useMutation: () => mocks.setUsername,
	useQuery: () => undefined,
}));

beforeEach(() => {
	HTMLDialogElement.prototype.showModal = function showModal() {
		this.open = true;
	};
	HTMLDialogElement.prototype.close = function close() {
		this.open = false;
	};
	mocks.setUsername.mockResolvedValue({ username: "akin_friend" });
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("username setup", () => {
	it("explains an empty username instead of showing a generic error", async () => {
		const user = userEvent.setup();
		render(<UsernameSetupModal />);

		await user.click(screen.getByRole("button", { name: "Make it mine" }));

		expect(screen.getByRole("alert").textContent).toContain("Give yourself a username to continue.");
		expect(screen.getByRole("textbox").getAttribute("aria-invalid")).toBe("true");
		expect(mocks.setUsername).not.toHaveBeenCalled();
	});

	it("translates a taken username into a helpful next step", async () => {
		const user = userEvent.setup();
		mocks.setUsername.mockRejectedValueOnce(new Error("USERNAME_TAKEN"));
		render(<UsernameSetupModal />);

		await user.type(screen.getByRole("textbox"), "akin_friend");
		await user.click(screen.getByRole("button", { name: "Make it mine" }));

		await waitFor(() => {
			expect(screen.getByRole("alert").textContent).toContain(
				"That one is already taken. Try adding a number or underscore.",
			);
		});
		expect(screen.getByRole("alert").textContent).not.toContain("USERNAME_TAKEN");
	});
});
