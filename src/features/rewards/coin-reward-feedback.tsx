"use client";

import { Coins } from "lucide-react";
import { type CSSProperties, useEffect, useLayoutEffect, useState } from "react";
import type { CoinReward } from "./coin-reward";
import { ui } from "@/i18n";
import { playRewardSound, warmRewardSound } from "./reward-sound-preference";
import styles from "./coin-reward-feedback.module.css";

type Point = { x: number; y: number };
type Flight = { reward: CoinReward; from: Point; to: Point };

function centerOf(element: Element): Point {
	const box = element.getBoundingClientRect();
	return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

export function CoinRewardFeedback({ reward }: { reward: CoinReward | null }) {
	const [flight, setFlight] = useState<Flight | null>(null);

	useEffect(() => {
		warmRewardSound();
	}, []);

	useLayoutEffect(() => {
		if (!reward) return;
		const origin = reward.streakId
			? document.querySelector(`[data-streak-id="${CSS.escape(reward.streakId)}"]`)
			: null;
		const wallet = document.querySelector("[data-coin-wallet]");
		const nextFlight = {
			reward,
			from: origin ? centerOf(origin) : { x: window.innerWidth / 2, y: window.innerHeight * 0.68 },
			to: wallet ? centerOf(wallet) : { x: window.innerWidth - 80, y: 55 },
		};
		const frame = window.requestAnimationFrame(() => setFlight(nextFlight));
		if (navigator.vibrate) navigator.vibrate(12);
		playRewardSound();
		return () => window.cancelAnimationFrame(frame);
	}, [reward]);

	useEffect(() => {
		if (!flight) return;
		const timeout = window.setTimeout(() => setFlight(null), 1050);
		return () => window.clearTimeout(timeout);
	}, [flight]);

	if (!flight) return null;

	const style = {
		"--coin-from-x": `${flight.from.x}px`,
		"--coin-from-y": `${flight.from.y}px`,
		"--coin-to-x": `${flight.to.x}px`,
		"--coin-to-y": `${flight.to.y}px`,
	} as CSSProperties;

	return (
		<div className={styles.layer} aria-live="polite" aria-atomic="true" style={style}>
			<span className={styles.announcement}>{ui.rewards.coinsEarned(flight.reward.amount)}</span>
			<div className={styles.gain} aria-hidden="true">+{flight.reward.amount}</div>
			{[0, 1, 2].map((coin) => (
				<span className={styles.coin} data-coin={coin} key={coin} aria-hidden="true"><Coins /></span>
			))}
		</div>
	);
}
