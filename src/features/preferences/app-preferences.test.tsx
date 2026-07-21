/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppPreferences } from "./app-preferences";

beforeEach(() => {
	window.localStorage.clear();
	Object.defineProperty(window.navigator, "userAgent", {
		configurable: true,
		value: "Mozilla/5.0 (X11; Linux x86_64)",
	});
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
	it("shows the install notice once on a mobile device", async () => {
		const user = userEvent.setup();
		Object.defineProperty(window.navigator, "userAgent", {
			configurable: true,
			value: "Mozilla/5.0 (Linux; Android 15; Mobile)",
		});

		const firstVisit = render(<AppPreferences />);
		const trigger = await screen.findByRole("button", { name: /new: install akin/i });
		expect(trigger.querySelector("span")?.textContent).toBe("!");

		await user.click(trigger);
		expect(window.localStorage.getItem("akin.install-nudge-seen.v1")).toBe("true");
		const installButton = screen.getByRole("button", { name: /install akin/i });
		expect(installButton.textContent).toMatch(/install akin.*new/i);
		firstVisit.unmount();

		render(<AppPreferences />);
		expect(screen.getByRole("button", { name: /^open preferences$/i }).querySelector("span")).toBeNull();
	});

	it("does not show the first-visit install notice on desktop", () => {
		render(<AppPreferences />);

		expect(screen.getByRole("button", { name: /^open preferences$/i }).querySelector("span")).toBeNull();
		expect(window.localStorage.getItem("akin.install-nudge-seen.v1")).toBeNull();
	});

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
