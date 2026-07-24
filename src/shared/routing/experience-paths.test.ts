import { describe, expect, it } from "vitest";
import { getExperiencePath } from "./experience-paths";

describe("experience paths", () => {
	it("keeps navigation inside the demo experience", () => {
		expect(getExperiencePath("/demo", "/pet")).toBe("/demo/pet");
		expect(getExperiencePath("/demo", "/friends")).toBe("/demo/friends");
		expect(getExperiencePath("/demo", "/me")).toBe("/demo/me");
		expect(getExperiencePath("/demo/pet", "/")).toBe("/demo");
	});

	it("uses the regular routes outside demo", () => {
		expect(getExperiencePath("/", "/pet")).toBe("/pet");
		expect(getExperiencePath("/", "/friends")).toBe("/friends");
		expect(getExperiencePath("/", "/me")).toBe("/me");
		expect(getExperiencePath("/pet", "/")).toBe("/");
	});
});
