"use client";

import {
	Coins,
	ChevronDown,
	FlaskConical,
	LogOut,
	SlidersHorizontal,
	Sparkles,
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
	wallet: { balance: number; lifetimeEarned: number };
	streaks: Array<{
		id: string;
		name: string;
		icon: string | null;
		coinEligible: boolean;
	}>;
};

type AccountDockViewProps = {
	dashboard: AccountDashboardView;
	onToggleCoinEligible: (streakId: string, coinEligible: boolean) => void | Promise<void>;
	eyebrow?: string;
	avatarBadge?: string;
	footer: ReactNode;
};

function AccountDockView({
	dashboard,
	onToggleCoinEligible,
	eyebrow = "Your Akin",
	avatarBadge,
	footer,
}: AccountDockViewProps) {
	const [open, setOpen] = useState(false);
	const [showAllCoinStreaks, setShowAllCoinStreaks] = useState(false);
	const [showCoinLimitNotice, setShowCoinLimitNotice] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [savingId, setSavingId] = useState<string | null>(null);
	const titleId = useId();
	const eligibleCount = dashboard.streaks.filter((streak) => streak.coinEligible).length;
	const initial = dashboard.user.name.trim().charAt(0).toUpperCase() || "A";
	const coinStreakPreviewCount = 10;
	const hasHiddenCoinStreaks = dashboard.streaks.length > coinStreakPreviewCount;
	const visibleCoinStreaks = showAllCoinStreaks
		? dashboard.streaks
		: dashboard.streaks.slice(0, coinStreakPreviewCount);

	async function toggle(streakId: string, coinEligible: boolean) {
		setShowCoinLimitNotice(false);
		setSavingId(streakId);
		setError(null);
		try {
			await onToggleCoinEligible(streakId, coinEligible);
		} catch {
			setError("Ten is the limit. Switch one streak off before choosing another.");
		} finally {
			setSavingId(null);
		}
	}

	return (
		<>
			<div className={styles.accountDock}>
				<span className={styles.coinPill} data-coin-wallet key={dashboard.wallet.balance} aria-label={`${dashboard.wallet.balance} coins`}>
					<Coins aria-hidden="true" />
					<strong>{dashboard.wallet.balance.toLocaleString()}</strong>
				</span>
				<button className={styles.accountButton} type="button" onClick={() => { setShowAllCoinStreaks(false); setShowCoinLimitNotice(false); setOpen(true); }} aria-label="Open account and coin settings">
					<span>{initial}</span>
					{avatarBadge ? <small>{avatarBadge}</small> : null}
				</button>
			</div>

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

						<div className={styles.coinHeader}>
							<div><SlidersHorizontal aria-hidden="true" /><h3>Coin streaks</h3></div>
							<span>{eligibleCount}/10</span>
						</div>
						<p className={styles.coinCopy}>Choose up to ten streaks that earn one coin whenever you keep them.</p>
						{dashboard.streaks.length ? (
							<>
								<div className={styles.coinList}>
									{visibleCoinStreaks.map((streak, index) => {
										const isAtCoinStreakLimit = !streak.coinEligible && eligibleCount >= 10;
										const disabled = savingId === streak.id;
										return (
											<label key={streak.id} data-disabled={disabled || isAtCoinStreakLimit} data-revealed={(showAllCoinStreaks && index >= coinStreakPreviewCount) || undefined}>
												<span className={styles.miniIcon}>
													<StreakIcon value={streak.icon} />
												</span>
												<span>{streak.name}</span>
												<input
													type="checkbox"
													checked={streak.coinEligible}
													disabled={disabled}
													onChange={(event) => {
														if (event.currentTarget.checked && isAtCoinStreakLimit) {
															setShowCoinLimitNotice(true);
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
								{hasHiddenCoinStreaks ? (
									<button
										className={styles.showAllCoinStreaks}
										type="button"
										onClick={() => setShowAllCoinStreaks((shown) => !shown)}
										aria-expanded={showAllCoinStreaks}
									>
										<ChevronDown aria-hidden="true" />
										<span>{showAllCoinStreaks ? "Show less" : `Show all ${dashboard.streaks.length} streaks`}</span>
									</button>
								) : null}
							</>
						) : <p className={styles.emptyCoins}>Your first streak will automatically earn coins.</p>}
						{error ? <p className={styles.settingsError} role="alert">{error}</p> : null}
						{footer}
					</div>
					{showCoinLimitNotice && eligibleCount >= 10 ? (
						<UndoToast
							message="Coin crew full — swap one out first."
							actionLabel="Got it"
							durationMs={4200}
							statusIcon={<Coins />}
							variant="warning"
							onUndo={() => setShowCoinLimitNotice(false)}
							onDismiss={() => setShowCoinLimitNotice(false)}
						/>
					) : null}
				</ModalDialog>
			) : null}
		</>
	);
}

export function AccountDock({ dashboard }: { dashboard: AccountDashboard }) {
	const setCoinEligible = useMutation(api.streaks.setCoinEligible);

	return (
		<AccountDockView
			dashboard={dashboard}
			onToggleCoinEligible={async (streakId, coinEligible) => {
				await setCoinEligible({ streakId, coinEligible });
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
	onToggleCoinEligible,
	onResetWallet,
}: {
	dashboard: AccountDashboardView;
	onToggleCoinEligible: (streakId: string, coinEligible: boolean) => void;
	onResetWallet: () => void;
}) {
	return (
		<AccountDockView
			dashboard={dashboard}
			eyebrow="Demo Akin"
			avatarBadge="LAB"
			onToggleCoinEligible={onToggleCoinEligible}
			footer={(
				<button className={styles.demoReset} type="button" onClick={onResetWallet}>
					<FlaskConical aria-hidden="true" /> Reset wallet to 999
				</button>
			)}
		/>
	);
}
