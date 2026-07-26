"use client";

import { Moon, Sun } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { ui } from "@/i18n";
import { readStoredPreferences, runThemeTransition, savePreferences, type Theme } from "@/shared/preferences/preferences-storage";
import styles from "./theme-toggle.module.css";

/**
 * The one-tap version of the appearance setting, for places that have room for a
 * control but not for the whole preferences panel.
 */
export function ThemeToggle({ className }: { className?: string }) {
	const [theme, setTheme] = useState<Theme>("light");

	// The boot script in the layout has already dressed the page; this only
	// catches the button up with what the reader is looking at.
	useEffect(() => startTransition(() => setTheme(readStoredPreferences().theme)), []);

	function toggle() {
		const nextTheme = theme === "dark" ? "light" : "dark";
		runThemeTransition(() => {
			flushSync(() => setTheme(nextTheme));
			savePreferences({ ...readStoredPreferences(), theme: nextTheme });
		});
	}

	return (
		<button
			className={className ? `${styles.toggle} ${className}` : styles.toggle}
			type="button"
			data-theme={theme}
			aria-label={theme === "dark" ? ui.preferences.switchToLight : ui.preferences.switchToDark}
			onClick={toggle}
		>
			<span className={styles.dial} aria-hidden="true">
				<Sun className={styles.sun} />
				<Moon className={styles.moon} />
			</span>
		</button>
	);
}
