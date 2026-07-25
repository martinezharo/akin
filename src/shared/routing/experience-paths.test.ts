import { describe, expect, it } from "vitest";
import { APP_HOME_PATH, DEMO_HOME_PATH, getExperiencePath, hasAppChrome } from "./experience-paths";

describe("experience paths", () => {
	it("keeps navigation inside the demo experience", () => {
		expect(getExperiencePath("/demo", "/pet")).toBe("/demo/pet");
		expect(getExperiencePath("/demo", "/friends")).toBe("/demo/friends");
		expect(getExperiencePath("/demo", "/me")).toBe("/demo/me");
		expect(getExperiencePath("/demo/pet", "home")).toBe(DEMO_HOME_PATH);
	});

	it("uses the regular routes outside demo", () => {
		expect(getExperiencePath(APP_HOME_PATH, "/pet")).toBe("/pet");
		expect(getExperiencePath(APP_HOME_PATH, "/friends")).toBe("/friends");
		expect(getExperiencePath(APP_HOME_PATH, "/me")).toBe("/me");
		expect(getExperiencePath("/pet", "home")).toBe(APP_HOME_PATH);
	});

	it("sends home to the app rather than to the landing", () => {
		expect(getExperiencePath("/", "home")).toBe(APP_HOME_PATH);
		expect(getExperiencePath(null, "home")).toBe(APP_HOME_PATH);
	});

	it("does not treat a path merely prefixed with demo as the demo", () => {
		expect(getExperiencePath("/demolition", "home")).toBe(APP_HOME_PATH);
		expect(getExperiencePath("/demolition", "/pet")).toBe("/pet");
	});

	it("keeps the app chrome off the landing only", () => {
		expect(hasAppChrome("/")).toBe(false);
		expect(hasAppChrome(APP_HOME_PATH)).toBe(true);
		expect(hasAppChrome("/demo")).toBe(true);
	});
});
