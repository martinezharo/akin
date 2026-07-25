/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppChromeProvider, useAppChrome } from "./app-chrome";

const mocks = vi.hoisted(() => ({ pathname: "/streaks" }));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@/features/preferences/app-preferences", () => ({ AppPreferences: () => null }));
vi.mock("@/shared/ui/akin-mascot-artwork", () => ({
	AkinMascotArtwork: () => <svg data-testid="nav-companion" />,
}));

afterEach(cleanup);

function PresencePage() {
	useAppChrome({ presence: { kind: "known", username: "demo" } });
	return <p>page</p>;
}

function WalletPage() {
	useAppChrome({ wallet: { kind: "account", balance: 12, xp: 3 } });
	return <p>page</p>;
}

describe("AppChromeProvider", () => {
	it("frames app routes with the navigation and the wallet", () => {
		mocks.pathname = "/streaks";

		render(<AppChromeProvider><WalletPage /></AppChromeProvider>);

		expect(screen.getByRole("navigation", { name: "Main navigation" })).not.toBeNull();
		expect(screen.getByLabelText("12 coins, 3 XP")).not.toBeNull();
	});

	it("swaps the demo's name badge for the way back to the landing", () => {
		mocks.pathname = "/demo/friends";

		render(<AppChromeProvider><PresencePage /></AppChromeProvider>);

		const exit = screen.getByRole("link", { name: "Leave the demo and go back to the landing page" });
		expect(exit.getAttribute("href")).toBe("/");
		expect(screen.queryByText("@demo")).toBeNull();
	});

	it("keeps the name badge outside the demo", () => {
		mocks.pathname = "/streaks";

		render(<AppChromeProvider><PresencePage /></AppChromeProvider>);

		expect(screen.getByText("@demo")).not.toBeNull();
	});

	it("leaves the landing to paint its own frame", () => {
		mocks.pathname = "/";

		render(<AppChromeProvider><WalletPage /></AppChromeProvider>);

		expect(screen.queryByRole("navigation")).toBeNull();
		expect(screen.queryByLabelText("12 coins, 3 XP")).toBeNull();
		// The page underneath still renders — only its frame is withheld.
		expect(screen.getByText("page")).not.toBeNull();
	});
});
