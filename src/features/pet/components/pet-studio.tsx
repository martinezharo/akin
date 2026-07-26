"use client";

import { Check, Coins, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AccountDock } from "@/features/account/components/account-dock";
import { AuthModal } from "@/features/account/components/auth-modal";
import { GuestAccountButton } from "@/features/account/model/use-guest-access";
import { ui } from "@/i18n";
import { useLocalDay } from "@/features/streaks/app/use-local-day";
import {
	getPetHair,
	getPetSkin,
	PET_HAIRS,
	PET_SKINS,
	type PetHairId,
	type PetSkinId,
} from "@/domain/pet/pet-catalog";
import { AppShell } from "@/features/navigation/app-shell";
import type { PetCustomizationContextValue } from "../model/pet-customization-provider";
import { ColorRail } from "./color-rail";
import { PetCompanionStage } from "./pet-companion-stage";
import styles from "../pet-page.module.css";

type StudioProps = PetCustomizationContextValue & { isDemo: boolean };

export function PetStudio({
	isAuthenticated,
	customization,
	ownedSkinIds,
	coins,
	xp,
	isLoading,
	pendingId,
	chooseHair,
	purchaseSkin,
	isDemo,
}: StudioProps) {
	const today = useLocalDay();
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	const [activePart, setActivePart] = useState<"skin" | "hair">("skin");
	const [draftSkinId, setDraftSkinId] = useState<PetSkinId>(customization.skinId);
	const [draftHairId, setDraftHairId] = useState<PetHairId>(customization.hairId);
	const [notice, setNotice] = useState<string | null>(null);
	const [authOpen, setAuthOpen] = useState(false);
	const noticeTimer = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

	const draftSkin = getPetSkin(draftSkinId);
	const draftHair = getPetHair(draftHairId);
	const draftSkinName = ui.pet.skinNames[draftSkin.id];
	const draftHairName = ui.pet.hairNames[draftHair.id];
	const localizedSkins = PET_SKINS.map((skin) => ({ ...skin, name: ui.pet.skinNames[skin.id] }));
	const localizedHairs = PET_HAIRS.map((hair) => ({ ...hair, name: ui.pet.hairNames[hair.id] }));
	const skinIsOwned = ownedSkinIds.includes(draftSkinId);
	const skinChanged = draftSkinId !== customization.skinId;
	const hairChanged = draftHairId !== customization.hairId;
	const hasChanges = skinChanged || hairChanged;
	const missingCoins = skinIsOwned ? 0 : Math.max(0, draftSkin.price - coins);

	function showNotice(message: string) {
		window.clearTimeout(noticeTimer.current);
		setNotice(message);
		noticeTimer.current = window.setTimeout(() => setNotice(null), 2800);
	}

	function resetPreview() {
		setDraftSkinId(customization.skinId);
		setDraftHairId(customization.hairId);
	}

	async function applyLook() {
		if (!hasChanges || pendingId) return;

		if (skinChanged) {
			const result = await purchaseSkin(draftSkinId);
			if (!result.ok) {
				showNotice(result.reason === "insufficient"
					? ui.pet.studio.insufficientCoins(Math.max(0, draftSkin.price - coins), draftSkinName)
					: ui.pet.studio.saveFailed);
				return;
			}
		}

		if (hairChanged) {
			try {
				await chooseHair(draftHairId);
			} catch {
				showNotice(ui.pet.studio.hairFailed);
				return;
			}
		}

		showNotice(skinChanged && !skinIsOwned ? ui.pet.studio.purchased(draftSkinName) : ui.pet.studio.newEquipped);
	}

	const actionLabel = pendingId
		? ui.pet.studio.saving
		: !hasChanges
			? ui.pet.studio.currentLook
			: skinChanged && !skinIsOwned
				? ui.pet.studio.unlockFor(draftSkin.price)
				: ui.pet.studio.wearThis;

	return (
		<AppShell
			variant="canvas"
			accountControl={isDemo ? undefined : isAuthenticated ? <AccountDock /> : <GuestAccountButton onClick={() => setAuthOpen(true)} />}
			wallet={{ kind: "account", balance: coins, xp: xp }}
			presence={isAuthenticated && !isDemo ? { kind: "remote", today, timeZone } : undefined}
			cornerAction={hasChanges ? (
				<button
					className={styles.apply}
					type="button"
					onClick={() => void applyLook()}
					disabled={Boolean(pendingId)}
					data-purchase={skinChanged && !skinIsOwned || undefined}
				>
					{skinChanged && !skinIsOwned ? <Coins aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
					<span>{actionLabel}</span>
				</button>
			) : null}
			backdrop={<div className={styles.ambient} aria-hidden="true"><span /><span /></div>}
			overlay={(
				<>
					{notice ? <div className={styles.notice} role="status"><Check aria-hidden="true" /> {notice}</div> : null}
					{authOpen && !isAuthenticated ? <AuthModal onDismiss={() => setAuthOpen(false)} /> : null}
				</>
			)}
		>
				<PetCompanionStage skinColor={draftSkin.color} hairColor={draftHair.color} />

				<section className={styles.studio} aria-labelledby="studio-title">
					<div className={styles.studioHeading}>
						<h2 id="studio-title">{ui.pet.studio.chooseLook}</h2>
						{hasChanges ? <button type="button" className={styles.reset} onClick={resetPreview}><RotateCcw aria-hidden="true" /> {ui.pet.studio.reset}</button> : null}
					</div>

					<div className={styles.tabs} role="tablist" aria-label={ui.pet.studio.customizeLabel}>
						<button type="button" role="tab" aria-selected={activePart === "skin"} onClick={() => setActivePart("skin")}>{ui.pet.studio.skinTab}</button>
						<button type="button" role="tab" aria-selected={activePart === "hair"} onClick={() => setActivePart("hair")}>{ui.pet.studio.hairTab}</button>
					</div>

					{activePart === "skin" ? (
						<ColorRail
							options={localizedSkins}
							selectedId={draftSkinId}
							equippedId={customization.skinId}
							ownedIds={ownedSkinIds}
							onSelect={(id) => setDraftSkinId(id as PetSkinId)}
							label={ui.pet.studio.skinColors}
						/>
					) : (
						<ColorRail
							options={localizedHairs}
							selectedId={draftHairId}
							equippedId={customization.hairId}
							onSelect={(id) => setDraftHairId(id as PetHairId)}
							label={ui.pet.studio.hairColors}
						/>
					)}

					<div className={styles.selectionSummary}>
						<div><span>{ui.pet.studio.previewing}</span><strong>{draftSkinName} · {draftHairName}</strong></div>
						{missingCoins > 0
							? <small>{ui.pet.studio.missingCoins(missingCoins)}</small>
							: skinChanged && !skinIsOwned
								? <small>{ui.pet.studio.yoursAfterPurchase}</small>
								: <small>{hasChanges ? ui.pet.studio.alreadyOwned : ui.pet.studio.equipped}</small>}
					</div>
					<p className={styles.ownershipNote}>{ui.pet.studio.ownershipNote}</p>
				</section>
			{isLoading ? <p className={styles.loading}>{ui.pet.studio.loading}</p> : null}
		</AppShell>
	);
}
