"use client";

import { usePathname } from "next/navigation";
import { PetStudio } from "./components/pet-studio";
import { GuestPetGate } from "./experiences/guest-pet-gate";
import { usePetCustomization } from "./model/pet-customization-provider";

export function PetPage() {
	const pet = usePetCustomization();
	const pathname = usePathname();
	const equippedKey = `${pet.customization.skinId}:${pet.customization.hairId}`;
	const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");

	if (!isDemo && !pet.isAuthenticated) return <GuestPetGate isLoading={pet.isLoading} />;

	return <PetStudio {...pet} isDemo={isDemo} key={equippedKey} />;
}
