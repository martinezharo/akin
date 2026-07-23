import type { MutationCtx, QueryCtx } from "../_generated/server";
import { authComponent } from "../auth";
import { DEFAULT_PET_HAIR_ID, DEFAULT_PET_SKIN_ID } from "./app-rules";
import { addLocalDays } from "./dates";
import { listActiveStreaks } from "./streaks";

export const STARTING_COINS = 20;

export async function requireAuthUser(ctx: QueryCtx | MutationCtx) {
	return await authComponent.getAuthUser(ctx);
}

export async function getProfile(ctx: QueryCtx | MutationCtx, userId: string) {
	return await ctx.db
		.query("profiles")
		.withIndex("by_user", (query) => query.eq("userId", userId))
		.unique();
}

export async function getWallet(ctx: QueryCtx | MutationCtx, userId: string) {
	return await ctx.db
		.query("wallets")
		.withIndex("by_user", (query) => query.eq("userId", userId))
		.unique();
}

export async function ensureUserState(
	ctx: MutationCtx,
	user: Awaited<ReturnType<typeof authComponent.getAuthUser>>,
	today: string,
	timeZone: string,
) {
	const now = Date.now();
	let profile = await getProfile(ctx, user._id);
	if (!profile) {
		const profileId = await ctx.db.insert("profiles", {
			userId: user._id,
			displayName: user.name,
			email: user.email,
			petSkin: DEFAULT_PET_SKIN_ID,
			petHair: DEFAULT_PET_HAIR_ID,
			ownedPetSkins: [DEFAULT_PET_SKIN_ID],
			timeZone,
			lastReviewedOn: today,
			recentIcons: [],
			createdAt: now,
			updatedAt: now,
		});
		profile = (await ctx.db.get(profileId))!;
	} else if (profile.timeZone !== timeZone) {
		await ctx.db.patch(profile._id, { timeZone, updatedAt: now });
		profile = (await ctx.db.get(profile._id))!;
	}

	let wallet = await getWallet(ctx, user._id);
	if (!wallet) {
		const walletId = await ctx.db.insert("wallets", {
			userId: user._id,
			balance: STARTING_COINS,
			lifetimeEarned: STARTING_COINS,
			xp: 0,
			updatedAt: now,
		});
		wallet = (await ctx.db.get(walletId))!;
	}

	return { profile, wallet };
}

export async function advanceFullyCheckedDays(
	ctx: MutationCtx,
	userId: string,
	today: string,
) {
	const profile = await getProfile(ctx, userId);
	if (!profile || profile.lastReviewedOn >= today) return;
	const [streaks, checkIns] = await Promise.all([
		listActiveStreaks(ctx, userId),
		ctx.db
			.query("checkIns")
			.withIndex("by_user_date", (query) =>
				query
					.eq("userId", userId)
					.gte("localDate", profile.lastReviewedOn),
			)
			.collect(),
	]);
	const completed = new Set(
		checkIns.map((checkIn) => `${checkIn.streakId}:${checkIn.localDate}`),
	);
	let lastReviewedOn = profile.lastReviewedOn;
	let day = addLocalDays(lastReviewedOn, 1);
	let inspected = 0;
	while (day < today && inspected < 366) {
		const applicable = streaks.filter((streak) => streak.createdOn <= day);
		if (!applicable.every((streak) => completed.has(`${streak._id}:${day}`))) break;
		lastReviewedOn = day;
		day = addLocalDays(day, 1);
		inspected += 1;
	}
	if (lastReviewedOn !== profile.lastReviewedOn) {
		await ctx.db.patch(profile._id, { lastReviewedOn, updatedAt: Date.now() });
	}
}
