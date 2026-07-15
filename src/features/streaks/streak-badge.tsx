import styles from "./streak-badge.module.css";

export type StreakBadgeTier = "glass" | "silver" | "fire" | "god";

const SILVER_STREAK_MIN_DAYS = 10;
const FIRE_STREAK_MIN_DAYS = 100;
const GOD_STREAK_MIN_DAYS = 1000;

const tierClassNames: Record<StreakBadgeTier, string> = {
	glass: styles.glass,
	silver: styles.silver,
	fire: styles.fire,
	god: styles.god,
};

const streakCountFormatter = new Intl.NumberFormat("es-ES");

export function getStreakBadgeTier(days: number): StreakBadgeTier {
	if (days >= GOD_STREAK_MIN_DAYS) return "god";
	if (days >= FIRE_STREAK_MIN_DAYS) return "fire";
	if (days >= SILVER_STREAK_MIN_DAYS) return "silver";
	return "glass";
}

export function StreakBadge({ days, ariaLabel }: { days: number; ariaLabel: string }) {
	const tier = getStreakBadgeTier(days);

	return (
		<span
			className={`${styles.badge} ${tierClassNames[tier]}`}
			data-tier={tier}
			aria-label={ariaLabel}
		>
			<span className={styles.value}>{streakCountFormatter.format(days)}</span>
		</span>
	);
}
