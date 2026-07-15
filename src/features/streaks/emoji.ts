import emojiRegex from "emoji-regex";

const EMOJI_SEQUENCE_PATTERN = emojiRegex();

export function parseSingleEmoji(value: string): string | null {
	const matches = value.match(EMOJI_SEQUENCE_PATTERN);

	if (matches?.length !== 1 || matches[0] !== value) {
		return null;
	}

	return value;
}
