import type { CSSProperties } from "react";
import { getPetHair, getPetSkin } from "@/domain/pet/pet-catalog";

/**
 * The two custom properties `AkinMascotArtwork` paints itself from.
 *
 * Worth going through here rather than setting the variables by hand: the app
 * publishes the signed-in visitor's own colours onto a wrapper near the root,
 * so any mascot that does not state its look inherits whatever skin that
 * particular person happens to have bought.
 */
export function petLookStyle(skinId: string, hairId: string): CSSProperties {
	return {
		"--akin-skin-color": getPetSkin(skinId).color,
		"--akin-hair-color": getPetHair(hairId).color,
	} as CSSProperties;
}
