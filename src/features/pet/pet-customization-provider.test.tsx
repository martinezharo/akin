/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEMO_ACCOUNT_STORAGE_KEY,
	DEMO_STARTING_COINS,
} from "@/features/account/demo-account-storage";
import {
	DEMO_PET_CUSTOMIZATION_STORAGE_KEY,
	type StoredPetCustomization,
} from "@/shared/pet/pet-customization";
import {
	PetCustomizationProvider,
	usePetCustomization,
} from "./pet-customization-provider";

const mocks = vi.hoisted(() => ({
	pathname: "/demo/pet",
	remoteMutation: vi.fn(),
	useQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: () => mocks.pathname,
}));

vi.mock("convex/react", () => ({
	useConvexAuth: () => ({ isAuthenticated: true, isLoading: false }),
	useMutation: () => mocks.remoteMutation,
	useQuery: (...args: unknown[]) => mocks.useQuery(...args),
}));

function PetStateProbe() {
	const pet = usePetCustomization();
	return (
		<>
			<output aria-label="pet state">
				{pet.customization.skinId}:{pet.coins}:{String(pet.isAuthenticated)}
			</output>
			<button type="button" onClick={() => void pet.purchaseSkin("cinnamon")}>
				Buy cinnamon
			</button>
		</>
	);
}

beforeEach(() => {
	localStorage.clear();
	localStorage.setItem(
		DEMO_ACCOUNT_STORAGE_KEY,
		JSON.stringify({
			balance: DEMO_STARTING_COINS,
			lifetimeEarned: DEMO_STARTING_COINS,
			xp: 0,
			rewardEligibleStreakIds: [],
		}),
	);
	mocks.useQuery.mockImplementation((...args: unknown[]) =>
		args[1] === "skip"
			? undefined
			: {
					skinId: "sky",
					hairId: "rose",
					ownedSkinIds: ["ember", "sky"],
					balance: 1,
					xp: 99,
				},
	);
});

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe("PetCustomizationProvider demo isolation", () => {
	it("uses demo storage and never reaches authenticated pet mutations", async () => {
		const user = userEvent.setup();
		render(
			<PetCustomizationProvider>
				<PetStateProbe />
			</PetCustomizationProvider>,
		);

		await waitFor(() => {
			expect(screen.getByLabelText("pet state").textContent).toBe(
				`ember:${DEMO_STARTING_COINS}:false`,
			);
		});
		expect(mocks.useQuery).toHaveBeenCalledWith(expect.anything(), "skip");

		await user.click(screen.getByRole("button", { name: "Buy cinnamon" }));

		await waitFor(() => {
			expect(screen.getByLabelText("pet state").textContent).toBe(
				`cinnamon:${DEMO_STARTING_COINS - 35}:false`,
			);
		});
		expect(mocks.remoteMutation).not.toHaveBeenCalled();
		const stored = JSON.parse(
			localStorage.getItem(DEMO_PET_CUSTOMIZATION_STORAGE_KEY) ?? "null",
		) as StoredPetCustomization;
		expect(stored).toMatchObject({
			skinId: "cinnamon",
			ownedSkinIds: ["ember", "cinnamon"],
		});
	});
});
