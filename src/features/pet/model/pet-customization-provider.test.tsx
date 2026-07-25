/** @vitest-environment jsdom */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	DEMO_ACCOUNT_STORAGE_KEY,
	DEMO_STARTING_COINS,
} from "@/features/account/demo/demo-account-storage";
import type { StoredPetCustomization } from "@/domain/pet/pet-customization";
import { DEMO_PET_CUSTOMIZATION_STORAGE_KEY } from "@/infrastructure/storage/demo-pet-storage";
import {
	PetCustomizationProvider,
	usePetCustomization,
} from "./pet-customization-provider";

const mocks = vi.hoisted(() => ({
	pathname: "/demo/pet",
	isAuthenticated: true,
	remoteMutation: vi.fn(),
	useQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	usePathname: () => mocks.pathname,
}));

vi.mock("convex/react", () => ({
	useConvexAuth: () => ({ isAuthenticated: mocks.isAuthenticated, isLoading: false }),
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
	mocks.pathname = "/demo/pet";
	mocks.isAuthenticated = true;
});

describe("PetCustomizationProvider demo isolation", () => {
	it("does not persist pet state for unauthenticated users", async () => {
		mocks.pathname = "/";
		mocks.isAuthenticated = false;
		render(
			<PetCustomizationProvider>
				<PetStateProbe />
			</PetCustomizationProvider>,
		);

		await waitFor(() => {
			expect(screen.getByLabelText("pet state").textContent).toBe("ember:0:false");
		});
		expect(localStorage.getItem(DEMO_PET_CUSTOMIZATION_STORAGE_KEY)).toBeNull();
	});

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
