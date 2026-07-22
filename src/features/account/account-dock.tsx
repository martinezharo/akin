"use client";

import {
	Coins,
	ChevronDown,
	FlaskConical,
	LogOut,
	SlidersHorizontal,
	Sparkles,
	UserRound,
	X,
} from "lucide-react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { type ReactNode, useId, useState } from "react";
import { api } from "@convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import { UndoToast } from "@/shared/ui/undo-toast";
import { StreakIcon } from "@/features/streaks/components/icon-picker/streak-icons";
import styles from "./account.module.css";

type AccountDashboard = NonNullable<FunctionReturnType<typeof api.dashboard.get>>;

export type AccountDashboardView = {
	user: { id: string; name: string; email: string };
	wallet: { balance: number; lifetimeEarned: number; xp: number };
	streaks: Array<{
		id: string;
		name: string;
		icon: string | null;
		rewardEligible: boolean;
	}>;
};

type AccountDockViewProps = {
	dashboard: AccountDashboardView;
	onToggleRewardEligible: (streakId: string, rewardEligible: boolean) => void | Promise<void>;
	eyebrow?: string;
	avatarBadge?: string;
	footer: ReactNode;
};

function AccountDockView({
	dashboard,
	onToggleRewardEligible,
	eyebrow = "Your Akin",
	avatarBadge,
	footer,
}: AccountDockViewProps) {
	const [open, setOpen] = useState(false);
	const [showAllRewardStreaks, setShowAllRewardStreaks] = useState(false);
	const [showRewardLimitNotice, setShowRewardLimitNotice] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savingId, setSavingId] = useState<string | null>(null);
	const titleId = useId();
	const eligibleCount = dashboard.streaks.filter((streak) => streak.rewardEligible).length;
	const initial = dashboard.user.name.trim().charAt(0).toUpperCase() || "A";
	const rewardStreakPreviewCount = 10;
	const hasHiddenRewardStreaks = dashboard.streaks.length > rewardStreakPreviewCount;
	const visibleRewardStreaks = showAllRewardStreaks
		? dashboard.streaks
		: dashboard.streaks.slice(0, rewardStreakPreviewCount);

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
		<>
			<button className={styles.accountButton} type="button" onClick={() => { setShowAllRewardStreaks(false); setShowRewardLimitNotice(false); setOpen(true); }} aria-label="Open account and reward settings">
				<UserRound aria-hidden="true" />
				<span>Me</span>
				{avatarBadge ? <small>{avatarBadge}</small> : null}
			</button>

			{open ? (
				<ModalDialog className={styles.settingsDialog} labelledBy={titleId} onDismiss={() => setOpen(false)}>
					<div className={styles.settingsCard}>
						<button className={styles.close} type="button" onClick={() => setOpen(false)} aria-label="Close">
							<X aria-hidden="true" />
						</button>
						<div className={styles.profileHeader}>
							<div className={styles.bigAvatar}>{initial}</div>
							<div>
								<p className={styles.eyebrow}>{eyebrow}</p>
								<h2 id={titleId}>{dashboard.user.name}</h2>
								<p>{dashboard.user.email}</p>
							</div>
						</div>

						<div className={styles.walletCard}>
							<div className={styles.coinArt}><Coins aria-hidden="true" /></div>
							<div><strong>{dashboard.wallet.balance.toLocaleString()}</strong><span>coins ready for future companions</span></div>
							<p><Sparkles aria-hidden="true" /> {dashboard.wallet.lifetimeEarned.toLocaleString()} earned all time</p>
						</div>

						<div className={styles.rewardHeader}>
							<div><SlidersHorizontal aria-hidden="true" /><h3>Reward streaks</h3></div>
							<span>{eligibleCount}/10</span>
						</div>
						<p className={styles.rewardCopy}>Choose up to ten streaks that earn one coin and one XP whenever you keep them.</p>
						{dashboard.streaks.length ? (
							<>
								<div className={styles.rewardList}>
									{visibleRewardStreaks.map((streak, index) => {
										const isAtRewardStreakLimit = !streak.rewardEligible && eligibleCount >= 10;
										const disabled = savingId === streak.id;
										return (
											<label key={streak.id} data-disabled={disabled || isAtRewardStreakLimit} data-revealed={(showAllRewardStreaks && index >= rewardStreakPreviewCount) || undefined}>
												<span className={styles.miniIcon}>
													<StreakIcon value={streak.icon} />
												</span>
												<span>{streak.name}</span>
												<input
													type="checkbox"
													checked={streak.rewardEligible}
													disabled={disabled}
													onChange={(event) => {
														if (event.currentTarget.checked && isAtRewardStreakLimit) {
															setShowRewardLimitNotice(true);
															return;
														}
														void toggle(streak.id, event.currentTarget.checked);
													}}
												/>
												<i aria-hidden="true" />
											</label>
										);
									})}
								</div>
								{hasHiddenRewardStreaks ? (
									<button
										className={styles.showAllRewardStreaks}
										type="button"
										onClick={() => setShowAllRewardStreaks((shown) => !shown)}
										aria-expanded={showAllRewardStreaks}
									>
										<ChevronDown aria-hidden="true" />
										<span>{showAllRewardStreaks ? "Show less" : `Show all ${dashboard.streaks.length} streaks`}</span>
									</button>
								) : null}
							</>
						) : <p className={styles.emptyRewards}>Your first streak will automatically earn rewards.</p>}
						{error ? <p className={styles.settingsError} role="alert">{error}</p> : null}
						{footer}
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
				</ModalDialog>
			) : null}
		</>
	);
}

export function AccountRewardsBalance({ balance, xp }: { balance: number; xp: number }) {
	return (
		<div className={styles.walletPills} aria-label={`${balance} coins, ${xp} XP`}>
			<span className={styles.coinPill} data-coin-wallet key={balance} aria-label={`${balance} coins`}>
				<Coins aria-hidden="true" />
				<strong>{balance.toLocaleString()}</strong>
			</span>
			<span className={styles.xpPill} data-xp-wallet key={xp} aria-label={`${xp} XP`}>
				<Sparkles aria-hidden="true" />
				<strong>{xp.toLocaleString()}</strong>
			</span>
		</div>
	);
}

export function AccountDock({ dashboard }: { dashboard: AccountDashboard }) {
	const setRewardEligible = useMutation(api.streaks.setRewardEligible);

	return (
		<AccountDockView
			dashboard={dashboard}
			onToggleRewardEligible={async (streakId, rewardEligible) => {
				await setRewardEligible({ streakId, rewardEligible });
			}}
			footer={(
				<button className={styles.signOut} type="button" onClick={() => void authClient.signOut()}>
					<LogOut aria-hidden="true" /> Sign out
				</button>
			)}
		/>
	);
}

export function DemoAccountDock({
	dashboard,
	onToggleRewardEligible,
	onResetWallet,
}: {
	dashboard: AccountDashboardView;
	onToggleRewardEligible: (streakId: string, rewardEligible: boolean) => void;
	onResetWallet: () => void;
}) {
	return (
		<AccountDockView
			dashboard={dashboard}
			eyebrow="Demo Akin"
			onToggleRewardEligible={onToggleRewardEligible}
			footer={(
				<button className={styles.demoReset} type="button" onClick={onResetWallet}>
					<FlaskConical aria-hidden="true" /> Reset wallet to 999
				</button>
			)}
		/>
	);
}
