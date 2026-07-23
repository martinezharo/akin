/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PET_SKINS } from "@/domain/pet/pet-catalog";
import { ColorRail } from "./color-rail";

afterEach(cleanup);

describe("pet color rail", () => {
	it("preserves ownership labels and selection callbacks", async () => {
		const user = userEvent.setup();
		const onSelect = vi.fn();

		render(
			<ColorRail
				options={PET_SKINS}
				selectedId="ember"
				equippedId="ember"
				ownedIds={["ember"]}
				onSelect={onSelect}
				label="Skin colors"
			/>,
		);

		expect(screen.getByRole("button", { name: "Ember, owned" }).getAttribute("aria-pressed")).toBe("true");
		expect(screen.getByRole("button", { name: "Cinnamon, 35 coins" })).toBeTruthy();
		await user.click(screen.getByRole("button", { name: "Cinnamon, 35 coins" }));
		expect(onSelect).toHaveBeenCalledWith("cinnamon");
	});
});
