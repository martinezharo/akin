"use client";

import { FlaskConical } from "lucide-react";
import { ui } from "@/i18n";
import { AccountPageView } from "../components/account-page-view";
import type { AccountDashboardView } from "../model/account-types";
import styles from "../account-page.module.css";

export function DemoAccountPage({ dashboard, onToggleRewardEligible, onResetWallet }: {
	dashboard: AccountDashboardView;
	onToggleRewardEligible: (streakId: string, rewardEligible: boolean) => void;
	onResetWallet: () => void;
}) {
	return (
		<AccountPageView
			dashboard={dashboard}
			eyebrow={ui.account.demo.eyebrow}
			onToggleRewardEligible={onToggleRewardEligible}
			footer={(
				<button className={styles.demoReset} type="button" onClick={onResetWallet}>
					<FlaskConical aria-hidden="true" /> {ui.account.demo.resetWallet}
				</button>
			)}
		/>
	);
}
