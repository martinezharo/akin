/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreferences } from "./app-preferences";

beforeEach(() => {
	window.localStorage.clear();
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn().mockReturnValue({
			matches: false,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		}),
	});
	HTMLDialogElement.prototype.showModal = function showModal() {
		this.open = true;
	};
	HTMLDialogElement.prototype.close = function close() {
		this.open = false;
	};
});

afterEach(() => {
	cleanup();
	document.documentElement.removeAttribute("data-theme");
});

describe("AppPreferences", () => {
	it("saves and applies the selected theme and language", async () => {
		const user = userEvent.setup();
		render(<AppPreferences />);

		await user.click(screen.getByRole("button", { name: /open preferences/i }));
		await user.click(screen.getByRole("button", { name: "Dark" }));
		await user.click(screen.getByRole("button", { name: /language english/i }));
		expect(screen.getByText(/more languages on the way/i)).toBeTruthy();
		await user.click(screen.getByRole("menuitemradio", { name: /english/i }));

		expect(document.documentElement.dataset.theme).toBe("dark");
		expect(JSON.parse(window.localStorage.getItem("akin.preferences.v1") ?? "null")).toEqual({
			theme: "dark",
			language: "en",
		});
	});

	it("keeps install available when the browser has no direct prompt", async () => {
		const user = userEvent.setup();
		render(<AppPreferences />);

		await user.click(screen.getByRole("button", { name: /open preferences/i }));
		await user.click(screen.getByRole("button", { name: /install akin/i }));

		expect(screen.getByRole("heading", { name: /install from your browser/i })).toBeTruthy();
		expect(screen.getByText(/choose install app or add to home screen/i)).toBeTruthy();
	});

	it("offers installation from preferences when the browser is installable", async () => {
		const user = userEvent.setup();
		const prompt = vi.fn().mockResolvedValue(undefined);
		const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
			prompt,
			userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
		});

		render(<AppPreferences />);
		window.dispatchEvent(event);
		await user.click(screen.getByRole("button", { name: /open preferences/i }));
		await user.click(await screen.findByRole("button", { name: /install akin/i }));

		expect(event.defaultPrevented).toBe(true);
		expect(prompt).toHaveBeenCalledOnce();
		await waitFor(() => expect(screen.queryByRole("button", { name: /install akin/i })).toBeNull());
	});
});
