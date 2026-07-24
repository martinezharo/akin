"use client";

import { Coins, Sparkles } from "lucide-react";
import { type ReactNode, useId } from "react";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { AppNavigation } from "@/shared/ui/app-navigation";
import { AccountRewardsBalance } from "./account-rewards-balance";
import { UsernamePresence } from "./username-setup-modal";
import type { AccountDashboardView } from "../model/account-types";
import { RewardStreakSettings } from "./reward-streak-settings";
import styles from "../account-page.module.css";

type AccountPageViewProps = {
	dashboard: AccountDashboardView;
	onToggleRewardEligible: (streakId: string, rewardEligible: boolean) => void | Promise<void>;
	eyebrow?: string;
	footer: ReactNode;
};

export function AccountPageView({ dashboard, onToggleRewardEligible, eyebrow = "Your Akin", footer }: AccountPageViewProps) {
	const titleId = useId();
	const username = dashboard.user.username?.trim();
	const visibleIdentity = username ? `@${username}` : dashboard.user.name;
	const initial = (username ?? dashboard.user.name).charAt(0).toUpperCase() || "A";

	return (
		<main className={styles.page}>
			<AccountRewardsBalance balance={dashboard.wallet.balance} xp={dashboard.wallet.xp} />
			<div className={styles.ambient} aria-hidden="true" />
			<div className={styles.content}>
				<section className={styles.profileHero} aria-labelledby={titleId}>
					<div className={styles.bigAvatar} aria-hidden="true">{initial}</div>
					<div>
						<p className={styles.eyebrow}>{eyebrow}</p>
						<h1 id={titleId}>{visibleIdentity}</h1>
					</div>
				</section>

				<div className={styles.dashboardGrid}>
					<section className={`${styles.card} ${styles.walletCard}`} aria-labelledby="wallet-title">
						<div className={styles.coinArt}><Coins aria-hidden="true" /></div>
						<div className={styles.walletValue}>
							<span className="sr-only" id="wallet-title">Your coin wallet</span>
							<strong>{dashboard.wallet.balance.toLocaleString()}</strong>
							<span>coins ready for future companions</span>
						</div>
						<p className={styles.walletMeta}><Sparkles aria-hidden="true" /> {dashboard.wallet.lifetimeEarned.toLocaleString()} earned all time · {dashboard.wallet.xp.toLocaleString()} XP</p>
					</section>

					<RewardStreakSettings
						streaks={dashboard.streaks}
						onToggleRewardEligible={onToggleRewardEligible}
					/>

					<footer className={styles.pageFooter}>{footer}</footer>
				</div>
			</div>
			<AppNavigation preferencesControl={<AppPreferences placement="navigation" />} />
			<UsernamePresence username={dashboard.user.username} />
		</main>
	);
}
