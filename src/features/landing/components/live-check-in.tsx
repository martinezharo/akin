"use client";

import { Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { StreakBadge } from "@/features/streaks/components/badge/streak-badge";
import { DEMO_PROMISES } from "@/features/streaks/model/demo-promises";
import { ui } from "@/i18n/en";
import styles from "./live-check-in.module.css";

const CELEBRATION_MS = 900;

/**
 * The landing's one interactive thing, and the whole pitch in a single gesture:
 * the visitor keeps a promise before they have an account.
 *
 * It is not a picture of the app — it mounts the real `StreakBadge`, so the
 * count, the tiers and the completion burst are the ones the product ships and
 * cannot drift away from them.
 */
export function LiveCheckIn({ className }: { className?: string }) {
	const [keptIds, setKeptIds] = useState<readonly string[]>([]);
	const [celebratingId, setCelebratingId] = useState<string | null>(null);

	useEffect(() => {
		if (!celebratingId) return;

		const timeout = setTimeout(() => setCelebratingId(null), CELEBRATION_MS);
		return () => clearTimeout(timeout);
	}, [celebratingId]);

	function keep(promiseId: string) {
		setCelebratingId(promiseId);
		setKeptIds((current) => (current.includes(promiseId) ? current : [...current, promiseId]));
	}

	const coins = keptIds.length;
	const left = DEMO_PROMISES.length - coins;
	const note =
		coins === 0
			? ui.landing.checkIn.prompt
			: left > 0
				? ui.landing.checkIn.midway(left)
				: ui.landing.checkIn.done;

	return (
		<div className={className ? `${styles.card} ${className}` : styles.card}>
			<header className={styles.head}>
				<span className={styles.label}>{ui.landing.checkIn.label}</span>
				<span className={styles.wallet} aria-label={ui.landing.checkIn.walletLabel}>
					<Coins aria-hidden="true" />
					<strong key={coins}>{coins}</strong>
				</span>
			</header>

			<ul className={styles.list}>
				{DEMO_PROMISES.map((promise) => {
					const kept = keptIds.includes(promise.id);
					// Keeping a promise is what advances the count, so the badge shows
					// tomorrow's number the moment it is tapped — exactly as in the app.
					const days = kept ? promise.days + 1 : promise.days;

					return (
						<li className={styles.row} key={promise.id}>
							<span className={styles.icon} aria-hidden="true">{promise.icon}</span>
							<span className={styles.name}>{promise.name}</span>
							<StreakBadge
								days={days}
								ariaLabel={ui.streaks.currentCountLabel(days)}
								completed={kept}
								celebrating={celebratingId === promise.id}
								completeLabel={ui.streaks.completeToday(promise.name, days)}
								completedLabel={ui.streaks.completedToday(promise.name, days)}
								onComplete={() => keep(promise.id)}
							/>
						</li>
					);
				})}
			</ul>

			<p className={styles.note} data-complete={coins === DEMO_PROMISES.length} aria-live="polite">
				{note}
			</p>
		</div>
	);
}
