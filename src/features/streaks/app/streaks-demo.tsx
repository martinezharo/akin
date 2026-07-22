"use client";

import { useEffect, useState } from "react";
import { DemoAccountDock } from "@/features/account/account-dock";
import { clearDemoAccountStorage } from "@/features/account/demo-account-storage";
import { DemoTimeControls } from "../components/demo-time-controls/demo-time-controls";
import { addLocalDays, getLocalDateKey } from "../model/calendar";
import {
	clearDemoStorage,
	createDemoStreaksData,
	DEMO_STREAKS_STORAGE_KEY,
	loadDemoDate,
	saveDemoDate,
} from "../persistence/storage";
import { StreaksHydration } from "./streaks-hydration";
import { StreaksView } from "./streaks-view";
import { useDemoStreaksController } from "./use-demo-streaks-controller";
import { useStreaksController } from "./use-streaks-controller";

function HydratedStreaksDemo() {
	const realToday = getLocalDateKey();
	const [today, setToday] = useState(() => loadDemoDate(realToday));
	const localController = useStreaksController({
		today,
		storageKey: DEMO_STREAKS_STORAGE_KEY,
		createFallbackData: () => createDemoStreaksData(today),
	});
	const {
		controller,
		dashboard,
		toggleCoinEligible,
		resetWallet,
		resetAccount,
	} = useDemoStreaksController(localController);

	useEffect(() => {
		saveDemoDate(today);
	}, [today]);

	function reset() {
		const currentDate = getLocalDateKey();
		const initialData = createDemoStreaksData(currentDate);
		clearDemoStorage();
		clearDemoAccountStorage();
		setToday(currentDate);
		controller.replaceData(initialData);
		resetAccount(initialData.streaks.map((streak) => streak.id));
	}

	return (
		<StreaksView controller={controller} showMascot>
			<DemoAccountDock
				dashboard={dashboard}
				onToggleCoinEligible={toggleCoinEligible}
				onResetWallet={resetWallet}
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
