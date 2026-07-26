"use client";

import type { CSSProperties } from "react";
import { usePetting } from "@/features/pet/model/use-petting";
import { ui } from "@/i18n";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import motionStyles from "@/shared/ui/akin-mascot-motion.module.css";
import styles from "./pettable-mascot.module.css";

/**
 * A capybara you can poke, on the landing. It runs the app's own petting
 * reaction, so the trick a visitor stumbles on out here is the one waiting for
 * them inside — right down to the things it says.
 */
export function PettableMascot({
	className,
	frameClassName,
	artworkClassName,
	viewBox,
	style,
	speechPlacement = "left",
}: {
	className?: string;
	/** Styles the button itself — use it when the mascot sits in a cropped frame. */
	frameClassName?: string;
	artworkClassName?: string;
	viewBox?: string;
	style?: CSSProperties;
	/** Which side the bubble pops out on, so it never leaves the section. */
	speechPlacement?: "left" | "right";
}) {
	const petting = usePetting();

	return (
		<span className={className ? `${styles.mascot} ${className}` : styles.mascot}>
			<button
				className={[styles.button, motionStyles.interactive, frameClassName].filter(Boolean).join(" ")}
				type="button"
				aria-label={ui.pet.stage.petButton}
				{...petting.buttonProps}
			>
				<AkinMascotArtwork
					key={petting.sequence}
					className={[styles.artwork, motionStyles.animated, artworkClassName].filter(Boolean).join(" ")}
					viewBox={viewBox}
					style={style}
				/>
			</button>
			<span
				className={styles.speech}
				data-visible={petting.isMessageVisible || undefined}
				data-placement={speechPlacement}
				aria-live="polite"
			>
				{petting.message}
			</span>
		</span>
	);
}
