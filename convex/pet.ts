import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import {
	DEFAULT_PET_HAIR_ID,
	DEFAULT_PET_SKIN_ID,
	isPetHairId,
	isPetSkinId,
	PET_SKIN_IDS,
	PET_SKIN_PRICES,
	type PetSkinId,
} from "./lib/app_rules";
import { getProfile, getWallet, requireAuthUser } from "./lib/users";

function getOwnedSkins(profile: { petSkin?: string; ownedPetSkins?: string[] } | null): PetSkinId[] {
	// Legacy pet profiles only stored the equipped skin, so their exact purchase
	// history cannot be reconstructed. Grant the existing catalog once rather
	// than risk charging the same user twice.
	if (profile && profile.ownedPetSkins === undefined) return [...PET_SKIN_IDS];
	const equippedSkin = profile?.petSkin && isPetSkinId(profile.petSkin) ? [profile.petSkin] : [];
	const storedSkins = (profile?.ownedPetSkins ?? []).filter(
		(skinId): skinId is PetSkinId => isPetSkinId(skinId),
	);
	return [...new Set<PetSkinId>([DEFAULT_PET_SKIN_ID, ...equippedSkin, ...storedSkins])];
}

export const get = query({
	args: {},
	handler: async (ctx) => {
		const user = await requireAuthUser(ctx);
		const [profile, wallet] = await Promise.all([getProfile(ctx, user._id), getWallet(ctx, user._id)]);
		return {
			skinId: profile?.petSkin && isPetSkinId(profile.petSkin) ? profile.petSkin : DEFAULT_PET_SKIN_ID,
			hairId: profile?.petHair && isPetHairId(profile.petHair) ? profile.petHair : DEFAULT_PET_HAIR_ID,
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
		if (!isPetHairId(args.hairId)) throw new Error("Unknown hair color");
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
		if (!isPetSkinId(args.skinId)) throw new Error("Unknown skin color");
		const price = PET_SKIN_PRICES[args.skinId];
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
