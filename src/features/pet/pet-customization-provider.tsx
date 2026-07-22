"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { usePathname } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { api } from "@convex/_generated/api";
import {
	getDemoAccountSnapshot,
	loadDemoWalletState,
	spendDemoCoins,
	subscribeDemoAccount,
} from "@/features/account/demo-account-storage";
import {
	DEFAULT_OWNED_PET_SKINS,
	DEFAULT_PET_CUSTOMIZATION,
	getPetHair,
	getPetSkin,
	getPetSkinPurchasePrice,
	isPetHairId,
	isPetSkinId,
	loadGuestPetState,
	normalizeOwnedPetSkins,
	saveGuestPetState,
	type PetCustomization,
	type PetHairId,
	type PetSkinId,
	type StoredPetCustomization,
} from "@/shared/pet/pet-customization";

type PurchaseResult = { ok: boolean; reason?: "insufficient" | "error" };

type PetCustomizationContextValue = {
	isAuthenticated: boolean;
	customization: PetCustomization;
	ownedSkinIds: PetSkinId[];
	skinColor: string;
	hairColor: string;
	coins: number;
	xp: number;
	isLoading: boolean;
	pendingId: string | null;
	chooseHair: (hairId: PetHairId) => Promise<void>;
	purchaseSkin: (skinId: PetSkinId) => Promise<PurchaseResult>;
};

const defaultContext: PetCustomizationContextValue = {
	isAuthenticated: false,
	customization: DEFAULT_PET_CUSTOMIZATION,
	ownedSkinIds: DEFAULT_OWNED_PET_SKINS,
	skinColor: getPetSkin(DEFAULT_PET_CUSTOMIZATION.skinId).color,
	hairColor: getPetHair(DEFAULT_PET_CUSTOMIZATION.hairId).color,
	coins: 0,
	xp: 0,
	isLoading: true,
	pendingId: null,
	chooseHair: async () => undefined,
	purchaseSkin: async () => ({ ok: false, reason: "error" }),
};

const PetCustomizationContext = createContext<PetCustomizationContextValue>(defaultContext);

export function PetCustomizationProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");
	const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
	const serverPet = useQuery(api.pet.get, isAuthenticated ? {} : "skip");
	const setHairMutation = useMutation(api.pet.setHair);
	const purchaseSkinMutation = useMutation(api.pet.purchaseSkin);
	const demoAccountSnapshot = useSyncExternalStore(subscribeDemoAccount, getDemoAccountSnapshot, () => "");
	const demoWallet = useMemo(() => loadDemoWalletState(demoAccountSnapshot), [demoAccountSnapshot]);
	const [guestState, setGuestState] = useState<StoredPetCustomization>(() => ({
		...DEFAULT_PET_CUSTOMIZATION,
		ownedSkinIds: DEFAULT_OWNED_PET_SKINS,
	}));
	const [guestHydrated, setGuestHydrated] = useState(false);
	const [pendingId, setPendingId] = useState<string | null>(null);

	useEffect(() => {
		// localStorage is only available after hydration; reconcile it once.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setGuestState(loadGuestPetState());
		setGuestHydrated(true);
	}, []);

	useEffect(() => {
		if (!guestHydrated || isAuthenticated) return;
		saveGuestPetState(guestState);
	}, [guestHydrated, guestState, isAuthenticated]);

	const value = useMemo<PetCustomizationContextValue>(() => {
		const serverSkinId = serverPet && isPetSkinId(serverPet.skinId) ? serverPet.skinId : null;
		const serverHairId = serverPet && isPetHairId(serverPet.hairId) ? serverPet.hairId : null;
		const customization: PetCustomization = {
			skinId: serverSkinId ?? guestState.skinId,
			hairId: serverHairId ?? guestState.hairId,
		};
		const ownedSkinIds = serverPet
			? normalizeOwnedPetSkins(serverPet.ownedSkinIds, customization.skinId)
			: guestState.ownedSkinIds;
		const balance = serverPet?.balance ?? (isDemo ? demoWallet.balance : 0);
		const xp = serverPet?.xp ?? (isDemo ? demoWallet.xp : 0);
		const skin = getPetSkin(customization.skinId);
		const hair = getPetHair(customization.hairId);

		return {
			isAuthenticated,
			customization,
			ownedSkinIds,
			skinColor: skin.color,
			hairColor: hair.color,
			coins: balance,
			xp,
			isLoading: isAuthLoading || (!isAuthenticated && !guestHydrated) || (isAuthenticated && serverPet === undefined),
			pendingId,
			chooseHair: async (hairId) => {
				if (hairId === customization.hairId) return;
				setPendingId(hairId);
				try {
					if (isAuthenticated) await setHairMutation({ hairId });
					else setGuestState((current) => ({ ...current, hairId }));
				} finally {
					setPendingId(null);
				}
			},
			purchaseSkin: async (skinId) => {
				if (skinId === customization.skinId) return { ok: true };
				const alreadyOwned = ownedSkinIds.includes(skinId);
				const price = getPetSkinPurchasePrice(skinId, ownedSkinIds);
				if (price > balance) return { ok: false, reason: "insufficient" };

				setPendingId(skinId);
				try {
					if (isAuthenticated) {
						await purchaseSkinMutation({ skinId });
					} else {
						if (price > 0 && (!isDemo || !spendDemoCoins(price))) return { ok: false, reason: "error" };
						setGuestState((current) => ({
							...current,
							skinId,
							ownedSkinIds: alreadyOwned ? current.ownedSkinIds : [...current.ownedSkinIds, skinId],
						}));
					}
					return { ok: true };
				} catch {
					return { ok: false, reason: "error" };
				} finally {
					setPendingId(null);
				}
			},
		};
	}, [demoWallet.balance, demoWallet.xp, guestHydrated, guestState, isAuthenticated, isAuthLoading, isDemo, pendingId, purchaseSkinMutation, serverPet, setHairMutation]);

	const style = {
		"--akin-skin-color": value.skinColor,
		"--akin-hair-color": value.hairColor,
	} as CSSProperties;

	return (
		<PetCustomizationContext.Provider value={value}>
			<div style={style} data-pet-customization-root="true">{children}</div>
		</PetCustomizationContext.Provider>
	);
}

export function usePetCustomization() {
	return useContext(PetCustomizationContext);
}
