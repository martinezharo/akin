"use client";

import { addLocalDays } from "../model/calendar";
import { AccountRewardsBalance, DemoAccountDock } from "@/features/account/account-dock";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { AppNavigation } from "@/shared/ui/app-navigation";
import { DemoTimeControls } from "../components/demo-time-controls/demo-time-controls";
import { StreaksHydration } from "./streaks-hydration";
import { StreaksView } from "./streaks-view";
import { useDemoExperience } from "./use-demo-experience";

function HydratedStreaksDemo() {
	const { today, setToday, controller, dashboard, reset } = useDemoExperience();

	return (
		<StreaksView controller={controller}>
			<AccountRewardsBalance balance={dashboard.wallet.balance} xp={dashboard.wallet.xp} />
			<AppNavigation
				accountControl={<DemoAccountDock />}
				preferencesControl={<AppPreferences placement="navigation" />}
			/>
			<DemoTimeControls
				today={today}
				hasPendingReview={controller.hasPendingReview}
				onAdvance={(days) => setToday((currentDate) => addLocalDays(currentDate, days))}
				onReset={reset}
			/>
		</StreaksView>
	);
}

export function StreaksDemo() {
	return (
		<StreaksHydration>
			<HydratedStreaksDemo />
		</StreaksHydration>
	);
}
