import {
	DEFAULT_PET_HAIR_ID,
	DEFAULT_PET_SKIN_ID,
	isPetHairId,
	isPetSkinId,
	PET_HAIRS,
	PET_SKIN_IDS,
	PET_SKINS,
	type PetHairId,
	type PetSkinId,
} from "@convex/lib/app-rules";

export {
	PET_HAIRS,
	PET_SKIN_IDS,
	PET_SKINS,
	type PetHairId,
	type PetSkinId,
} from "@convex/lib/app-rules";

export const PET_CUSTOMIZATION_STORAGE_KEY = "akin.pet-customization.v1";
export const DEMO_PET_CUSTOMIZATION_STORAGE_KEY = "akin.demo-pet-customization.v1";

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

export function getPetSkin(skinId: string) {
	return PET_SKINS.find((skin) => skin.id === skinId) ?? PET_SKINS[0];
}

export function getPetHair(hairId: string) {
	return PET_HAIRS.find((hair) => hair.id === hairId) ?? PET_HAIRS[0];
}

export { isPetHairId, isPetSkinId };

export function normalizeOwnedPetSkins(value: unknown, equippedSkinId: PetSkinId): PetSkinId[] {
	const storedIds = Array.isArray(value) ? value.filter((id): id is PetSkinId => typeof id === "string" && isPetSkinId(id)) : [];
	return [...new Set<PetSkinId>([...DEFAULT_OWNED_PET_SKINS, equippedSkinId, ...storedIds])];
}

export function getPetSkinPurchasePrice(skinId: PetSkinId, ownedSkinIds: readonly PetSkinId[]): number {
	return ownedSkinIds.includes(skinId) ? 0 : getPetSkin(skinId).price;
}

export function loadGuestPetState(
	storageKey = PET_CUSTOMIZATION_STORAGE_KEY,
): StoredPetCustomization {
	const fallback: StoredPetCustomization = { ...DEFAULT_PET_CUSTOMIZATION, ownedSkinIds: DEFAULT_OWNED_PET_SKINS };
	try {
		const stored = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<StoredPetCustomization> | null;
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

export function saveGuestPetState(
	state: StoredPetCustomization,
	storageKey = PET_CUSTOMIZATION_STORAGE_KEY,
) {
	try {
		localStorage.setItem(storageKey, JSON.stringify(state));
	} catch {
		// The pet remains usable for this session when storage is unavailable.
	}
}
