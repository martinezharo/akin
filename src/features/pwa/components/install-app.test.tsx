/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InstallApp } from "./install-app";

beforeEach(() => {
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn().mockReturnValue({ matches: false }),
	});
});

afterEach(cleanup);

describe("InstallApp", () => {
	it("offers the browser install prompt when the app becomes installable", async () => {
		const user = userEvent.setup();
		const prompt = vi.fn().mockResolvedValue(undefined);
		const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
			prompt,
			userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
		});

		render(<InstallApp />);
		window.dispatchEvent(event);

		const installButton = await screen.findByRole("button", { name: /install akin/i });
		expect(event.defaultPrevented).toBe(true);

		await user.click(installButton);
		expect(prompt).toHaveBeenCalledOnce();
		await waitFor(() => expect(screen.queryByRole("button", { name: /install akin/i })).toBeNull());
	});

	it("hides the install action once the app is installed", async () => {
		const event = Object.assign(new Event("beforeinstallprompt", { cancelable: true }), {
			prompt: vi.fn(),
			userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
		});

		render(<InstallApp />);
		window.dispatchEvent(event);
		expect(await screen.findByRole("button", { name: /install akin/i })).toBeTruthy();

		window.dispatchEvent(new Event("appinstalled"));
		await waitFor(() => expect(screen.queryByRole("button", { name: /install akin/i })).toBeNull());
	});
});
