import { Coins, Sparkles } from "lucide-react";
import styles from "../account.module.css";

export function AccountRewardsBalance({ balance, xp }: { balance: number; xp: number }) {
	return (
		<div className={styles.walletPills} aria-label={`${balance} coins, ${xp} XP`}>
			<span className={styles.coinPill} data-coin-wallet key={`coins-${balance}`} aria-label={`${balance} coins`}>
				<Coins aria-hidden="true" />
				<strong>{balance.toLocaleString()}</strong>
			</span>
			<span className={styles.xpPill} data-xp-wallet key={`xp-${xp}`} aria-label={`${xp} XP`}>
				<Sparkles aria-hidden="true" />
				<strong>{xp.toLocaleString()}</strong>
			</span>
		</div>
	);
}

export function GuestRewardsBalance({ onRequestAccess }: { onRequestAccess: () => void }) {
	return (
		<div className={`${styles.walletPills} ${styles.guestWallet}`} aria-label="Account rewards, sign in to reveal">
			<button className={styles.coinPill} type="button" onClick={onRequestAccess} aria-label="Sign in to reveal your coins">
				<Coins aria-hidden="true" />
				<strong aria-hidden="true">128</strong>
			</button>
			<button className={styles.xpPill} type="button" onClick={onRequestAccess} aria-label="Sign in to reveal your XP">
				<Sparkles aria-hidden="true" />
				<strong aria-hidden="true">840</strong>
			</button>
		</div>
	);
}
