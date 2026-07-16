/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { StreakReviewFlow } from "./streak-review";

beforeAll(() => {
	HTMLDialogElement.prototype.showModal = function showModal() {
		this.setAttribute("open", "");
	};
	HTMLDialogElement.prototype.close = function close() {
		this.removeAttribute("open");
	};
});

afterEach(() => {
	cleanup();
	document.body.style.overflow = "";
});

describe("streak review", () => {
	const streaks = [
		{
			id: "read",
			name: "Read",
			icon: "📚",
			days: 3,
			createdOn: "2026-07-01" as const,
		},
	];

	it("opens as a modal dialog and resolves a completed day", async () => {
		const user = userEvent.setup();
		const onResolveDay = vi.fn();
		render(
			<StreakReviewFlow
				days={["2026-07-15"]}
				streaks={streaks}
				onResolveDay={onResolveDay}
				onResolveGap={vi.fn()}
			/>,
		);

		const dialog = await screen.findByRole("dialog", { name: "How did you do?" });
		expect(dialog.hasAttribute("open")).toBe(true);
		expect(document.body.style.overflow).toBe("hidden");

		await user.click(screen.getByRole("checkbox", { name: "Did you complete Read?" }));
		await user.click(screen.getByRole("button", { name: "All caught up" }));
		expect(onResolveDay).toHaveBeenCalledWith("2026-07-15", { read: true });
	});

	it("treats unchecked streaks as not completed", async () => {
		const user = userEvent.setup();
		const onResolveDay = vi.fn();
		render(
			<StreakReviewFlow
				days={["2026-07-15"]}
				streaks={streaks}
				onResolveDay={onResolveDay}
				onResolveGap={vi.fn()}
			/>,
		);

		await user.click(await screen.findByRole("button", { name: "All caught up" }));
		expect(onResolveDay).toHaveBeenCalledWith("2026-07-15", { read: false });
	});

	it("reuses the checklist for gap reviews", async () => {
		const user = userEvent.setup();
		const onResolveGap = vi.fn();
		const days = ["2026-07-12", "2026-07-13", "2026-07-14", "2026-07-15"] as const;
		render(
			<StreakReviewFlow
				days={[...days]}
				streaks={streaks}
				onResolveDay={vi.fn()}
				onResolveGap={onResolveGap}
			/>,
		);

		const checkbox = await screen.findByRole("checkbox", {
			name: "Did you keep Read every day?",
		});
		expect((checkbox as HTMLInputElement).checked).toBe(false);

		await user.click(checkbox);
		await user.click(screen.getByRole("button", { name: "That’s the honest version" }));
		expect(onResolveGap).toHaveBeenCalledWith([...days], { read: true });
	});

	it("shows different guidance for each review day", () => {
		const props = {
			streaks,
			onResolveDay: vi.fn(),
			onResolveGap: vi.fn(),
		};
		const { rerender } = render(
			<StreakReviewFlow
				{...props}
				days={["2026-07-13", "2026-07-14", "2026-07-15"]}
			/>,
		);

		expect(screen.getByText(/Mark the promises you kept/)).toBeTruthy();

		rerender(<StreakReviewFlow {...props} days={["2026-07-14", "2026-07-15"]} />);
		expect(screen.getByText(/Anything left blank simply means not this time/)).toBeTruthy();

		rerender(<StreakReviewFlow {...props} days={["2026-07-15"]} />);
		expect(screen.getByText(/One last look back/)).toBeTruthy();
	});
});
