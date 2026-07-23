import {
	DEFAULT_PET_HAIR_ID,
	DEFAULT_PET_SKIN_ID,
	getPetSkin,
	isPetSkinId,
	type PetHairId,
	type PetSkinId,
} from "./pet-catalog";

export type PetCustomization = {
	skinId: PetSkinId;
	hairId: PetHairId;
};

export type StoredPetCustomization = PetCustomization & {
	ownedSkinIds: PetSkinId[];
};

export const DEFAULT_PET_CUSTOMIZATION: PetCustomization = {
	skinId: DEFAULT_PET_SKIN_ID,
	hairId: DEFAULT_PET_HAIR_ID,
};

export const DEFAULT_OWNED_PET_SKINS: PetSkinId[] = [DEFAULT_PET_SKIN_ID];

export function normalizeOwnedPetSkins(value: unknown, equippedSkinId: PetSkinId): PetSkinId[] {
	const storedIds = Array.isArray(value)
		? value.filter((id): id is PetSkinId => typeof id === "string" && isPetSkinId(id))
		: [];
	return [...new Set<PetSkinId>([...DEFAULT_OWNED_PET_SKINS, equippedSkinId, ...storedIds])];
}

export function getPetSkinPurchasePrice(skinId: PetSkinId, ownedSkinIds: readonly PetSkinId[]): number {
	return ownedSkinIds.includes(skinId) ? 0 : getPetSkin(skinId).price;
}
