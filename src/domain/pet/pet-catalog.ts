export const PET_SKINS = [
	{ id: "ember", color: "#E84B1B", price: 0 },
	{ id: "cinnamon", color: "#C85A3A", price: 35 },
	{ id: "moss", color: "#698260", price: 55 },
	{ id: "berry", color: "#D86178", price: 75 },
	{ id: "plum", color: "#866B96", price: 90 },
	{ id: "sky", color: "#5F91B2", price: 110 },
] as const;

export const PET_HAIRS = [
	{ id: "honey", color: "#FFD382" },
	{ id: "cream", color: "#F3D2A2" },
	{ id: "mint", color: "#A9D7B6" },
	{ id: "lilac", color: "#C7A9E0" },
	{ id: "rose", color: "#F29A91" },
] as const;

export type PetSkinId = (typeof PET_SKINS)[number]["id"];
export type PetHairId = (typeof PET_HAIRS)[number]["id"];

export const DEFAULT_PET_SKIN_ID: PetSkinId = PET_SKINS[0].id;
export const DEFAULT_PET_HAIR_ID: PetHairId = PET_HAIRS[0].id;
export const PET_SKIN_IDS = PET_SKINS.map((skin) => skin.id) as PetSkinId[];
export const PET_HAIR_IDS = PET_HAIRS.map((hair) => hair.id) as PetHairId[];
export const PET_SKIN_PRICES = Object.fromEntries(
	PET_SKINS.map((skin) => [skin.id, skin.price]),
) as Record<PetSkinId, number>;

export function isPetSkinId(value: string): value is PetSkinId {
	return PET_SKIN_IDS.includes(value as PetSkinId);
}

export function isPetHairId(value: string): value is PetHairId {
	return PET_HAIR_IDS.includes(value as PetHairId);
}

export function getPetSkin(skinId: string) {
	return PET_SKINS.find((skin) => skin.id === skinId) ?? PET_SKINS[0];
}

export function getPetHair(hairId: string) {
	return PET_HAIRS.find((hair) => hair.id === hairId) ?? PET_HAIRS[0];
}
