"use client";

import { startTransition, useEffect, useState, type ReactNode } from "react";
import { activeLanguage } from "@/shared/preferences/preferences-storage";
import type { Language } from "./config";
import { setRuntimeLanguage } from "./index";

export function I18nProvider({ children }: { children: ReactNode }) {
	const [language, setLanguage] = useState<Language>("en");

	useEffect(() => {
		const nextLanguage = activeLanguage();
		setRuntimeLanguage(nextLanguage);
		document.documentElement.lang = nextLanguage;
		startTransition(() => setLanguage(nextLanguage));
	}, []);

	return <I18nContext key={language} value={language}>{children}</I18nContext>;
}

// The value is intentionally only used to make the subtree rerender after the
// persisted language has been read. Copy is resolved through the shared proxy.
const I18nContext = ({ children }: { children: ReactNode; value: Language }) => children;
