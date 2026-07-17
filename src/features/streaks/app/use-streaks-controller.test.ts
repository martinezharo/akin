/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { addLocalDays, type LocalDateKey } from "../model/calendar";
import type { StreaksData } from "../persistence/storage";
import { useStreaksController } from "./use-streaks-controller";

const today: LocalDateKey = "2026-07-17";

function createData(overrides: Partial<StreaksData> = {}): StreaksData {
	return {
		streaks: [
			{
				id: "read",
				name: "Read ten pages",
				icon: "📚",
				days: 24,
				createdOn: "2026-06-01",
			},
			{
				id: "move",
				name: "Move my body",
				icon: "🏃",
				days: 6,
				createdOn: "2026-06-01",
			},
		],
		recentIcons: [],
		lastReviewedOn: addLocalDays(today, -1),
		...overrides,
	};
}

function renderController(data = createData()) {
	return renderHook(() =>
		useStreaksController({
			today,
			storageKey: "akin:test-streaks",
			createFallbackData: () => data,
		}),
	);
}

beforeEach(() => {
	localStorage.clear();
});

describe("streaks controller undo", () => {
	it("restores a deleted streak when undoing", () => {
		const { result } = renderController();

		act(() => result.current.remove("read"));
		expect(result.current.streaks.map((streak) => streak.id)).toEqual(["move"]);
		expect(result.current.undoToast).toMatchObject({
			kind: "delete",
			name: "Read ten pages",
		});

		act(() => result.current.undo());
		expect(result.current.streaks.map((streak) => streak.id)).toEqual([
			"read",
			"move",
		]);
		expect(result.current.undoToast).toBeNull();
	});

	it("keeps the streak deleted when the toast is dismissed", () => {
		const { result } = renderController();

		act(() => result.current.remove("read"));
		act(() => result.current.dismissUndo());

		expect(result.current.streaks.map((streak) => streak.id)).toEqual(["move"]);
		expect(result.current.undoToast).toBeNull();
	});

	it("offers a single undo toast once a review session is fully resolved", () => {
		const { result } = renderController(
			createData({ lastReviewedOn: addLocalDays(today, -3) }),
		);
		expect(result.current.unreviewedDays).toHaveLength(2);

		act(() =>
			result.current.resolveDay(addLocalDays(today, -2), {
				read: true,
				move: false,
			}),
		);
		// One day is still pending, so the toast must not appear yet.
		expect(result.current.hasPendingReview).toBe(true);
		expect(result.current.undoToast).toBeNull();

		act(() =>
			result.current.resolveDay(addLocalDays(today, -1), {
				read: true,
				move: true,
			}),
		);
		expect(result.current.hasPendingReview).toBe(false);
		expect(result.current.undoToast).toMatchObject({ kind: "review", name: null });
		expect(result.current.streaks.find((streak) => streak.id === "read")?.days).toBe(
			26,
		);

		act(() => result.current.undo());
		expect(result.current.streaks.find((streak) => streak.id === "read")?.days).toBe(
			24,
		);
		expect(result.current.streaks.find((streak) => streak.id === "move")?.days).toBe(
			6,
		);
		expect(result.current.hasPendingReview).toBe(true);
		expect(result.current.undoToast).toBeNull();
	});

	it("discards a pending undo as soon as another change happens", () => {
		const { result } = renderController();

		act(() => result.current.remove("read"));
		expect(result.current.undoToast).not.toBeNull();

		act(() => result.current.rename("move", "Move daily"));
		expect(result.current.undoToast).toBeNull();

		act(() => result.current.undo());
		expect(result.current.streaks.map((streak) => streak.id)).toEqual(["move"]);
	});
});
