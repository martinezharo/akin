/**
 * Membership lookup for check-ins.
 *
 * Both the backend and the client repeatedly ask "was this streak completed on
 * this day?" while walking a review gap, which is a loop over days nested in a
 * loop over streaks. Answering that with a linear scan makes the work grow with
 * the number of stored check-ins, so every caller builds this index once and
 * then answers in constant time.
 *
 * The streak identifier is deliberately untyped: the backend indexes by
 * `Id<"streaks">` and the client by the streak's `clientId`. Each side stays
 * internally consistent, and neither ever mixes the two.
 */

/** NUL can never appear in an id or a local date, so keys cannot collide. */
function checkInKey(streakId: string, day: string): string {
	return `${streakId}\u0000${day}`;
}

export class CheckInIndex {
	readonly #keys: ReadonlySet<string>;

	constructor(entries: Iterable<readonly [streakId: string, day: string]>) {
		const keys = new Set<string>();
		for (const [streakId, day] of entries) keys.add(checkInKey(streakId, day));
		this.#keys = keys;
	}

	has(streakId: string, day: string): boolean {
		return this.#keys.has(checkInKey(streakId, day));
	}
}

export const EMPTY_CHECK_IN_INDEX = new CheckInIndex([]);
