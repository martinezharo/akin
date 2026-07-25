"use client";

import { useEffect, useState } from "react";
import { clearDemoAccountStorage } from "@/features/account/demo/demo-account-storage";
import { addLocalDays, getLocalDateKey, type LocalDateKey } from "../model/calendar";
import {
	clearDemoStorage,
	createDemoStreaksData,
	DEMO_STREAKS_STORAGE_KEY,
	loadDemoDate,
	saveDemoDate,
} from "../persistence/storage";
import { useDemoStreaksController } from "./use-demo-streaks-controller";
import { useStreaksController } from "./use-streaks-controller";

export function useDemoExperience() {
	const realToday = getLocalDateKey();
	const [today, setToday] = useState<LocalDateKey>(() => loadDemoDate(realToday));
	const localController = useStreaksController({
		today,
		storageKey: DEMO_STREAKS_STORAGE_KEY,
		createFallbackData: () => createDemoStreaksData(today),
	});
	const { controller, dashboard, toggleRewardEligible, resetWallet, resetAccount } = useDemoStreaksController(localController);

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

	return {
		today,
		setToday,
		controller,
		dashboard,
		toggleRewardEligible,
		resetWallet,
		reset,
		addDays: (days: number) => setToday((currentDate) => addLocalDays(currentDate, days)),
	};
}
