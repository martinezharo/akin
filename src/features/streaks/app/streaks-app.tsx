"use client";

import { createEmptyStreaksData, STREAKS_STORAGE_KEY } from "../persistence/storage";
import { StreaksHydration } from "./streaks-hydration";
import { StreaksView } from "./streaks-view";
import { useLocalDay } from "./use-local-day";
import { useStreaksController } from "./use-streaks-controller";

function HydratedStreaksApp() {
	const today = useLocalDay();
	const controller = useStreaksController({
		today,
		storageKey: STREAKS_STORAGE_KEY,
		createFallbackData: () => createEmptyStreaksData(today),
	});

	return <StreaksView controller={controller} />;
}

export function StreaksApp() {
	return (
		<StreaksHydration>
			<HydratedStreaksApp />
		</StreaksHydration>
	);
}
