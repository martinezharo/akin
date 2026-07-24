export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const USERNAME_HTML_PATTERN = "[a-zA-Z0-9_]{3,20}";

export const USERNAME_ERROR_CODES = {
	invalid: "USERNAME_INVALID",
	taken: "USERNAME_TAKEN",
	profileNotReady: "USERNAME_PROFILE_NOT_READY",
} as const;

export type UsernameValidationError = "empty" | "tooShort" | "tooLong" | "invalidCharacters";

export function normalizeUsername(value: string) {
	return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
	return getUsernameValidationError(value) === null;
}

export function getUsernameValidationError(value: string): UsernameValidationError | null {
	const normalized = normalizeUsername(value);

	if (!normalized) return "empty";
	if (normalized.length < USERNAME_MIN_LENGTH) return "tooShort";
	if (normalized.length > USERNAME_MAX_LENGTH) return "tooLong";
	if (!/^[a-z0-9_]+$/.test(normalized)) return "invalidCharacters";

	return null;
}
