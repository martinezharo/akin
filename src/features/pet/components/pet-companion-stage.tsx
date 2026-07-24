"use client";

import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import { ui } from "@/i18n/en";
import motionStyles from "@/shared/ui/akin-mascot-motion.module.css";
import styles from "../pet-page.module.css";

const PETTING_MESSAGES = [...ui.pet.stage.messages];
const PETTING_REACTION_DURATION = 780;
const PETTING_MESSAGE_DURATION = 2200;
const POINTER_PET_INTERVAL = 900;

export function PetCompanionStage({ skinColor, hairColor }: { skinColor: string; hairColor: string }) {
	const [petting, setPetting] = useState(false);
	const [pettingSequence, setPettingSequence] = useState(0);
	const [showPettingMessage, setShowPettingMessage] = useState(false);
	const [pettingMessage, setPettingMessage] = useState(PETTING_MESSAGES[0]);
	const pettingTimer = useRef<number | undefined>(undefined);
	const pettingMessageTimer = useRef<number | undefined>(undefined);
	const lastPointerPetAt = useRef(Number.NEGATIVE_INFINITY);

	useEffect(() => () => {
		window.clearTimeout(pettingTimer.current);
		window.clearTimeout(pettingMessageTimer.current);
	}, []);

	function playPetReaction() {
		window.clearTimeout(pettingTimer.current);
		setPettingSequence((sequence) => sequence + 1);
		setPetting(true);
		pettingTimer.current = window.setTimeout(() => setPetting(false), PETTING_REACTION_DURATION);
	}

	function petCompanion(event?: PointerEvent<HTMLButtonElement>) {
		if (event) event.currentTarget.setPointerCapture?.(event.pointerId);
		playPetReaction();
		window.clearTimeout(pettingMessageTimer.current);
		setPettingMessage(PETTING_MESSAGES[Math.floor(Math.random() * PETTING_MESSAGES.length)]);
		setShowPettingMessage(true);
		pettingMessageTimer.current = window.setTimeout(() => setShowPettingMessage(false), PETTING_MESSAGE_DURATION);
	}

	function petWithPointerMovement(event: PointerEvent<HTMLButtonElement>) {
		if (event.pointerType !== "mouse") return;
		const now = window.performance.now();
		if (now - lastPointerPetAt.current < POINTER_PET_INTERVAL) return;
		lastPointerPetAt.current = now;
		playPetReaction();
	}

	const previewStyle = {
		"--akin-skin-color": skinColor,
		"--akin-hair-color": hairColor,
	} as CSSProperties;

	return (
		<section className={styles.stage} style={previewStyle} aria-label={ui.pet.stage.label}>
			<div className={styles.orbit} aria-hidden="true" data-active={petting || undefined} />
			<button
				className={`${styles.petButton} ${motionStyles.interactive}`}
				type="button"
				onPointerDown={petCompanion}
				onPointerMove={petWithPointerMovement}
				onClick={(event) => { if (event.detail === 0) petCompanion(); }}
				data-interacting={petting || undefined}
				data-pointer-motion="true"
				aria-label={ui.pet.stage.petButton}
			>
				<AkinMascotArtwork key={pettingSequence} className={`${styles.petArtwork} ${motionStyles.animated}`} />
				<span className={styles.petShadow} aria-hidden="true" />
			</button>
			<div className={styles.speech} data-visible={showPettingMessage || undefined} aria-live="polite">
				{pettingMessage}
			</div>
		</section>
	);
}
