"use client";

import { Check, Coins, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AccountDock } from "@/features/account/account-dock";
import { AccountRewardsBalance } from "@/features/account/components/account-rewards-balance";
import { AuthModal } from "@/features/account/auth-modal";
import { RemoteUsernamePresence } from "@/features/account/components/username-setup-modal";
import accountStyles from "@/features/account/account.module.css";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { useLocalDay } from "@/features/streaks/app/use-local-day";
import {
	getPetHair,
	getPetSkin,
	PET_HAIRS,
	PET_SKINS,
	type PetHairId,
	type PetSkinId,
} from "@/domain/pet/pet-catalog";
import { AppNavigation } from "@/shared/ui/app-navigation";
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
					? `You need ${Math.max(0, draftSkin.price - coins)} more coins for ${draftSkin.name}.`
					: "That look could not be saved. Try again.");
				return;
			}
		}

		if (hairChanged) {
			try {
				await chooseHair(draftHairId);
			} catch {
				showNotice("The hair color could not be saved. Try again.");
				return;
			}
		}

		showNotice(skinChanged && !skinIsOwned ? `${draftSkin.name} is yours forever.` : "New look equipped.");
	}

	const actionLabel = pendingId
		? "Saving…"
		: !hasChanges
			? "Current look"
			: skinChanged && !skinIsOwned
				? `Unlock for ${draftSkin.price}`
				: "Wear this look";

	return (
		<main className={styles.page}>
			{isAuthenticated && !isDemo ? <RemoteUsernamePresence today={today} timeZone={timeZone} /> : null}
			<div className={styles.ambient} aria-hidden="true"><span /><span /></div>
			{hasChanges ? (
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
			<div className={styles.content}>
				<AccountRewardsBalance balance={coins} xp={xp} />
				<PetCompanionStage skinColor={draftSkin.color} hairColor={draftHair.color} />

				<section className={styles.studio} aria-labelledby="studio-title">
					<div className={styles.studioHeading}>
						<h2 id="studio-title">Choose a look</h2>
						{hasChanges ? <button type="button" className={styles.reset} onClick={resetPreview}><RotateCcw aria-hidden="true" /> Reset</button> : null}
					</div>

					<div className={styles.tabs} role="tablist" aria-label="Customize companion">
						<button type="button" role="tab" aria-selected={activePart === "skin"} onClick={() => setActivePart("skin")}>Skin</button>
						<button type="button" role="tab" aria-selected={activePart === "hair"} onClick={() => setActivePart("hair")}>Hair</button>
					</div>

					{activePart === "skin" ? (
						<ColorRail
							options={PET_SKINS}
							selectedId={draftSkinId}
							equippedId={customization.skinId}
							ownedIds={ownedSkinIds}
							onSelect={(id) => setDraftSkinId(id as PetSkinId)}
							label="Skin colors"
						/>
					) : (
						<ColorRail
							options={PET_HAIRS}
							selectedId={draftHairId}
							equippedId={customization.hairId}
							onSelect={(id) => setDraftHairId(id as PetHairId)}
							label="Hair colors"
						/>
					)}

					<div className={styles.selectionSummary}>
						<div><span>Previewing</span><strong>{draftSkin.name} · {draftHair.name}</strong></div>
						{missingCoins > 0
							? <small>Missing {missingCoins} coins</small>
							: skinChanged && !skinIsOwned
								? <small>Yours after purchase</small>
								: <small>{hasChanges ? "Already owned" : "Equipped"}</small>}
					</div>
					<p className={styles.ownershipNote}>Unlocked skin colors stay in your wardrobe. Switching between them is free.</p>
				</section>
				{isLoading ? <p className={styles.loading}>Waking up your companion…</p> : null}
			</div>
			{notice ? <div className={styles.notice} role="status"><Check aria-hidden="true" /> {notice}</div> : null}
			<AppNavigation
				accountControl={isDemo ? undefined : isAuthenticated ? <AccountDock /> : (
					<button className={accountStyles.accountButton} type="button" onClick={() => setAuthOpen(true)} aria-label="Sign in or open your account">
						<UserRound aria-hidden="true" />
						<span>Me</span>
					</button>
				)}
				preferencesControl={<AppPreferences placement="navigation" />}
			/>
			{authOpen && !isAuthenticated ? <AuthModal onDismiss={() => setAuthOpen(false)} /> : null}
		</main>
	);
}
