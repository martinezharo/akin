/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PET_SKINS } from "@/domain/pet/pet-catalog";
import { ui } from "@/i18n";
import { CompanionPreview } from "./companion-preview";

afterEach(cleanup);

describe("CompanionPreview", () => {
	it("lets a visitor try the wardrobe on before signing up", async () => {
		const user = userEvent.setup();
		const [firstSkin, secondSkin] = PET_SKINS;

		const { container } = render(<CompanionPreview />);
		const stage = container.firstElementChild as HTMLElement;

		expect(screen.getByRole("button", { name: `Try ${ui.pet.skinNames[firstSkin.id]}` }).getAttribute("aria-pressed")).toBe("true");
		expect(stage.style.getPropertyValue("--akin-skin-color")).toBe(firstSkin.color);

		await user.click(screen.getByRole("button", { name: `Try ${ui.pet.skinNames[secondSkin.id]}` }));

		expect(stage.style.getPropertyValue("--akin-skin-color")).toBe(secondSkin.color);
		expect(screen.getByRole("button", { name: `Try ${ui.pet.skinNames[secondSkin.id]}` }).getAttribute("aria-pressed")).toBe("true");
		expect(screen.getByRole("button", { name: `Try ${ui.pet.skinNames[firstSkin.id]}` }).getAttribute("aria-pressed")).toBe("false");
	});

	it("quotes the price the catalog actually charges", () => {
		render(<CompanionPreview />);

		// The starter skin is free, so it is labelled rather than priced.
		expect(screen.getByRole("button", { name: `Try ${ui.pet.skinNames[PET_SKINS[0].id]}` }).textContent).toContain(ui.pet.colorRail.ownedLabel);
		for (const skin of PET_SKINS.filter((option) => option.price > 0)) {
			expect(screen.getByRole("button", { name: `Try ${ui.pet.skinNames[skin.id]}` }).textContent).toContain(String(skin.price));
		}
	});
});
