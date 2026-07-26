"use client";

import type { CSSProperties } from "react";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import { ui } from "@/i18n";
import motionStyles from "@/shared/ui/akin-mascot-motion.module.css";
import { usePetting } from "../model/use-petting";
import styles from "../pet-page.module.css";

export function PetCompanionStage({ skinColor, hairColor }: { skinColor: string; hairColor: string }) {
	const petting = usePetting();
	const previewStyle = {
		"--akin-skin-color": skinColor,
		"--akin-hair-color": hairColor,
	} as CSSProperties;

	return (
		<section className={styles.stage} style={previewStyle} aria-label={ui.pet.stage.label}>
			<div className={styles.orbit} aria-hidden="true" data-active={petting.buttonProps["data-interacting"]} />
			<button
				className={`${styles.petButton} ${motionStyles.interactive}`}
				type="button"
				aria-label={ui.pet.stage.petButton}
				{...petting.buttonProps}
			>
				<AkinMascotArtwork
					key={petting.sequence}
					className={`${styles.petArtwork} ${motionStyles.animated}`}
				/>
				<span className={styles.petShadow} aria-hidden="true" />
			</button>
			<div className={styles.speech} data-visible={petting.isMessageVisible || undefined} aria-live="polite">
				{petting.message}
			</div>
		</section>
	);
}
