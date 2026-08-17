"use client";

import { Check, Coins } from "lucide-react";
import { useState, type CSSProperties } from "react";
import {
	DEFAULT_PET_HAIR_ID,
	DEFAULT_PET_SKIN_ID,
	getPetSkin,
	PET_SKINS,
	type PetSkinId,
} from "@/domain/pet/pet-catalog";
import { ui } from "@/i18n";
import { petLookStyle } from "@/shared/ui/pet-look";
import { PettableMascot } from "./pettable-mascot";
import styles from "./companion-preview.module.css";

/**
 * The wardrobe, wired up. Visitors get the real thing the studio does — pick a
 * colour, watch the capybara change — because reading that coins buy looks is
 * far less convincing than spending ten seconds trying them on.
 *
 * Prices come from the catalog the studio actually sells from, so the landing
 * cannot quote a number the app no longer charges.
 */
export function CompanionPreview() {
	const [skinId, setSkinId] = useState<PetSkinId>(DEFAULT_PET_SKIN_ID);
	const skin = getPetSkin(skinId);
	const skinName = ui.pet.skinNames[skin.id];

	return (
		<div className={styles.companion} style={petLookStyle(skinId, DEFAULT_PET_HAIR_ID)}>
			<PettableMascot
				className={styles.portrait}
				frameClassName={styles.stage}
				artworkClassName={styles.mascot}
				viewBox="400 900 4216 3216"
				speechPlacement="right"
			/>

			<p className={styles.current} aria-live="polite">{skinName}</p>

			<ul className={styles.swatches} aria-label={ui.landing.companion.swatchesLabel}>
				{PET_SKINS.map((option) => {
					const worn = option.id === skinId;

					return (
						<li key={option.id} style={{ "--swatch": option.color } as CSSProperties}>
							<button
								className={styles.swatch}
								type="button"
								aria-pressed={worn}
								aria-label={`${ui.landing.companion.tryLabel(ui.pet.skinNames[option.id])} — ${option.price === 0 ? ui.pet.colorRail.ownedLabel : option.price}`}
								onClick={() => setSkinId(option.id)}
							>
								<span className={styles.chip} aria-hidden="true">
									{worn ? <Check /> : null}
								</span>
								<span className={styles.price}>
									{option.price === 0 ? (
										ui.pet.colorRail.ownedLabel
									) : (
										<>
											<Coins aria-hidden="true" />
											{option.price}
										</>
									)}
								</span>
							</button>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
