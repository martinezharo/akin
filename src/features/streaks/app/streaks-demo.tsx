"use client";

import { useEffect, useState } from "react";
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
import { useStreaksController } from "./use-streaks-controller";

function HydratedStreaksDemo() {
	const realToday = getLocalDateKey();
	const [today, setToday] = useState(() => loadDemoDate(realToday));
	const controller = useStreaksController({
		today,
		storageKey: DEMO_STREAKS_STORAGE_KEY,
		createFallbackData: () => createDemoStreaksData(today),
	});

	useEffect(() => {
		saveDemoDate(today);
	}, [today]);

	function reset() {
		const currentDate = getLocalDateKey();
		clearDemoStorage();
		setToday(currentDate);
		controller.replaceData(createDemoStreaksData(currentDate));
	}

	return (
		<StreaksView controller={controller}>
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
