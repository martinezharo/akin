"use client";

import { Coins, Sparkles, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getExperiencePath } from "@/shared/routing/experience-paths";
import styles from "./account.module.css";

type AccountDockViewProps = {
	avatarBadge?: string;
};

function AccountDockView({
	avatarBadge,
}: AccountDockViewProps) {
	const pathname = usePathname();
	const meHref = getExperiencePath(pathname, "/me");

	return (
		<Link className={styles.accountButton} href={meHref} aria-current={pathname === meHref ? "page" : undefined} aria-label="Open account and reward settings">
			<UserRound aria-hidden="true" />
			<span>Me</span>
			{avatarBadge ? <small>{avatarBadge}</small> : null}
		</Link>
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

export function AccountDock({ avatarBadge }: { avatarBadge?: string }) {
	return <AccountDockView avatarBadge={avatarBadge} />;
}

export function DemoAccountDock({
	avatarBadge,
}: {
	avatarBadge?: string;
}) {
	return <AccountDockView avatarBadge={avatarBadge} />;
}
