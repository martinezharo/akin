"use client";

import type { ReactNode } from "react";
import { AccountRewardsBalance } from "@/features/account/components/account-rewards-balance";
import { UsernamePresence } from "@/features/account/components/username-setup-modal";
import { AppShell } from "@/features/navigation/app-shell";
import { StreaksView } from "./streaks-view";
import type { StreaksController } from "./use-streaks-controller";

/**
 * The home layout every signed-in-shaped experience shares: streaks in the
 * column, the wallet floating behind them and the account dock in the nav. The
 * demo and a real account differ only in where those values come from.
 */
export function StreaksHomeShell({
	controller,
	accountControl,
	wallet,
	username,
	overlay,
	children,
}: {
	controller: StreaksController;
	accountControl: ReactNode;
	wallet: { balance: number; xp: number };
	username: string | null | undefined;
	/** Extra floating pieces layered on top of the column. */
	overlay?: ReactNode;
	children?: ReactNode;
}) {
	return (
		<AppShell
			variant="hero"
			accountControl={accountControl}
			backdrop={<AccountRewardsBalance balance={wallet.balance} xp={wallet.xp} />}
			overlay={(
				<>
					<UsernamePresence username={username} />
					{overlay}
				</>
			)}
		>
			<StreaksView controller={controller} />
			{children}
		</AppShell>
	);
}
