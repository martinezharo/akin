/** @vitest-environment jsdom */

import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LandingHeader } from "./landing-header";

beforeEach(() => {
	window.localStorage.clear();
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
	});
	HTMLDialogElement.prototype.showModal = function showModal() {
		this.open = true;
	};
	HTMLDialogElement.prototype.close = function close() {
		this.open = false;
	};
});

afterEach(cleanup);

function scrollTo(y: number) {
	act(() => {
		window.scrollY = y;
		window.dispatchEvent(new Event("scroll"));
	});
}

describe("LandingHeader", () => {
	it("stays bare at the top and takes on a surface once the page moves", () => {
		render(<LandingHeader />);
		const header = screen.getByRole("banner");

		expect(header.dataset.lifted).toBeUndefined();

		scrollTo(240);
		expect(header.dataset.lifted).toBe("true");

		// Scrolling back to the top puts it away again.
		scrollTo(0);
		expect(header.dataset.lifted).toBeUndefined();
	});

	it("ignores a scroll too small to put anything under the bar", () => {
		render(<LandingHeader />);
		const header = screen.getByRole("banner");

		scrollTo(4);
		expect(header.dataset.lifted).toBeUndefined();
	});

	it("carries the appearance and language settings", async () => {
		const user = userEvent.setup();
		render(<LandingHeader />);

		await user.click(screen.getByRole("button", { name: /switch to dark/i }));
		expect(document.documentElement.dataset.theme).toBe("dark");
		expect(JSON.parse(window.localStorage.getItem("akin.preferences.v1") ?? "null")).toEqual({ theme: "dark" });

		await user.click(screen.getByRole("button", { name: /language: english/i }));
		expect(screen.getByRole("menuitemradio", { name: /español/i })).toBeTruthy();
	});
});
