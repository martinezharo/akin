/**
 * Single bridge between the Convex backend and the shared domain rules that
 * live in `src/domain`. Convex functions import from here so every crossing of
 * the backend/frontend boundary stays explicit and greppable.
 */
export * from "../../src/domain/account/username";
export * from "../../src/domain/streaks/check-in-index";
export * from "../../src/domain/pet/pet-catalog";
export * from "../../src/domain/pet/pet-customization";
export * from "../../src/domain/rewards/reward-rules";
