"use client";

import { DemoAccountPage } from "@/features/account/demo/demo-account-page";
import { useDemoDashboard } from "@/features/account/demo/use-demo-dashboard";
import { StreaksHydration } from "@/features/streaks/app/streaks-hydration";

function DemoMeExperience() {
	const { dashboard, toggleRewardEligible, resetWallet } = useDemoDashboard();

	return <DemoAccountPage dashboard={dashboard} onToggleRewardEligible={toggleRewardEligible} onResetWallet={resetWallet} />;
}

export default function DemoMePage() {
	return <StreaksHydration><DemoMeExperience /></StreaksHydration>;
}
