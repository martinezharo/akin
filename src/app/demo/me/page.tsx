"use client";

import { DemoAccountPage } from "@/features/account/account-page";
import { StreaksHydration } from "@/features/streaks/app/streaks-hydration";
import { useDemoExperience } from "@/features/streaks/app/use-demo-experience";

function DemoMeExperience() {
	const { dashboard, toggleRewardEligible, resetWallet } = useDemoExperience();

	return <DemoAccountPage dashboard={dashboard} onToggleRewardEligible={toggleRewardEligible} onResetWallet={resetWallet} />;
}

export default function DemoMePage() {
	return <StreaksHydration><DemoMeExperience /></StreaksHydration>;
}
