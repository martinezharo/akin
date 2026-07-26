"use client";

import { LogOut } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ui } from "@/i18n";
import { AccountPageView } from "../components/account-page-view";
import { AccountLoading } from "../components/account-loading";
import { useSignOut } from "../model/use-sign-out";
import styles from "../account-page.module.css";

export function RegisteredAccountPage() {
	const dashboard = useQuery(api.dashboard.get);
	const setRewardEligible = useMutation(api.streaks.setRewardEligible);
	const { signOut, isSigningOut } = useSignOut();

	if (!dashboard) return <AccountLoading />;

	return (
		<AccountPageView
			dashboard={dashboard}
			onToggleRewardEligible={async (streakId, rewardEligible) => {
				await setRewardEligible({ streakId, rewardEligible });
			}}
			footer={(
				<button
					className={styles.signOut}
					type="button"
					disabled={isSigningOut}
					onClick={() => void signOut()}
				>
					<LogOut aria-hidden="true" /> {ui.account.signOut}
				</button>
			)}
		/>
	);
}
