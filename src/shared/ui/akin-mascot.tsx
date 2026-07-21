"use client";

import { useRef } from "react";
import { AkinMascotArtwork } from "./akin-mascot-artwork";
import styles from "./akin-mascot.module.css";

const EAR_FLICK_DURATION = 500;

function animateEar(ear: SVGElement, outwardRotation: number) {
	return ear.animate(
		[
			{ transform: "rotate(0deg)", offset: 0 },
			{ transform: `rotate(${outwardRotation}deg)`, offset: 0.24 },
			{ transform: `rotate(${-outwardRotation / 3}deg)`, offset: 0.46 },
			{ transform: `rotate(${outwardRotation}deg)`, offset: 0.66 },
			{ transform: "rotate(0deg)", offset: 1 },
		],
		{
			duration: EAR_FLICK_DURATION,
			easing: "cubic-bezier(.36, 0, .2, 1)",
		},
	);
}

export function AkinMascot() {
	const mascotRef = useRef<HTMLButtonElement>(null);
	const clickAnimationsRef = useRef<Animation[]>([]);

	function flickEars() {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		const leftEar = mascotRef.current?.querySelector<SVGElement>(".akin-ear-left");
		const rightEar = mascotRef.current?.querySelector<SVGElement>(".akin-ear-right");
		if (!leftEar || !rightEar) return;

		for (const animation of clickAnimationsRef.current) animation.cancel();
		clickAnimationsRef.current = [animateEar(leftEar, -9), animateEar(rightEar, 9)];
	}

	return (
		<button
			ref={mascotRef}
			className={styles.mascot}
			type="button"
			aria-label="Make Akin wiggle its ears"
			onClick={flickEars}
		>
			<AkinMascotArtwork className={styles.artwork} />
		</button>
	);
}
