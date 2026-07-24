import { describe, expect, it } from "vitest";
import {
	getUsernameValidationError,
	isValidUsername,
	normalizeUsername,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
} from "./username";

describe("username rules", () => {
	it("normalizes user input before validation", () => {
		expect(normalizeUsername("  Akin_Friend  ")).toBe("akin_friend");
		expect(isValidUsername("  Akin_Friend  ")).toBe(true);
	});

	it("rejects values outside the shared contract", () => {
		expect(USERNAME_MIN_LENGTH).toBe(3);
		expect(USERNAME_MAX_LENGTH).toBe(20);
		expect(isValidUsername("ab")).toBe(false);
		expect(isValidUsername("contains-dash")).toBe(false);
		expect(isValidUsername("a".repeat(21))).toBe(false);
	});

	it("explains which part of a username needs attention", () => {
		expect(getUsernameValidationError("")).toBe("empty");
		expect(getUsernameValidationError("ak")).toBe("tooShort");
		expect(getUsernameValidationError("a".repeat(21))).toBe("tooLong");
		expect(getUsernameValidationError("akin-friend")).toBe("invalidCharacters");
		expect(getUsernameValidationError("akin_friend")).toBeNull();
	});
});
