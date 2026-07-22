/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DemoAccountDock } from "./account-dock";

afterEach(cleanup);

describe("account navigation", () => {
	it("takes the user to the standalone Me page", () => {
		render(<DemoAccountDock />);

		const link = screen.getByRole("link", { name: "Open account and reward settings" });
		expect(link.getAttribute("href")).toBe("/me");
		expect(screen.queryByRole("dialog")).toBeNull();
	});
});
