import {
	DEFAULT_OWNED_PET_SKINS,
	DEFAULT_PET_CUSTOMIZATION,
	normalizeOwnedPetSkins,
	type StoredPetCustomization,
} from "@/domain/pet/pet-customization";
import {
	isPetHairId,
	isPetSkinId,
	PET_SKIN_IDS,
} from "@/domain/pet/pet-catalog";

export const PET_CUSTOMIZATION_STORAGE_KEY = "akin.pet-customization.v1";
export const DEMO_PET_CUSTOMIZATION_STORAGE_KEY = "akin.demo-pet-customization.v1";

function createFallbackState(): StoredPetCustomization {
	return {
		...DEFAULT_PET_CUSTOMIZATION,
		ownedSkinIds: [...DEFAULT_OWNED_PET_SKINS],
	};
}

export function loadGuestPetState(
	storageKey = PET_CUSTOMIZATION_STORAGE_KEY,
): StoredPetCustomization {
	const fallback = createFallbackState();
	try {
		const stored = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<StoredPetCustomization> | null;
		if (!stored) return fallback;
		const storedSkinId = stored.skinId;
		const storedHairId = stored.hairId;
		const skinId = typeof storedSkinId === "string" && isPetSkinId(storedSkinId) ? storedSkinId : fallback.skinId;
		const hairId = typeof storedHairId === "string" && isPetHairId(storedHairId) ? storedHairId : fallback.hairId;
		return {
			skinId,
			hairId,
			// The first implementation did not persist ownership. Existing local
			// profiles receive the current catalog once so nothing is charged twice.
			ownedSkinIds: stored.ownedSkinIds === undefined
				? [...PET_SKIN_IDS]
				: normalizeOwnedPetSkins(stored.ownedSkinIds, skinId),
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
