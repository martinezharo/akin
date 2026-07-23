/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it } from "vitest";
import {
	DEFAULT_PET_CUSTOMIZATION,
	DEMO_PET_CUSTOMIZATION_STORAGE_KEY,
	getPetHair,
	getPetSkin,
	getPetSkinPurchasePrice,
	isPetHairId,
	isPetSkinId,
	loadGuestPetState,
	normalizeOwnedPetSkins,
	PET_HAIRS,
	PET_CUSTOMIZATION_STORAGE_KEY,
	PET_SKIN_IDS,
	PET_SKINS,
} from "./pet-customization";

beforeEach(() => localStorage.clear());

describe("pet customization catalog", () => {
	it("keeps the original Akin look as the default", () => {
		expect(DEFAULT_PET_CUSTOMIZATION).toEqual({ skinId: "ember", hairId: "honey" });
		expect(getPetSkin("ember").color).toBe("#E84B1B");
		expect(getPetHair("honey").color).toBe("#FFD382");
	});

	it("exposes valid ids and price information for the UI", () => {
		expect(PET_SKINS).toHaveLength(6);
		expect(PET_HAIRS).toHaveLength(5);
		expect(getPetSkin("sky").price).toBe(110);
		expect(isPetSkinId("plum")).toBe(true);
		expect(isPetSkinId("neon")).toBe(false);
		expect(isPetHairId("rose")).toBe(true);
		expect(isPetHairId("neon")).toBe(false);
	});

	it("keeps equipped legacy skins owned and never charges for switching back", () => {
		const ownedSkinIds = normalizeOwnedPetSkins(undefined, "plum");
		expect(ownedSkinIds).toEqual(["ember", "plum"]);
		expect(getPetSkinPurchasePrice("plum", ownedSkinIds)).toBe(0);
		expect(getPetSkinPurchasePrice("sky", ownedSkinIds)).toBe(110);
	});

	it("compensates storage from the ownership-less version", () => {
		localStorage.setItem(PET_CUSTOMIZATION_STORAGE_KEY, JSON.stringify({ skinId: "plum", hairId: "honey", coins: 12 }));
		expect(loadGuestPetState().ownedSkinIds).toEqual(PET_SKIN_IDS);
	});

	it("keeps demo customization separate from guest customization", () => {
		localStorage.setItem(PET_CUSTOMIZATION_STORAGE_KEY, JSON.stringify({ skinId: "plum", hairId: "honey", ownedSkinIds: ["ember", "plum"] }));
		localStorage.setItem(DEMO_PET_CUSTOMIZATION_STORAGE_KEY, JSON.stringify({ skinId: "sky", hairId: "rose", ownedSkinIds: ["ember", "sky"] }));

		expect(loadGuestPetState()).toMatchObject({ skinId: "plum", hairId: "honey" });
		expect(loadGuestPetState(DEMO_PET_CUSTOMIZATION_STORAGE_KEY)).toMatchObject({ skinId: "sky", hairId: "rose" });
	});
});
