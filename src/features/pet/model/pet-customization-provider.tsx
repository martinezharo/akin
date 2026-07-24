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
} from "@/features/account/demo/demo-account-storage";
import {
	getPetHair,
	getPetSkin,
	isPetHairId,
	isPetSkinId,
	type PetHairId,
	type PetSkinId,
} from "@/domain/pet/pet-catalog";
import {
	DEFAULT_OWNED_PET_SKINS,
	DEFAULT_PET_CUSTOMIZATION,
	getPetSkinPurchasePrice,
	normalizeOwnedPetSkins,
	type PetCustomization,
	type StoredPetCustomization,
} from "@/domain/pet/pet-customization";
import {
	loadDemoPetState,
	saveDemoPetState,
} from "@/infrastructure/storage/demo-pet-storage";

type PurchaseResult = { ok: boolean; reason?: "insufficient" | "error" };

export type PetCustomizationContextValue = {
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
	const usesRemotePet = isAuthenticated && !isDemo;
	const serverPet = useQuery(api.pet.get, usesRemotePet ? {} : "skip");
	const setHairMutation = useMutation(api.pet.setHair);
	const purchaseSkinMutation = useMutation(api.pet.purchaseSkin);
	const demoAccountSnapshot = useSyncExternalStore(subscribeDemoAccount, getDemoAccountSnapshot, () => "");
	const demoWallet = useMemo(() => loadDemoWalletState(demoAccountSnapshot), [demoAccountSnapshot]);
	const [demoState, setDemoState] = useState<StoredPetCustomization>(() => ({
		...DEFAULT_PET_CUSTOMIZATION,
		ownedSkinIds: DEFAULT_OWNED_PET_SKINS,
	}));
	const [localStateHydrated, setLocalStateHydrated] = useState(false);
	const [pendingId, setPendingId] = useState<string | null>(null);

	useEffect(() => {
		// localStorage is only available after hydration; reconcile it once.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setDemoState(loadDemoPetState());
		setLocalStateHydrated(true);
	}, []);

	useEffect(() => {
		if (!localStateHydrated || !isDemo) return;
		saveDemoPetState(demoState);
	}, [demoState, isDemo, localStateHydrated]);

	const value = useMemo<PetCustomizationContextValue>(() => {
		const localCustomization = isDemo ? demoState : DEFAULT_PET_CUSTOMIZATION;
		const serverSkinId = serverPet && isPetSkinId(serverPet.skinId) ? serverPet.skinId : null;
		const serverHairId = serverPet && isPetHairId(serverPet.hairId) ? serverPet.hairId : null;
		const customization: PetCustomization = {
			skinId: serverSkinId ?? localCustomization.skinId,
			hairId: serverHairId ?? localCustomization.hairId,
		};
		const ownedSkinIds = serverPet
			? normalizeOwnedPetSkins(serverPet.ownedSkinIds, customization.skinId)
			: isDemo
				? demoState.ownedSkinIds
				: DEFAULT_OWNED_PET_SKINS;
		const balance = serverPet?.balance ?? (isDemo ? demoWallet.balance : 0);
		const xp = serverPet?.xp ?? (isDemo ? demoWallet.xp : 0);
		const skin = getPetSkin(customization.skinId);
		const hair = getPetHair(customization.hairId);

		return {
			isAuthenticated: usesRemotePet,
			customization,
			ownedSkinIds,
			skinColor: skin.color,
			hairColor: hair.color,
			coins: balance,
			xp,
			isLoading: isDemo
				? !localStateHydrated
				: isAuthLoading || (usesRemotePet && serverPet === undefined),
			pendingId,
			chooseHair: async (hairId) => {
				if (hairId === customization.hairId) return;
				if (!usesRemotePet && !isDemo) return;
				setPendingId(hairId);
				try {
					if (usesRemotePet) {
						await setHairMutation({ hairId });
					} else if (isDemo) {
						setDemoState((current) => ({ ...current, hairId }));
					}
				} finally {
					setPendingId(null);
				}
			},
			purchaseSkin: async (skinId) => {
				if (skinId === customization.skinId) return { ok: true };
				if (!usesRemotePet && !isDemo) return { ok: false, reason: "error" };
				const alreadyOwned = ownedSkinIds.includes(skinId);
				const price = getPetSkinPurchasePrice(skinId, ownedSkinIds);
				if (price > balance) return { ok: false, reason: "insufficient" };

				setPendingId(skinId);
				try {
					if (usesRemotePet) {
						await purchaseSkinMutation({ skinId });
					} else {
						if (price > 0 && !spendDemoCoins(price)) return { ok: false, reason: "error" };
						const updateLocalState = (current: StoredPetCustomization) => ({
							...current,
							skinId,
							ownedSkinIds: alreadyOwned ? current.ownedSkinIds : [...current.ownedSkinIds, skinId],
						});
						setDemoState(updateLocalState);
					}
					return { ok: true };
				} catch {
					return { ok: false, reason: "error" };
				} finally {
					setPendingId(null);
				}
			},
		};
	}, [demoState, demoWallet.balance, demoWallet.xp, isAuthLoading, isDemo, localStateHydrated, pendingId, purchaseSkinMutation, serverPet, setHairMutation, usesRemotePet]);

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
