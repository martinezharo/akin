export const PET_CUSTOMIZATION_STORAGE_KEY = "akin.pet-customization.v1";

export const PET_SKINS = [
	{ id: "ember", name: "Ember", color: "#E84B1B", shadow: "#B93312", price: 0 },
	{ id: "cinnamon", name: "Cinnamon", color: "#C85A3A", shadow: "#8E3524", price: 35 },
	{ id: "moss", name: "Moss", color: "#698260", shadow: "#465C43", price: 55 },
	{ id: "berry", name: "Berry", color: "#D86178", shadow: "#9F3E58", price: 75 },
	{ id: "plum", name: "Plum", color: "#866B96", shadow: "#60466F", price: 90 },
	{ id: "sky", name: "Sky", color: "#5F91B2", shadow: "#3D6886", price: 110 },
] as const;

export const PET_HAIRS = [
	{ id: "honey", name: "Honey", color: "#FFD382" },
	{ id: "cream", name: "Cream", color: "#F3D2A2" },
	{ id: "mint", name: "Mint", color: "#A9D7B6" },
	{ id: "lilac", name: "Lilac", color: "#C7A9E0" },
	{ id: "rose", name: "Rose", color: "#F29A91" },
] as const;

export type PetSkinId = (typeof PET_SKINS)[number]["id"];
export type PetHairId = (typeof PET_HAIRS)[number]["id"];
export const PET_SKIN_IDS = PET_SKINS.map((skin) => skin.id) as PetSkinId[];

export type PetCustomization = {
	skinId: PetSkinId;
	hairId: PetHairId;
};

export type StoredPetCustomization = PetCustomization & {
	ownedSkinIds: PetSkinId[];
};

export const DEFAULT_PET_CUSTOMIZATION: PetCustomization = {
	skinId: "ember",
	hairId: "honey",
};

export const DEFAULT_OWNED_PET_SKINS: PetSkinId[] = ["ember"];

export function getPetSkin(skinId: string) {
	return PET_SKINS.find((skin) => skin.id === skinId) ?? PET_SKINS[0];
}

export function getPetHair(hairId: string) {
	return PET_HAIRS.find((hair) => hair.id === hairId) ?? PET_HAIRS[0];
}

export function isPetSkinId(value: string): value is PetSkinId {
	return PET_SKINS.some((skin) => skin.id === value);
}

export function isPetHairId(value: string): value is PetHairId {
	return PET_HAIRS.some((hair) => hair.id === value);
}

export function normalizeOwnedPetSkins(value: unknown, equippedSkinId: PetSkinId): PetSkinId[] {
	const storedIds = Array.isArray(value) ? value.filter((id): id is PetSkinId => typeof id === "string" && isPetSkinId(id)) : [];
	return [...new Set<PetSkinId>([...DEFAULT_OWNED_PET_SKINS, equippedSkinId, ...storedIds])];
}

export function getPetSkinPurchasePrice(skinId: PetSkinId, ownedSkinIds: readonly PetSkinId[]): number {
	return ownedSkinIds.includes(skinId) ? 0 : getPetSkin(skinId).price;
}

export function loadGuestPetState(): StoredPetCustomization {
	const fallback: StoredPetCustomization = { ...DEFAULT_PET_CUSTOMIZATION, ownedSkinIds: DEFAULT_OWNED_PET_SKINS };
	try {
		const stored = JSON.parse(localStorage.getItem(PET_CUSTOMIZATION_STORAGE_KEY) || "null") as Partial<StoredPetCustomization> | null;
		if (!stored) return fallback;
		const skinId = isPetSkinId(stored.skinId ?? "") ? stored.skinId : fallback.skinId;
		const hairId = isPetHairId(stored.hairId ?? "") ? stored.hairId : fallback.hairId;
		return {
			skinId: skinId!,
			hairId: hairId!,
			// The first implementation did not persist ownership. Existing local
			// profiles receive the current catalog once so nothing is charged twice.
			ownedSkinIds: stored.ownedSkinIds === undefined
				? [...PET_SKIN_IDS]
				: normalizeOwnedPetSkins(stored.ownedSkinIds, skinId!),
		};
	} catch {
		return fallback;
	}
}

export function saveGuestPetState(state: StoredPetCustomization) {
	try {
		localStorage.setItem(PET_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// The pet remains usable for this session when storage is unavailable.
	}
}
