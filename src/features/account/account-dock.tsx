"use client";

import {
	Coins,
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
	const [error, setError] = useState<string | null>(null);
	const [savingId, setSavingId] = useState<string | null>(null);
	const titleId = useId();
	const eligibleCount = dashboard.streaks.filter((streak) => streak.coinEligible).length;
	const initial = dashboard.user.name.trim().charAt(0).toUpperCase() || "A";

	async function toggle(streakId: string, coinEligible: boolean) {
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
				<span className={styles.coinPill} aria-label={`${dashboard.wallet.balance} coins`}>
					<Coins aria-hidden="true" />
					<strong>{dashboard.wallet.balance.toLocaleString()}</strong>
				</span>
				<button className={styles.accountButton} type="button" onClick={() => setOpen(true)} aria-label="Open account and coin settings">
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
							<div className={styles.coinList}>
								{dashboard.streaks.map((streak) => {
									const disabled = savingId === streak.id || (!streak.coinEligible && eligibleCount >= 10);
									return (
										<label key={streak.id} data-disabled={disabled}>
											<span className={styles.miniIcon}>
												<StreakIcon value={streak.icon} />
											</span>
											<span>{streak.name}</span>
											<input type="checkbox" checked={streak.coinEligible} disabled={disabled} onChange={(event) => void toggle(streak.id, event.currentTarget.checked)} />
											<i aria-hidden="true" />
										</label>
									);
								})}
							</div>
						) : <p className={styles.emptyCoins}>Your first streak will automatically earn coins.</p>}
						{error ? <p className={styles.settingsError} role="alert">{error}</p> : null}
						{footer}
					</div>
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
