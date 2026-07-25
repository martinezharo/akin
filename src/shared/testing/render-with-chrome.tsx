import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { AppChromeProvider } from "@/features/navigation/app-chrome";

/**
 * Renders a page the way the app does: inside the persistent chrome, so the
 * wallet pills and the username badge a page publishes are actually mounted.
 */
export function renderWithChrome(ui: ReactElement) {
	return render(<AppChromeProvider>{ui}</AppChromeProvider>);
}
