import { Check } from "lucide-react";
import styles from "./streak-badge.module.css";
import { getLocale } from "@/i18n";

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

/**
 * The tiers in the order a streak earns them, with the count that unlocks each.
 * Anything advertising the ladder reads it from here rather than restating the
 * numbers, so moving a threshold moves every claim made about it.
 */
export const STREAK_BADGE_TIERS = [
	{ tier: "glass", minDays: 1 },
	{ tier: "silver", minDays: SILVER_STREAK_MIN_DAYS },
	{ tier: "fire", minDays: FIRE_STREAK_MIN_DAYS },
	{ tier: "god", minDays: GOD_STREAK_MIN_DAYS },
] as const satisfies readonly { tier: StreakBadgeTier; minDays: number }[];

const streakCountFormatters = new Map<string, Intl.NumberFormat>();

/** Cached per locale: the count has to follow whichever language is on screen. */
function formatStreakCount(days: number): string {
	const locale = getLocale();
	let formatter = streakCountFormatters.get(locale);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale);
		streakCountFormatters.set(locale, formatter);
	}
	return formatter.format(days);
}
const COMPLETION_BURST_RAYS = Array.from({ length: 8 }, (_, index) => index);

export function getStreakBadgeTier(days: number): StreakBadgeTier {
	if (days >= GOD_STREAK_MIN_DAYS) return "god";
	if (days >= FIRE_STREAK_MIN_DAYS) return "fire";
	if (days >= SILVER_STREAK_MIN_DAYS) return "silver";
	return "glass";
}

export function StreakBadge({
	days,
	ariaLabel,
	completed = false,
	celebrating = false,
	completeLabel,
	completedLabel,
	onComplete,
}: {
	days: number;
	ariaLabel: string;
	completed?: boolean;
	celebrating?: boolean;
	completeLabel?: string;
	completedLabel?: string;
	onComplete?: () => void;
}) {
	const tier = getStreakBadgeTier(days);
	const className = `${styles.badge} ${tierClassNames[tier]}`;

	if (!onComplete) {
		return (
			<span className={className} data-tier={tier} aria-label={ariaLabel}>
				<span className={styles.value}>{formatStreakCount(days)}</span>
			</span>
		);
	}

	return (
		<button
			className={`${className} ${styles.actionBadge}`}
			type="button"
			data-tier={tier}
			data-completed={completed}
			data-celebrating={celebrating}
			aria-label={completed ? completedLabel : completeLabel}
			aria-pressed={completed}
			disabled={completed}
			onClick={onComplete}
		>
			<span className={styles.pendingVeil} aria-hidden="true" />
			<span className={styles.value} data-celebrating={celebrating}>
				{formatStreakCount(days)}
			</span>
			<span className={styles.completionSeal} aria-hidden="true">
				<Check />
			</span>
			<span className={styles.completionBurst} aria-hidden="true">
				{COMPLETION_BURST_RAYS.map((ray) => (
					<span key={ray} />
				))}
			</span>
		</button>
	);
}
