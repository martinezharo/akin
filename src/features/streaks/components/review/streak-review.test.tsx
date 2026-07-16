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
	it("opens as a modal dialog and resolves a completed day", async () => {
		const user = userEvent.setup();
		const onResolveDay = vi.fn();
		render(
			<StreakReviewFlow
				days={["2026-07-15"]}
				streaks={[
					{
						id: "read",
						name: "Read",
						icon: "📚",
						days: 3,
						createdOn: "2026-07-01",
					},
				]}
				onResolveDay={onResolveDay}
				onResolveGap={vi.fn()}
			/>,
		);

		const dialog = await screen.findByRole("dialog", { name: "How did you do?" });
		expect(dialog.hasAttribute("open")).toBe(true);
		expect(document.body.style.overflow).toBe("hidden");

		await user.click(screen.getByRole("button", { name: "I did" }));
		await user.click(screen.getByRole("button", { name: "All caught up" }));
		expect(onResolveDay).toHaveBeenCalledWith("2026-07-15", { read: true });
	});
});
