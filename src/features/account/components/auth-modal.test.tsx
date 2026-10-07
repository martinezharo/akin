/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthModal } from "./auth-modal";

const mocks = vi.hoisted(() => ({
	signInSocial: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
	authClient: { signIn: { social: mocks.signInSocial } },
}));

beforeEach(() => {
	HTMLDialogElement.prototype.showModal = function showModal() {
		this.open = true;
	};
	HTMLDialogElement.prototype.close = function close() {
		this.open = false;
	};
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("auth modal", () => {
	it("shows a loader and locks the button while GitHub is on its way", async () => {
		const user = userEvent.setup();
		let resolveSignIn!: (value: { error: null }) => void;
		mocks.signInSocial.mockReturnValue(
			new Promise((resolve) => {
				resolveSignIn = resolve;
			}),
		);

		render(<AuthModal onDismiss={() => undefined} />);
		await user.click(screen.getByRole("button", { name: "Continue with GitHub" }));

		const button = screen.getByRole("button", { name: "Heading to GitHub…" });
		expect(button.getAttribute("aria-busy")).toBe("true");
		expect(button.hasAttribute("disabled")).toBe(true);
		expect(screen.getByRole("status").textContent).toBe("Heading to GitHub…");
		expect(mocks.signInSocial).toHaveBeenCalledWith({ provider: "github", callbackURL: "/streaks" });

		resolveSignIn({ error: null });
		await waitFor(() => {
			expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeTruthy();
		});
	});

	it("returns to the idle button when GitHub fails", async () => {
		const user = userEvent.setup();
		mocks.signInSocial.mockResolvedValue({ error: { message: "GitHub said no" } });

		render(<AuthModal onDismiss={() => undefined} />);
		await user.click(screen.getByRole("button", { name: "Continue with GitHub" }));

		await waitFor(() => {
			expect(screen.getByRole("alert").textContent).toBe("GitHub said no");
		});
		const button = screen.getByRole("button", { name: "Continue with GitHub" });
		expect(button.hasAttribute("disabled")).toBe(false);
		expect(button.getAttribute("aria-busy")).toBe("false");
	});
});
