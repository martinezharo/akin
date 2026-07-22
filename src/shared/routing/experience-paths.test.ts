import { describe, expect, it } from "vitest";
import { getExperiencePath } from "./experience-paths";

describe("experience paths", () => {
	it("keeps navigation inside the demo experience", () => {
		expect(getExperiencePath("/demo", "/akin")).toBe("/demo/akin");
		expect(getExperiencePath("/demo/akin", "/")).toBe("/demo");
	});

	it("uses the regular routes outside demo", () => {
		expect(getExperiencePath("/", "/akin")).toBe("/akin");
		expect(getExperiencePath("/akin", "/")).toBe("/");
	});
});
