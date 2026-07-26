/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ui } from "@/i18n";
import type { Streak } from "../../model/streak";
import { StreakList } from "./streak-list";

beforeAll(() => {
	vi.stubGlobal(
		"ResizeObserver",
		class ResizeObserver {
			observe() {}
			disconnect() {}
		},
	);
});

afterEach(cleanup);

const options = [{ value: "📚", label: "Reading" }] as const;
const actions = {
	onUpdateIcon: vi.fn(),
	onRename: vi.fn(),
	onAdjustDays: vi.fn(),
	onRemove: vi.fn(),
	adjustHintStreakId: null,
	onDismissAdjustHint: vi.fn(),
};

describe("streak list", () => {
	it("shows a disabled preview only while the list is empty", () => {
		const { rerender } = render(
			<StreakList streaks={[]} iconOptions={options} {...actions} />,
		);

		expect(screen.getByText(ui.streaks.emptyPreview)).toBeTruthy();
		expect(screen.getByText("Drink some water")).toBeTruthy();
		const previewList = screen.getByRole("list", { name: ui.streaks.listLabel });
		expect(previewList.children).toHaveLength(3);
		expect(
			Array.from(previewList.querySelectorAll("[data-tier]"), (badge) => badge.textContent),
		).toEqual(["9", "23", "25"]);
		expect(screen.queryByRole("button")).toBeNull();

		const streak: Streak = {
			id: "reading",
			name: "Read every day",
			icon: "📚",
			days: 0,
			createdOn: "2026-07-16",
		};

		rerender(
			<StreakList streaks={[streak]} iconOptions={options} {...actions} />,
		);

		expect(screen.queryByText(ui.streaks.emptyPreview)).toBeNull();
		expect(screen.queryByText("Drink some water")).toBeNull();
		expect(screen.getByText("Read every day")).toBeTruthy();
		expect(screen.getByRole("list", { name: ui.streaks.listLabel }).children).toHaveLength(1);

		rerender(
			<StreakList
				streaks={[streak]}
				iconOptions={options}
				{...actions}
				adjustHintStreakId={streak.id}
			/>,
		);
		expect(screen.getByText(ui.streaks.newStreakHint)).toBeTruthy();
	});

	it("keeps the streak count visible while completing today", () => {
		const onCompleteToday = vi.fn();
		const streak: Streak = {
			id: "reading",
			name: "Read every day",
			icon: "📚",
			days: 24,
			createdOn: "2026-07-16",
		};
		const { rerender } = render(
			<StreakList
				streaks={[streak]}
				iconOptions={options}
				{...actions}
				onCompleteToday={onCompleteToday}
			/>,
		);

		const completeButton = screen.getByRole("button", {
			name: ui.streaks.completeToday(streak.name, streak.days),
		});
		expect(completeButton.textContent).toContain("24");
		fireEvent.click(completeButton);
		expect(onCompleteToday).toHaveBeenCalledWith(streak.id);

		rerender(
			<StreakList
				streaks={[{ ...streak, days: 25 }]}
				iconOptions={options}
				{...actions}
				onCompleteToday={onCompleteToday}
				completedTodayStreakIds={[streak.id]}
			/>,
		);

		const completedButton = screen.getByRole("button", {
			name: ui.streaks.completedToday(streak.name, 25),
		});
		expect(completedButton.textContent).toContain("25");
		expect((completedButton as HTMLButtonElement).disabled).toBe(true);
	});
});
