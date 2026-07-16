"use client";

import { useEffect, useState } from "react";
import { getLocalDateKey, millisecondsUntilNextLocalDay } from "../model/calendar";
import { createEmptyStreaksData, STREAKS_STORAGE_KEY } from "../persistence/storage";
import { StreaksHydration } from "./streaks-hydration";
import { StreaksView } from "./streaks-view";
import { useStreaksController } from "./use-streaks-controller";

function HydratedStreaksApp() {
	const [today, setToday] = useState(getLocalDateKey);
	const controller = useStreaksController({
		today,
		storageKey: STREAKS_STORAGE_KEY,
		createFallbackData: () => createEmptyStreaksData(today),
	});

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;

		function scheduleNextDay() {
			timeout = setTimeout(() => {
				setToday(getLocalDateKey());
				scheduleNextDay();
			}, millisecondsUntilNextLocalDay());
		}

		scheduleNextDay();
		return () => clearTimeout(timeout);
	}, []);

	return <StreaksView controller={controller} />;
}

export function StreaksApp() {
	return (
		<StreaksHydration>
			<HydratedStreaksApp />
		</StreaksHydration>
	);
}
