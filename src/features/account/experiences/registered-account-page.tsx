"use client";

import { LogOut } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { ui } from "@/i18n";
import { AccountPageView } from "../components/account-page-view";
import { AccountLoading } from "../components/account-loading";
import styles from "../account-page.module.css";

export function RegisteredAccountPage() {
	const dashboard = useQuery(api.dashboard.get);
	const setRewardEligible = useMutation(api.streaks.setRewardEligible);

	if (!dashboard) return <AccountLoading />;

	return (
		<AccountPageView
			dashboard={dashboard}
			onToggleRewardEligible={async (streakId, rewardEligible) => {
				await setRewardEligible({ streakId, rewardEligible });
			}}
			footer={(
				<button className={styles.signOut} type="button" onClick={() => void authClient.signOut()}>
					<LogOut aria-hidden="true" /> {ui.account.signOut}
				</button>
			)}
		/>
	);
}
