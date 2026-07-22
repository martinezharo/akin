import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getProfile, getWallet, requireAuthUser } from "./lib/users";

const SKIN_PRICES: Record<string, number> = {
	ember: 0,
	cinnamon: 35,
	moss: 55,
	berry: 75,
	plum: 90,
	sky: 110,
};

const HAIRS = new Set(["honey", "cream", "mint", "lilac", "rose"]);

function getOwnedSkins(profile: { petSkin?: string; ownedPetSkins?: string[] } | null) {
	// Legacy pet profiles only stored the equipped skin, so their exact purchase
	// history cannot be reconstructed. Grant the existing catalog once rather
	// than risk charging the same user twice.
	if (profile && profile.ownedPetSkins === undefined) return Object.keys(SKIN_PRICES);
	return [...new Set([
		"ember",
		...(profile?.petSkin && profile.petSkin in SKIN_PRICES ? [profile.petSkin] : []),
		...(profile?.ownedPetSkins ?? []).filter((skinId) => skinId in SKIN_PRICES),
	])];
}

export const get = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireAuthUser(ctx);
		const [profile, wallet] = await Promise.all([getProfile(ctx, user._id), getWallet(ctx, user._id)]);
		return {
			skinId: profile?.petSkin ?? "ember",
			hairId: profile?.petHair ?? "honey",
			ownedSkinIds: getOwnedSkins(profile),
			balance: wallet?.balance ?? 0,
			xp: wallet?.xp ?? 0,
		};
	},
});

export const setHair = mutation({
	args: { hairId: v.string() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		if (!HAIRS.has(args.hairId)) throw new Error("Unknown hair color");
		const profile = await getProfile(ctx, user._id);
		if (!profile) throw new Error("Profile not found");
		if (profile.petHair === args.hairId) return;
		await ctx.db.patch(profile._id, { petHair: args.hairId, updatedAt: Date.now() });
	},
});

export const purchaseSkin = mutation({
	args: { skinId: v.string() },
	handler: async (ctx, args) => {
		const user = await requireAuthUser(ctx);
		const price = SKIN_PRICES[args.skinId];
		if (price === undefined) throw new Error("Unknown skin color");
		const [profile, wallet] = await Promise.all([getProfile(ctx, user._id), getWallet(ctx, user._id)]);
		if (!profile || !wallet) throw new Error("Pet wallet not found");
		if (profile.petSkin === args.skinId) return;
		const ownedSkinIds = getOwnedSkins(profile);
		if (ownedSkinIds.includes(args.skinId)) {
			await ctx.db.patch(profile._id, { petSkin: args.skinId, ownedPetSkins: ownedSkinIds, updatedAt: Date.now() });
			return;
		}
		if (wallet.balance < price) throw new Error("Not enough coins");
		await ctx.db.patch(profile._id, { petSkin: args.skinId, ownedPetSkins: [...ownedSkinIds, args.skinId], updatedAt: Date.now() });
		await ctx.db.patch(wallet._id, { balance: wallet.balance - price, updatedAt: Date.now() });
	},
});
