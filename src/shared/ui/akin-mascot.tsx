"use client";

import { useRef } from "react";
import { AkinMascotArtwork } from "./akin-mascot-artwork";
import styles from "./akin-mascot.module.css";

const EAR_FLICK_DURATION = 560;
const EAR_FLICK_PAUSE = 180;
const EYE_CLOSE_DURATION = 1800;

const EAR_FLICK_TOTAL_DURATION = EAR_FLICK_DURATION * 2 + EAR_FLICK_PAUSE;

const EAR_FLICK_STEPS = [
	{ progress: 0, rotation: 0 },
	{ progress: 0.14, rotation: 1 },
	{ progress: 0.3, rotation: -0.38 },
	{ progress: 0.46, rotation: 0.9 },
	{ progress: 0.62, rotation: -0.28 },
	{ progress: 0.77, rotation: 0.62 },
	{ progress: 1, rotation: 0 },
] as const;

function animateEar(ear: SVGElement, outwardRotation: number) {
	const createFlick = (startTime: number) => EAR_FLICK_STEPS.map(({ progress, rotation }) => ({
		transform: `rotate(${outwardRotation * rotation}deg)`,
		offset: (startTime + progress * EAR_FLICK_DURATION) / EAR_FLICK_TOTAL_DURATION,
		easing: "cubic-bezier(.36, 0, .2, 1)",
	}));

	return ear.animate(
		[
			...createFlick(0),
			...createFlick(EAR_FLICK_DURATION + EAR_FLICK_PAUSE),
		],
		{
			duration: EAR_FLICK_TOTAL_DURATION,
			easing: "linear",
		},
	);
}

function animateEye(eye: SVGElement) {
	return eye.animate(
		[
			{ transform: "scaleY(1)", offset: 0 },
			{ transform: "scaleY(0.06)", offset: 0.12 },
			{ transform: "scaleY(0.06)", offset: 0.78 },
			{ transform: "scaleY(1)", offset: 1 },
		],
		{
			duration: EYE_CLOSE_DURATION,
			easing: "cubic-bezier(.36, 0, .2, 1)",
		},
	);
}

export function AkinMascot() {
	const mascotRef = useRef<HTMLButtonElement>(null);
	const clickAnimationsRef = useRef<Animation[]>([]);

	function reactToTouch() {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const leftEar = mascotRef.current?.querySelector<SVGElement>(".akin-ear-left");
		const rightEar = mascotRef.current?.querySelector<SVGElement>(".akin-ear-right");
		const eyes = mascotRef.current?.querySelectorAll<SVGElement>(".akin-eye");
		if (!leftEar || !rightEar || !eyes?.length) return;

		for (const animation of clickAnimationsRef.current) animation.cancel();
		clickAnimationsRef.current = [
			animateEar(leftEar, -17),
			animateEar(rightEar, 17),
			...Array.from(eyes, animateEye),
		];
	}

	return (
		<button
			ref={mascotRef}
			className={styles.mascot}
			type="button"
			aria-label="Make Akin wiggle its ears"
			onClick={reactToTouch}
		>
			<AkinMascotArtwork className={styles.artwork} />
		</button>
	);
}
