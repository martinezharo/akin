import { describe, expect, it } from "vitest";
import { getAdaptivePopoverPlacement } from "./use-popover";

describe("adaptive popover placement", () => {
	it("opens below when the menu fits there", () => {
		expect(
			getAdaptivePopoverPlacement({
				triggerTop: 100,
				triggerBottom: 144,
				popoverHeight: 180,
				viewportTop: 0,
				viewportBottom: 800,
				gap: 8,
			}),
		).toBe("bottom");
	});

	it("opens above a trigger near the bottom of the viewport", () => {
		expect(
			getAdaptivePopoverPlacement({
				triggerTop: 700,
				triggerBottom: 744,
				popoverHeight: 180,
				viewportTop: 0,
				viewportBottom: 800,
				gap: 8,
			}),
		).toBe("top");
	});

	it("chooses the roomier side when the menu cannot fully fit either way", () => {
		expect(
			getAdaptivePopoverPlacement({
				triggerTop: 260,
				triggerBottom: 304,
				popoverHeight: 300,
				viewportTop: 0,
				viewportBottom: 500,
				gap: 8,
			}),
		).toBe("top");
	});
});
