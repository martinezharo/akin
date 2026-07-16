/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComposerIconPicker, StreakIconPicker } from "./icon-picker";

afterEach(cleanup);

const options = [
	{ value: "💪", label: "Strength" },
	{ value: "🧠", label: "Learning" },
	{ value: "📚", label: "Reading" },
] as const;

describe("icon picker", () => {
	it("supports arrow, boundary and Escape keyboard navigation", async () => {
		const user = userEvent.setup();
		render(<ComposerIconPicker value={null} onChange={vi.fn()} options={options} />);

		const trigger = screen.getByRole("button", { name: "Choose an icon" });
		await user.click(trigger);
		expect(await screen.findByRole("dialog", { name: "Streak icon picker" })).toBeTruthy();

		await waitFor(() => expect(document.activeElement?.getAttribute("aria-label")).toBe("Strength"));
		await user.keyboard("{ArrowRight}");
		expect(document.activeElement?.getAttribute("aria-label")).toBe("Learning");
		await user.keyboard("{End}");
		expect(document.activeElement?.getAttribute("aria-label")).toBe("Add your own emoji");
		await user.keyboard("{Escape}");

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(document.activeElement).toBe(trigger);
	});

	it("exposes an explicit streak trigger variant", () => {
		render(
			<StreakIconPicker
				value="📚"
				onChange={vi.fn()}
				options={options}
				triggerLabel="Change Read icon"
			/>,
		);

		expect(screen.getByRole("button", { name: "Change Read icon" })).toBeTruthy();
	});
});
