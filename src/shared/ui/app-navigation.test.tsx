/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppNavigation } from "./app-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("./akin-mascot-artwork", () => ({
	AkinMascotArtwork: () => <svg data-testid="nav-companion" />,
}));

afterEach(cleanup);

describe("AppNavigation", () => {
	it("shows a locked companion button that requests authentication", async () => {
		const user = userEvent.setup();
		const onLockedFriendsClick = vi.fn();
		const onLockedPetClick = vi.fn();

		render(
			<AppNavigation
				onLockedFriendsClick={onLockedFriendsClick}
				onLockedPetClick={onLockedPetClick}
				preferencesControl={<button type="button">Preferences</button>}
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
