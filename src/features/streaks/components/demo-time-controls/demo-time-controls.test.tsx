/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoTimeControls } from "./demo-time-controls";

afterEach(cleanup);

describe("demo time controls", () => {
	it("advances by a custom number of days", async () => {
		const user = userEvent.setup();
		const onAdvance = vi.fn();
		render(
			<DemoTimeControls
				today="2026-07-16"
				hasPendingReview={false}
				onAdvance={onAdvance}
				onReset={vi.fn()}
			/>,
		);

		const input = screen.getByRole("spinbutton", { name: "Days to skip" });
		await user.clear(input);
		await user.type(input, "42");
		await user.click(screen.getByRole("button", { name: "Leap forward" }));

		expect(onAdvance).toHaveBeenCalledWith(42);
	});

	it("rejects custom jumps outside the supported range", () => {
		const onAdvance = vi.fn();
		render(
			<DemoTimeControls
				today="2026-07-16"
				hasPendingReview={false}
				onAdvance={onAdvance}
				onReset={vi.fn()}
			/>,
		);

		const input = screen.getByRole("spinbutton", { name: "Days to skip" });
		fireEvent.change(input, { target: { value: "3651" } });
		fireEvent.submit(input.closest("form")!);

		expect(onAdvance).not.toHaveBeenCalled();
	});

	it("disables custom time travel while a review is pending", async () => {
		const user = userEvent.setup();
		render(
			<DemoTimeControls
				today="2026-07-16"
				hasPendingReview
				onAdvance={vi.fn()}
				onReset={vi.fn()}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Expand time controls" }));

		expect(
			(screen.getByRole("spinbutton", { name: "Days to skip" }) as HTMLInputElement).disabled,
		).toBe(true);
		expect(
			(screen.getByRole("button", { name: "Leap forward" }) as HTMLButtonElement).disabled,
		).toBe(true);
	});
});
