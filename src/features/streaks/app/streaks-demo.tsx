"use client";

import { AccountDock } from "@/features/account/components/account-dock";
import { DemoTimeControls } from "../components/demo-time-controls/demo-time-controls";
import { StreaksHomeShell } from "./streaks-home-shell";
import { StreaksHydration } from "./streaks-hydration";
import { useDemoExperience } from "./use-demo-experience";

function HydratedStreaksDemo() {
	const { today, controller, dashboard, reset, addDays } = useDemoExperience();

	return (
		<StreaksHomeShell
			controller={controller}
			accountControl={<AccountDock />}
			wallet={dashboard.wallet}
			username={dashboard.user.username}
			overlay={(
				<DemoTimeControls
					today={today}
					hasPendingReview={controller.hasPendingReview}
					onAdvance={addDays}
					onReset={reset}
				/>
			)}
		/>
	);
}

export function StreaksDemo() {
	return (
		<StreaksHydration>
			<HydratedStreaksDemo />
		</StreaksHydration>
	);
}
