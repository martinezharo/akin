/** @vitest-environment jsdom */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ui } from "@/i18n";
import { PettableMascot } from "./pettable-mascot";

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe("PettableMascot", () => {
	it("reacts to being petted with the app's own companion messages", () => {
		render(<PettableMascot />);
		const mascot = screen.getByRole("button", { name: ui.pet.stage.petButton });

		expect(mascot.getAttribute("data-interacting")).toBeNull();

		fireEvent.pointerDown(mascot, { pointerId: 1 });

		expect(mascot.getAttribute("data-interacting")).toBe("true");
		const bubble = screen.getByText((text) => ui.pet.stage.messages.includes(text));
		expect(bubble.dataset.visible).toBe("true");
	});

	it("settles back down once the reaction has played out", () => {
		vi.useFakeTimers();
		render(<PettableMascot />);
		const mascot = screen.getByRole("button", { name: ui.pet.stage.petButton });

		fireEvent.pointerDown(mascot, { pointerId: 1 });
		expect(mascot.getAttribute("data-interacting")).toBe("true");

		act(() => vi.advanceTimersByTime(3_000));

		expect(mascot.getAttribute("data-interacting")).toBeNull();
	});
});
