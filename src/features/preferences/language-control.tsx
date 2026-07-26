"use client";

import { startTransition, useEffect, useId, useState } from "react";
import type { Language } from "@/i18n/config";
import { activeLanguage, selectLanguage } from "@/shared/preferences/preferences-storage";
import { LanguageMenu } from "./language-menu";

/**
 * The standalone language control, for surfaces that want to offer the setting
 * without the rest of the preferences panel.
 */
export function LanguageControl() {
	const [language, setLanguage] = useState<Language>("en");
	const id = useId();

	// Server-rendered as English; this catches the button up with the reader.
	useEffect(() => startTransition(() => setLanguage(activeLanguage())), []);

	return <LanguageMenu id={id} value={language} variant="compact" onChange={selectLanguage} />;
}
