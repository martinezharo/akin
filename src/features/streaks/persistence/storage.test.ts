import { beforeEach, describe, expect, it, vi } from "vitest";
import type { LocalDateKey } from "../model/calendar";
import {
	createEmptyStreaksData,
	loadStreaksData,
	saveStreaksData,
	STREAKS_STORAGE_KEY,
} from "./storage";

function createStorage() {
	const values = new Map<string, string>();
	return {
		getItem: vi.fn((key: string) => values.get(key) ?? null),
		setItem: vi.fn((key: string, value: string) => values.set(key, value)),
		removeItem: vi.fn((key: string) => values.delete(key)),
		clear: vi.fn(() => values.clear()),
		key: vi.fn((index: number) => [...values.keys()][index] ?? null),
		get length() {
			return values.size;
		},
	} satisfies Storage;
}

describe("streak storage", () => {
	beforeEach(() => {
		vi.stubGlobal("localStorage", createStorage());
	});

	it("round-trips validated data", () => {
		const fallback = createEmptyStreaksData("2026-07-16");
		const data = {
			...fallback,
			streaks: [
				{
					id: "read",
					name: "Read",
					icon: "📚",
					days: 3,
					createdOn: "2026-07-10" as LocalDateKey,
				},
			],
		};

		saveStreaksData(STREAKS_STORAGE_KEY, data);
		expect(loadStreaksData(STREAKS_STORAGE_KEY, fallback)).toEqual(data);
	});

	it("falls back when persisted data does not match the schema", () => {
		const fallback = createEmptyStreaksData("2026-07-16");
		localStorage.setItem(STREAKS_STORAGE_KEY, JSON.stringify({ streaks: "broken" }));

		expect(loadStreaksData(STREAKS_STORAGE_KEY, fallback)).toBe(fallback);
	});

	it("remains usable when storage access throws", () => {
		const fallback = createEmptyStreaksData("2026-07-16");
		vi.spyOn(localStorage, "getItem").mockImplementation(() => {
			throw new Error("storage disabled");
		});

		expect(loadStreaksData(STREAKS_STORAGE_KEY, fallback)).toBe(fallback);
		expect(() => saveStreaksData(STREAKS_STORAGE_KEY, fallback)).not.toThrow();
	});
});
