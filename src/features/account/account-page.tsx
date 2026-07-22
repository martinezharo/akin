"use client";

import { Authenticated, AuthLoading, Unauthenticated, useQuery, useMutation } from "convex/react";
import { ArrowRight, Coins, FlaskConical, LogOut, SlidersHorizontal, Sparkles } from "lucide-react";
import Image from "next/image";
import { type ReactNode, useId, useState } from "react";
import { api } from "@convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { AppNavigation } from "@/shared/ui/app-navigation";
import { UndoToast } from "@/shared/ui/undo-toast";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { StreakIcon } from "@/features/streaks/components/icon-picker/streak-icons";
import type { AccountDashboardView } from "./account-types";
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
			setError("Ten is the limit. Switch one streak off before choosing another.");
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
								<span className={styles.rewardCount}>{eligibleCount}/10</span>
							</div>
							<p className={styles.rewardCopy}>Choose up to ten streaks that earn one coin and one XP whenever you keep them.</p>

							{dashboard.streaks.length ? (
								<div className={styles.rewardList}>
									{dashboard.streaks.map((streak) => {
										const isAtRewardStreakLimit = !streak.rewardEligible && eligibleCount >= 10;
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
			{showRewardLimitNotice && eligibleCount >= 10 ? (
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
		</main>
	);
}

function GitHubMark() {
	return <svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.28-1.28-5.28-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.96 10.96 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" /></svg>;
}

function AccountLoading() {
	return <div className={styles.loading} role="status"><span className={styles.loadingLogo}><Image src="/brand/akin-app-icon.svg" alt="" width={56} height={56} priority /></span><p>Gathering your little wins…</p></div>;
}

function GuestAccountPage() {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function continueWithGitHub() {
		setPending(true);
		setError(null);
		try {
			const result = await authClient.signIn.social({ provider: "github", callbackURL: "/" });
			if (result.error) setError(result.error.message || "GitHub couldn’t open the door. Try again.");
		} catch {
			setError("GitHub couldn’t open the door. Try again.");
		} finally {
			setPending(false);
		}
	}

	return (
		<main className={styles.page}>
			<div className={styles.ambient} aria-hidden="true" />
			<div className={styles.content}>
				<section className={styles.authCard} aria-labelledby="auth-title">
					<div className={styles.authMark} aria-hidden="true"><Sparkles /></div>
					<p className={styles.eyebrow}>Make it yours</p>
					<h1 id="auth-title">Keep every little win.</h1>
					<p className={styles.authCopy}>Sign in or create your Akin account with GitHub. Your streaks, check-ins and coins will be waiting on every device.</p>
					{error ? <p className={styles.authError} role="alert">{error}</p> : null}
					<button className={styles.githubSubmit} type="button" disabled={pending} onClick={() => void continueWithGitHub()}><span className={styles.githubBadge}><GitHubMark /></span><strong>{pending ? "Heading to GitHub…" : "Continue with GitHub"}</strong><ArrowRight aria-hidden="true" /></button>
					<p className={styles.authFootnote}>One click. No new password to remember.</p>
				</section>
			</div>
			<AppNavigation preferencesControl={<AppPreferences placement="navigation" />} />
		</main>
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
