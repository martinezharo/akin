"use client";

import { useEffect, useState } from "react";
import { getLocalDateKey, millisecondsUntilNextLocalDay } from "../model/calendar";

export function useLocalDay() {
	const [today, setToday] = useState(getLocalDateKey);

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

	return today;
}
