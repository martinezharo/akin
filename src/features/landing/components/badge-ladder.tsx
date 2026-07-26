import type { CSSProperties } from "react";
import { STREAK_BADGE_TIERS, StreakBadge } from "@/features/streaks/components/badge/streak-badge";
import { ui } from "@/i18n";
import styles from "./badge-ladder.module.css";

/**
 * The badge materials side by side, each shown at the count that unlocks it.
 *
 * Both halves come from the app: the badges are the real component, and the
 * counts are the real thresholds. Nothing here restates a number, so the ladder
 * cannot end up advertising a tier the app stopped handing out.
 */
export function BadgeLadder() {
	return (
		<ol className={styles.ladder}>
			{STREAK_BADGE_TIERS.map(({ tier, minDays }, index) => {
				const copy = ui.landing.ladder.tiers[tier];

				return (
					<li className={styles.step} key={tier} style={{ "--step": index } as CSSProperties}>
						<span className={styles.stage}>
							<StreakBadge days={minDays} ariaLabel={ui.landing.ladder.tierLabel(copy.name, minDays)} />
						</span>
						<strong className={styles.name}>{copy.name}</strong>
						<span className={styles.note}>{copy.note}</span>
					</li>
				);
			})}
		</ol>
	);
}
