"use client";

import { DemoAccountDock } from "@/features/account/components/account-dock";
import { AccountRewardsBalance } from "@/features/account/components/account-rewards-balance";
import { UsernamePresence } from "@/features/account/components/username-setup-modal";
import { AppShell } from "@/features/navigation/app-shell";
import { DemoTimeControls } from "../components/demo-time-controls/demo-time-controls";
import { StreaksHydration } from "./streaks-hydration";
import { StreaksView } from "./streaks-view";
import { useDemoExperience } from "./use-demo-experience";

function HydratedStreaksDemo() {
	const { today, controller, dashboard, reset, addDays } = useDemoExperience();

	return (
		<AppShell
			variant="hero"
			accountControl={<DemoAccountDock />}
			backdrop={<AccountRewardsBalance balance={dashboard.wallet.balance} xp={dashboard.wallet.xp} />}
			overlay={(
				<>
					<UsernamePresence username={dashboard.user.username} />
					<DemoTimeControls
						today={today}
						hasPendingReview={controller.hasPendingReview}
						onAdvance={addDays}
						onReset={reset}
					/>
				</>
			)}
		>
			<StreaksView controller={controller} />
		</AppShell>
	);
}

export function StreaksDemo() {
	return (
		<StreaksHydration>
			<HydratedStreaksDemo />
		</StreaksHydration>
	);
}
