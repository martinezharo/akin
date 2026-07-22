/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PetPage } from "./pet-page";

const mocks = vi.hoisted(() => ({
	purchaseSkin: vi.fn().mockResolvedValue({ ok: true }),
	chooseHair: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/demo/pet" }));
vi.mock("@/features/preferences/app-preferences", () => ({ AppPreferences: () => null }));
vi.mock("@/shared/ui/app-navigation", () => ({ AppNavigation: () => <nav aria-label="App navigation" /> }));
vi.mock("@/shared/ui/akin-mascot-artwork", () => ({
	AkinMascotArtwork: ({ className }: { className?: string }) => <svg className={className} data-testid="companion-artwork" />,
}));
vi.mock("./pet-customization-provider", () => ({
	usePetCustomization: () => ({
		customization: { skinId: "ember", hairId: "honey" },
		ownedSkinIds: ["ember"],
		skinColor: "#E84B1B",
		hairColor: "#FFD382",
		coins: 100,
		xp: 40,
		isLoading: false,
		pendingId: null,
		chooseHair: mocks.chooseHair,
		purchaseSkin: mocks.purchaseSkin,
	}),
}));

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
	vi.restoreAllMocks();
});

describe("pet studio", () => {
	it("previews a paid skin without purchasing until confirmation", async () => {
		const user = userEvent.setup();
		render(<PetPage />);

		await user.click(screen.getByRole("button", { name: "Moss, 55 coins" }));

		expect(mocks.purchaseSkin).not.toHaveBeenCalled();
		expect(screen.getByTestId("companion-artwork").closest("section")?.getAttribute("style")).toContain("#698260");
		const purchaseButton = screen.getByRole("button", { name: /unlock for 55/i });

		await user.click(purchaseButton);
		expect(mocks.purchaseSkin).toHaveBeenCalledOnce();
		expect(mocks.purchaseSkin).toHaveBeenCalledWith("moss");
	});

	it("reacts to touch-style pointer input", () => {
		render(<PetPage />);
		const petButton = screen.getByRole("button", { name: "Pet your companion" });
		const firstArtwork = screen.getByTestId("companion-artwork");

		fireEvent.pointerDown(petButton, { pointerId: 1 });
		const secondArtwork = screen.getByTestId("companion-artwork");
		fireEvent.pointerDown(petButton, { pointerId: 2 });

		expect(petButton.getAttribute("data-interacting")).toBe("true");
		expect(secondArtwork).not.toBe(firstArtwork);
		expect(screen.getByTestId("companion-artwork")).not.toBe(secondArtwork);
		expect(screen.getByText(/tickles|again|happy spot|best part/i)).toBeTruthy();
	});

	it("restarts the petting gesture when the mouse moves over the companion", () => {
		render(<PetPage />);
		const petButton = screen.getByRole("button", { name: "Pet your companion" });
		const firstArtwork = screen.getByTestId("companion-artwork");
		vi.spyOn(window.performance, "now").mockReturnValueOnce(0).mockReturnValueOnce(901);

		fireEvent.pointerMove(petButton, { pointerType: "mouse" });
		const secondArtwork = screen.getByTestId("companion-artwork");
		fireEvent.pointerMove(petButton, { pointerType: "mouse" });

		expect(petButton.getAttribute("data-interacting")).toBe("true");
		expect(secondArtwork).not.toBe(firstArtwork);
		expect(screen.getByTestId("companion-artwork")).not.toBe(secondArtwork);
	});

	it("shows coins and XP in the page header", () => {
		render(<PetPage />);

		const wallet = screen.getByLabelText("100 coins, 40 XP");
		expect(wallet.className).toContain("walletPills");
	});
});
