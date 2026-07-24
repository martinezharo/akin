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

export const DEMO_PET_CUSTOMIZATION_STORAGE_KEY = "akin.demo-pet-customization.v1";

function createFallbackState(): StoredPetCustomization {
	return {
		...DEFAULT_PET_CUSTOMIZATION,
		ownedSkinIds: [...DEFAULT_OWNED_PET_SKINS],
	};
}

export function loadDemoPetState(): StoredPetCustomization {
	const fallback = createFallbackState();
	try {
		const stored = JSON.parse(
			localStorage.getItem(DEMO_PET_CUSTOMIZATION_STORAGE_KEY) || "null",
		) as Partial<StoredPetCustomization> | null;
		if (!stored) return fallback;
		const skinId = typeof stored.skinId === "string" && isPetSkinId(stored.skinId)
			? stored.skinId
			: fallback.skinId;
		const hairId = typeof stored.hairId === "string" && isPetHairId(stored.hairId)
			? stored.hairId
			: fallback.hairId;
		return {
			skinId,
			hairId,
			// The first demo implementation did not persist ownership. Existing
			// demo profiles retain the full catalog so they are not charged again.
			ownedSkinIds: stored.ownedSkinIds === undefined
				? [...PET_SKIN_IDS]
				: normalizeOwnedPetSkins(stored.ownedSkinIds, skinId),
		};
	} catch {
		return fallback;
	}
}

export function saveDemoPetState(state: StoredPetCustomization) {
	try {
		localStorage.setItem(DEMO_PET_CUSTOMIZATION_STORAGE_KEY, JSON.stringify(state));
	} catch {
		// The demo pet remains usable for this session when storage is unavailable.
	}
}
