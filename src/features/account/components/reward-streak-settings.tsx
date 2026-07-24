"use client";

import { Coins, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { MAX_REWARD_STREAKS } from "@/domain/rewards/reward-rules";
import { StreakIcon } from "@/features/streaks/components/icon-picker/streak-icons";
import { ui } from "@/i18n/en";
import { UndoToast } from "@/shared/ui/undo-toast";
import type { AccountDashboardView } from "../model/account-types";
import styles from "../account-page.module.css";

type RewardStreakSettingsProps = {
	streaks: AccountDashboardView["streaks"];
	onToggleRewardEligible: (streakId: string, rewardEligible: boolean) => void | Promise<void>;
};

export function RewardStreakSettings({ streaks, onToggleRewardEligible }: RewardStreakSettingsProps) {
	const [showRewardLimitNotice, setShowRewardLimitNotice] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savingId, setSavingId] = useState<string | null>(null);
	const eligibleCount = streaks.filter((streak) => streak.rewardEligible).length;

	async function toggle(streakId: string, rewardEligible: boolean) {
		setShowRewardLimitNotice(false);
		setSavingId(streakId);
		setError(null);
		try {
			await onToggleRewardEligible(streakId, rewardEligible);
		} catch {
			setError(ui.account.rewardSettings.limitError(MAX_REWARD_STREAKS));
		} finally {
			setSavingId(null);
		}
	}

	return (
		<>
			<section className={`${styles.card} ${styles.rewardCard}`} aria-labelledby="reward-title">
				<div className={styles.rewardHeading}>
					<div><SlidersHorizontal aria-hidden="true" /><h2 id="reward-title">{ui.account.rewardSettings.heading}</h2></div>
					<span className={styles.rewardCount}>{eligibleCount}/{MAX_REWARD_STREAKS}</span>
				</div>
				<p className={styles.rewardCopy}>{ui.account.rewardSettings.copy(MAX_REWARD_STREAKS)}</p>

				{streaks.length ? (
					<div className={styles.rewardList}>
						{streaks.map((streak) => {
							const isAtRewardStreakLimit = !streak.rewardEligible && eligibleCount >= MAX_REWARD_STREAKS;
							const disabled = savingId === streak.id;
							return (
								<label key={streak.id} data-disabled={disabled || isAtRewardStreakLimit}>
									<span className={styles.miniIcon}><StreakIcon value={streak.icon} /></span>
									<span>{streak.name}</span>
									<input
										type="checkbox"
										checked={streak.rewardEligible}
										disabled={disabled}
										aria-label={ui.account.rewardSettings.toggleLabel(streak.name)}
										onChange={(event) => {
											if (event.currentTarget.checked && isAtRewardStreakLimit) {
												setShowRewardLimitNotice(true);
												return;
											}
											void toggle(streak.id, event.currentTarget.checked);
										}}
									/>
									<span className={styles.switch} aria-hidden="true" />
								</label>
							);
						})}
					</div>
				) : <p className={styles.emptyRewards}>{ui.account.rewardSettings.empty}</p>}
				{error ? <p className={styles.settingsError} role="alert">{error}</p> : null}
			</section>

			{showRewardLimitNotice && eligibleCount >= MAX_REWARD_STREAKS ? (
				<UndoToast
					message={ui.account.rewardSettings.toastMessage}
					actionLabel={ui.account.rewardSettings.toastAction}
					durationMs={4200}
					statusIcon={<Coins />}
					variant="warning"
					onUndo={() => setShowRewardLimitNotice(false)}
					onDismiss={() => setShowRewardLimitNotice(false)}
				/>
			) : null}
		</>
	);
}
