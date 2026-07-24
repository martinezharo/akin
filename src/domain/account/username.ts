export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
export const USERNAME_HTML_PATTERN = "[a-zA-Z0-9_]{3,20}";

export function normalizeUsername(value: string) {
	return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
	return USERNAME_PATTERN.test(normalizeUsername(value));
}
