"use client";

import { type ReactNode, useSyncExternalStore } from "react";
import { ui } from "@/i18n";
import styles from "./streaks-shell.module.css";

const subscribeToHydration = () => () => {};

export function StreaksHydration({ children }: { children: ReactNode }) {
	const isHydrated = useSyncExternalStore(
		subscribeToHydration,
		() => true,
		() => false,
	);

	if (!isHydrated) {
		return <div className={styles.loading} aria-label={ui.streaks.loading} />;
	}

	return children;
}
