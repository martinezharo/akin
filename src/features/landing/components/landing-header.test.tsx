/** @vitest-environment jsdom */

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingHeader } from "./landing-header";

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
});
