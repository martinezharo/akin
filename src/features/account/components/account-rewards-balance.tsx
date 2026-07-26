import { Coins, Sparkles } from "lucide-react";
import { ui } from "@/i18n";
import styles from "../account.module.css";

export function AccountRewardsBalance({ balance, xp }: { balance: number; xp: number }) {
	return (
		<div className={styles.walletPills} aria-label={ui.account.wallet.ariaLabel(balance, xp)}>
			<span className={styles.coinPill} data-coin-wallet key={`coins-${balance}`} aria-label={ui.account.wallet.coins(balance)}>
				<Coins aria-hidden="true" />
				<strong>{balance.toLocaleString()}</strong>
			</span>
			<span className={styles.xpPill} data-xp-wallet key={`xp-${xp}`} aria-label={ui.account.wallet.xp(xp)}>
				<Sparkles aria-hidden="true" />
				<strong>{xp.toLocaleString()}</strong>
			</span>
		</div>
	);
}

export function GuestRewardsBalance({ onRequestAccess }: { onRequestAccess: () => void }) {
	return (
		<div className={`${styles.walletPills} ${styles.guestWallet}`} aria-label={ui.account.wallet.guestLabel}>
			<button className={styles.coinPill} type="button" onClick={onRequestAccess} aria-label={ui.account.wallet.guestCoins}>
				<Coins aria-hidden="true" />
				<strong aria-hidden="true">128</strong>
			</button>
			<button className={styles.xpPill} type="button" onClick={onRequestAccess} aria-label={ui.account.wallet.guestXp}>
				<Sparkles aria-hidden="true" />
				<strong aria-hidden="true">840</strong>
			</button>
		</div>
	);
}
