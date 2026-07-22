import { describe, expect, it } from "vitest";
import { getExperiencePath } from "./experience-paths";

describe("experience paths", () => {
	it("keeps navigation inside the demo experience", () => {
		expect(getExperiencePath("/demo", "/pet")).toBe("/demo/pet");
		expect(getExperiencePath("/demo/pet", "/")).toBe("/demo");
	});

	it("uses the regular routes outside demo", () => {
		expect(getExperiencePath("/", "/pet")).toBe("/pet");
		expect(getExperiencePath("/pet", "/")).toBe("/");
	});
});
