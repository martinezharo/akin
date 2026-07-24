/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as dashboard from "../dashboard.js";
import type * as friendships from "../friendships.js";
import type * as http from "../http.js";
import type * as lib_app_rules from "../lib/app_rules.js";
import type * as lib_coins from "../lib/coins.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_friendships from "../lib/friendships.js";
import type * as lib_streaks from "../lib/streaks.js";
import type * as lib_undo from "../lib/undo.js";
import type * as lib_undo_schema from "../lib/undo_schema.js";
import type * as lib_users from "../lib/users.js";
import type * as pet from "../pet.js";
import type * as progress from "../progress.js";
import type * as streaks from "../streaks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  dashboard: typeof dashboard;
  friendships: typeof friendships;
  http: typeof http;
  "lib/app_rules": typeof lib_app_rules;
  "lib/coins": typeof lib_coins;
  "lib/dates": typeof lib_dates;
  "lib/friendships": typeof lib_friendships;
  "lib/streaks": typeof lib_streaks;
  "lib/undo": typeof lib_undo;
  "lib/undo_schema": typeof lib_undo_schema;
  "lib/users": typeof lib_users;
  pet: typeof pet;
  progress: typeof progress;
  streaks: typeof streaks;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
