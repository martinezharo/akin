/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ui } from "@/i18n/en";
import type { Streak } from "../../model/streak";
import { StreakActions } from "./streak-actions";

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

const streak: Streak = {
	id: "read",
	name: "Read every day",
	icon: "📚",
	days: 24,
	createdOn: "2026-07-01",
};

function renderActions() {
	const callbacks = {
		onRename: vi.fn(),
		onAdjustDays: vi.fn(),
		onRemove: vi.fn(),
	};
	render(<StreakActions streak={streak} {...callbacks} />);
	return callbacks;
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
	await user.click(screen.getByRole("button", { name: ui.streaks.openActions(streak.name) }));
}

describe("streak actions", () => {
	it("renames a streak from its action menu", async () => {
		const user = userEvent.setup();
		const { onRename } = renderActions();
		await openMenu(user);

		expect(screen.getByRole("menu", { name: ui.streaks.actionsLabel(streak.name) })).toBeTruthy();
		await user.click(screen.getByRole("menuitem", { name: ui.streaks.renameAction }));

		const dialog = await screen.findByRole("dialog", { name: ui.streaks.renameTitle });
		expect(dialog.hasAttribute("open")).toBe(true);
		const input = screen.getByRole("textbox", { name: ui.streaks.renameLabel });
		await user.clear(input);
		await user.type(input, "Read a chapter");
		await user.click(screen.getByRole("button", { name: ui.streaks.saveName }));

		expect(onRename).toHaveBeenCalledWith("Read a chapter");
	});

	it("opens a dedicated counter editor", async () => {
		const user = userEvent.setup();
		const { onAdjustDays } = renderActions();
		await openMenu(user);
		await user.click(screen.getByRole("menuitem", { name: ui.streaks.adjustAction }));

		const input = await screen.findByRole("spinbutton", { name: ui.streaks.adjustLabel });
		expect((input as HTMLInputElement).value).toBe("24");
		await user.clear(input);
		await user.type(input, "42");
		await user.click(screen.getByRole("button", { name: ui.streaks.saveCount }));

		expect(onAdjustDays).toHaveBeenCalledWith(42);
	});

	it("requires confirmation before deleting", async () => {
		const user = userEvent.setup();
		const { onRemove } = renderActions();
		await openMenu(user);
		await user.click(screen.getByRole("menuitem", { name: ui.streaks.deleteAction }));

		expect(onRemove).not.toHaveBeenCalled();
		expect(
			await screen.findByRole("dialog", { name: ui.streaks.deleteTitle(streak.name) }),
		).toBeTruthy();
		await user.click(screen.getByRole("button", { name: ui.streaks.confirmDelete }));

		expect(onRemove).toHaveBeenCalledOnce();
	});
});
