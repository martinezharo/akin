"use client";

import { Authenticated, AuthLoading, Unauthenticated, useQuery, useMutation } from "convex/react";
import { Coins, FlaskConical, LogOut, SlidersHorizontal, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ReactNode, useId, useState } from "react";
import { api } from "@convex/_generated/api";
import { MAX_REWARD_STREAKS } from "@convex/lib/app-rules";
import { authClient } from "@/lib/auth-client";
import { AppNavigation } from "@/shared/ui/app-navigation";
import { UndoToast } from "@/shared/ui/undo-toast";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { StreaksApp } from "@/features/streaks/app/streaks-app";
import { StreakIcon } from "@/features/streaks/components/icon-picker/streak-icons";
import type { AccountDashboardView } from "./account-types";
import { GuestAccountControls } from "./guest-account-controls";
import { UsernamePresence } from "./username-setup-modal";
import styles from "./account-page.module.css";

type AccountPageViewProps = {
	dashboard: AccountDashboardView;
	onToggleRewardEligible: (streakId: string, rewardEligible: boolean) => void | Promise<void>;
	eyebrow?: string;
	footer: ReactNode;
};

export function AccountPageView({ dashboard, onToggleRewardEligible, eyebrow = "Your Akin", footer }: AccountPageViewProps) {
	const [showRewardLimitNotice, setShowRewardLimitNotice] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savingId, setSavingId] = useState<string | null>(null);
	const titleId = useId();
	const eligibleCount = dashboard.streaks.filter((streak) => streak.rewardEligible).length;
	const initial = dashboard.user.name.trim().charAt(0).toUpperCase() || "A";

	async function toggle(streakId: string, rewardEligible: boolean) {
		setShowRewardLimitNotice(false);
		setSavingId(streakId);
		setError(null);
		try {
			await onToggleRewardEligible(streakId, rewardEligible);
		} catch {
			setError(`${MAX_REWARD_STREAKS} is the limit. Switch one streak off before choosing another.`);
		} finally {
			setSavingId(null);
		}
	}

	return (
		<main className={styles.page}>
			<div className={styles.ambient} aria-hidden="true" />
			<div className={styles.content}>
					<section className={styles.profileHero} aria-labelledby={titleId}>
						<div className={styles.bigAvatar} aria-hidden="true">{initial}</div>
						<div>
							<p className={styles.eyebrow}>{eyebrow}</p>
							<h1 id={titleId}>{dashboard.user.name}</h1>
							<p className={styles.email}>{dashboard.user.email}</p>
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

						<section className={`${styles.card} ${styles.rewardCard}`} aria-labelledby="reward-title">
							<div className={styles.rewardHeading}>
								<div><SlidersHorizontal aria-hidden="true" /><h2 id="reward-title">Reward streaks</h2></div>
								<span className={styles.rewardCount}>{eligibleCount}/{MAX_REWARD_STREAKS}</span>
							</div>
							<p className={styles.rewardCopy}>Choose up to {MAX_REWARD_STREAKS} streaks that earn one coin and one XP whenever you keep them.</p>

							{dashboard.streaks.length ? (
								<div className={styles.rewardList}>
									{dashboard.streaks.map((streak) => {
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
													aria-label={`Reward ${streak.name}`}
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
							) : <p className={styles.emptyRewards}>Your first streak will automatically earn rewards.</p>}
							{error ? <p className={styles.settingsError} role="alert">{error}</p> : null}
						</section>

					<footer className={styles.pageFooter}>{footer}</footer>
					</div>
			</div>
			{showRewardLimitNotice && eligibleCount >= MAX_REWARD_STREAKS ? (
				<UndoToast
					message="Reward crew full — swap one out first."
					actionLabel="Got it"
					durationMs={4200}
					statusIcon={<Coins />}
					variant="warning"
					onUndo={() => setShowRewardLimitNotice(false)}
					onDismiss={() => setShowRewardLimitNotice(false)}
				/>
			) : null}
			<AppNavigation preferencesControl={<AppPreferences placement="navigation" />} />
			<UsernamePresence username={dashboard.user.username} />
		</main>
	);
}

function AccountLoading() {
	return <div className={styles.loading} role="status"><span className={styles.loadingLogo}><Image src="/brand/akin-app-icon.svg" alt="" width={56} height={56} priority /></span><p>Gathering your little wins…</p></div>;
}

function GuestAccountPage() {
	const router = useRouter();

	function dismissAuth() {
		if (window.history.length > 1) {
			router.back();
			return;
		}
		router.replace("/");
	}

	return (
		<>
			<StreaksApp />
			<GuestAccountControls initialAuthOpen onAuthDismiss={dismissAuth} />
		</>
	);
}

function RegisteredAccountPage() {
	const dashboard = useQuery(api.dashboard.get);
	const setRewardEligible = useMutation(api.streaks.setRewardEligible);

	if (!dashboard) return <AccountLoading />;

	return <AccountPageView dashboard={dashboard} onToggleRewardEligible={async (streakId, rewardEligible) => { await setRewardEligible({ streakId, rewardEligible }); }} footer={<button className={styles.signOut} type="button" onClick={() => void authClient.signOut()}><LogOut aria-hidden="true" /> Sign out</button>} />;
}

export function AccountExperience() {
	return <><AuthLoading><AccountLoading /></AuthLoading><Unauthenticated><GuestAccountPage /></Unauthenticated><Authenticated><RegisteredAccountPage /></Authenticated></>;
}

export function DemoAccountPage({ dashboard, onToggleRewardEligible, onResetWallet }: { dashboard: AccountDashboardView; onToggleRewardEligible: (streakId: string, rewardEligible: boolean) => void; onResetWallet: () => void }) {
	return <AccountPageView dashboard={dashboard} eyebrow="Demo Akin" onToggleRewardEligible={onToggleRewardEligible} footer={<button className={styles.demoReset} type="button" onClick={onResetWallet}><FlaskConical aria-hidden="true" /> Reset wallet to 999</button>} />;
}
