import { Coins, Sparkles } from "lucide-react";
import styles from "./account.module.css";

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
