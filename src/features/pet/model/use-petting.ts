"use client";

import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { ui } from "@/i18n";

const PETTING_REACTION_DURATION = 780;
const PETTING_MESSAGE_DURATION = 2200;
/** A mouse dragged across the companion keeps petting it, but not frantically. */
const POINTER_PET_INTERVAL = 900;

/** Spread onto the button that wraps the mascot. */
export type PettingButtonProps = {
	onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
	onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
	onClick: (event: MouseEvent<HTMLButtonElement>) => void;
	"data-interacting": true | undefined;
	"data-pointer-motion": "true";
};

export type Petting = {
	/** Re-key the artwork with this so the reaction replays on every pet. */
	sequence: number;
	message: string;
	isMessageVisible: boolean;
	buttonProps: PettingButtonProps;
};

/**
 * The companion's reaction to being touched: a squash, a restarted idle loop
 * and something pleased to say.
 *
 * The behaviour lives here rather than in the pet page because the landing pets
 * the same capybara, and a visitor who discovers the trick on the front page
 * should find the identical one waiting inside the app.
 *
 * Callers own the chrome — the orbit, the shadow, where the speech bubble sits
 * — since that differs per surface. Only the reaction is shared.
 */
export function usePetting(): Petting {
	const pettingMessages = ui.pet.stage.messages;
	const [petting, setPetting] = useState(false);
	const [sequence, setSequence] = useState(0);
	const [message, setMessage] = useState(pettingMessages[0]);
	const [isMessageVisible, setIsMessageVisible] = useState(false);
	const reactionTimer = useRef<number | undefined>(undefined);
	const messageTimer = useRef<number | undefined>(undefined);
	const lastPointerPetAt = useRef(Number.NEGATIVE_INFINITY);

	useEffect(() => () => {
		window.clearTimeout(reactionTimer.current);
		window.clearTimeout(messageTimer.current);
	}, []);

	function playReaction() {
		window.clearTimeout(reactionTimer.current);
		setSequence((current) => current + 1);
		setPetting(true);
		reactionTimer.current = window.setTimeout(() => setPetting(false), PETTING_REACTION_DURATION);
	}

	function pet(event?: PointerEvent<HTMLButtonElement>) {
		// Capturing the pointer keeps the reaction alive if the finger slides off.
		if (event) event.currentTarget.setPointerCapture?.(event.pointerId);
		playReaction();
		window.clearTimeout(messageTimer.current);
		setMessage(pettingMessages[Math.floor(Math.random() * pettingMessages.length)]);
		setIsMessageVisible(true);
		messageTimer.current = window.setTimeout(() => setIsMessageVisible(false), PETTING_MESSAGE_DURATION);
	}

	function petWithPointerMovement(event: PointerEvent<HTMLButtonElement>) {
		if (event.pointerType !== "mouse") return;
		const now = window.performance.now();
		if (now - lastPointerPetAt.current < POINTER_PET_INTERVAL) return;
		lastPointerPetAt.current = now;
		playReaction();
	}

	return {
		sequence,
		message,
		isMessageVisible,
		buttonProps: {
			onPointerDown: pet,
			onPointerMove: petWithPointerMovement,
			// Keyboard activation reports no clicks, so it is the one case that
			// pointerdown never covered.
			onClick: (event) => { if (event.detail === 0) pet(); },
			"data-interacting": petting || undefined,
			"data-pointer-motion": "true",
		},
	};
}
