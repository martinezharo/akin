"use client";

import type { ReactNode } from "react";
import { AppNavigation, type AppNavigationProps } from "./app-navigation";
import styles from "./app-shell.module.css";

/**
 * `hero`   — home: a tall column of air above the composer.
 * `column` — standard reading rhythm inside a centred column.
 * `canvas` — full-bleed pages that paint their own background art.
 */
export type AppShellVariant = "hero" | "column" | "canvas";

type AppShellProps = AppNavigationProps & {
	variant?: AppShellVariant;
	/** Rendered before the content column: ambient art, floating actions, overlays. */
	backdrop?: ReactNode;
	/** Rendered after the content column, outside the column width: toasts, modals. */
	overlay?: ReactNode;
	children: ReactNode;
};

export function AppShell({
	variant = "column",
	backdrop,
	overlay,
	children,
	...navigation
}: AppShellProps) {
	return (
		<main className={`${styles.main} ${styles[variant]}`}>
			{backdrop}
			<div className={styles.content}>{children}</div>
			<AppNavigation {...navigation} />
			{overlay}
		</main>
	);
}
