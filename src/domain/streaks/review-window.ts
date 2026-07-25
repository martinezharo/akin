/**
 * How far back a review can ever reach.
 *
 * `lastReviewedOn` is persisted (in localStorage for guests, in the profile for
 * accounts) and only validated as a well-formed date, so a corrupted or ancient
 * value would otherwise make the client walk every day since that date. The cap
 * keeps that walk bounded no matter what the stored value says.
 */
export const MAX_REVIEW_GAP_DAYS = 366;
