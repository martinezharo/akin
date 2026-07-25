/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppNavigation } from "./app-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/features/preferences/app-preferences", () => ({ AppPreferences: () => null }));
vi.mock("@/shared/ui/akin-mascot-artwork", () => ({
	AkinMascotArtwork: () => <svg data-testid="nav-companion" />,
}));

afterEach(cleanup);

describe("AppNavigation", () => {
	it("sends home to the app, not back to the landing at /", () => {
		render(<AppNavigation />);

		expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/streaks");
	});

	it("shows a locked companion button that requests authentication", async () => {
		const user = userEvent.setup();
		const onLockedFriendsClick = vi.fn();
		const onLockedPetClick = vi.fn();

		render(
			<AppNavigation
				onLockedFriendsClick={onLockedFriendsClick}
				onLockedPetClick={onLockedPetClick}
			/>,
		);

		expect(screen.queryByRole("link", { name: "Friends" })).toBeNull();
		await user.click(screen.getByRole("button", { name: "Friends" }));
		expect(onLockedFriendsClick).toHaveBeenCalledOnce();
		expect(screen.queryByRole("link", { name: /companion/i })).toBeNull();
		await user.click(screen.getByRole("button", { name: "Sign in to unlock your Akin companion" }));
		expect(onLockedPetClick).toHaveBeenCalledOnce();
	});
});
