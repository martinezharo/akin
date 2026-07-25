"use client";

import type { ReactNode } from "react";
import { useAppChrome, type AppChromeSlots } from "./app-chrome";
import styles from "./app-shell.module.css";

/**
 * `hero`   — home: a tall column of air above the composer.
 * `column` — standard reading rhythm inside a centred column.
 * `canvas` — full-bleed pages that paint their own background art.
 */
export type AppShellVariant = "hero" | "column" | "canvas";

type AppShellProps = AppChromeSlots & {
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
	...chrome
}: AppShellProps) {
	// Navigation, wallet and presence live above the router: the page publishes
	// what they should show instead of mounting its own copies.
	useAppChrome(chrome);

	return (
		<main className={`${styles.main} ${styles[variant]}`}>
			{backdrop}
			<div className={styles.content}>{children}</div>
			{overlay}
		</main>
	);
}
