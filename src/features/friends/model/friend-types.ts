export type FriendRelationship = "none" | "outgoing" | "incoming" | "friends";

export type Friend = {
	id: string;
	username: string;
	petSkin: string;
	petHair: string;
	/** Lifetime XP — kept for profile surfaces; the crew board ranks weekly. */
	xp: number;
	/** XP earned inside the rolling week, the number the crew is compared on. */
	weeklyXp: number;
	relationship?: FriendRelationship;
	requestId?: string | null;
};

/** The crew board is a weekly contest, so it sorts on the week's XP. */
export function byWeeklyXp(a: Friend, b: Friend) {
	return b.weeklyXp - a.weeklyXp || a.username.localeCompare(b.username);
}

/** Where a card is being rendered — it decides which action the card offers. */
export type FriendContext = "search" | "friends" | "incoming" | "outgoing";

export type FriendConnections = {
	friends: Friend[];
	incoming: Friend[];
	outgoing: Friend[];
};

export type FriendshipActions = {
	send: (profileId: string) => void;
	cancel: (profileId: string) => void;
	respond: (requestId: string, accept: boolean) => void;
};

export const EMPTY_CONNECTIONS: FriendConnections = { friends: [], incoming: [], outgoing: [] };

/** Usernames are searched without the leading `@` and case-insensitively. */
export function normalizeUsernameQuery(query: string) {
	return query.trim().replace(/^@/, "").toLowerCase();
}

export const MIN_SEARCH_LENGTH = 2;
