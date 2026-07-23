"use client";

import { Check, Coins, RotateCcw, Sparkles, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import { AccountDock } from "@/features/account/account-dock";
import { AccountRewardsBalance } from "@/features/account/account-rewards-balance";
import { AuthModal } from "@/features/account/auth-modal";
import { GuestAccountControls } from "@/features/account/guest-account-controls";
import { RemoteUsernamePresence } from "@/features/account/username-setup-modal";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { StreaksApp } from "@/features/streaks/app/streaks-app";
import { useLocalDay } from "@/features/streaks/app/use-local-day";
import {
	getPetHair,
	getPetSkin,
	PET_HAIRS,
	PET_SKINS,
	type PetHairId,
	type PetSkinId,
} from "@/shared/pet/pet-customization";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import motionStyles from "@/shared/ui/akin-mascot-motion.module.css";
import { AppNavigation } from "@/shared/ui/app-navigation";
import accountStyles from "@/features/account/account.module.css";
import styles from "./pet-page.module.css";
import { usePetCustomization } from "./pet-customization-provider";

const PETTING_MESSAGES = ["That tickles!", "Again, again!", "You found my happy spot.", "Best part of my day ✦"];
const PETTING_REACTION_DURATION = 780;
const PETTING_MESSAGE_DURATION = 2200;
const POINTER_PET_INTERVAL = 900;

type StudioProps = ReturnType<typeof usePetCustomization>;

export function PetPage() {
	const pet = usePetCustomization();
	const pathname = usePathname();
	const equippedKey = `${pet.customization.skinId}:${pet.customization.hairId}`;
	const isDemo = pathname === "/demo" || pathname.startsWith("/demo/");

	if (!isDemo && !pet.isAuthenticated) return <GuestPetGate isLoading={pet.isLoading} />;

	return <PetStudio {...pet} isDemo={isDemo} key={equippedKey} />;
}

function GuestPetGate({ isLoading }: { isLoading: boolean }) {
	const router = useRouter();

	if (isLoading) return <div className={styles.loading} role="status">Checking your companion’s guest list…</div>;

	return (
		<>
			<StreaksApp />
			<GuestAccountControls initialAuthOpen onAuthDismiss={() => router.replace("/")} />
		</>
	);
}

function PetStudio({
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
}: StudioProps & { isDemo: boolean }) {
	const today = useLocalDay();
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	const [activePart, setActivePart] = useState<"skin" | "hair">("skin");
	const [draftSkinId, setDraftSkinId] = useState<PetSkinId>(customization.skinId);
	const [draftHairId, setDraftHairId] = useState<PetHairId>(customization.hairId);
	const [petting, setPetting] = useState(false);
	const [pettingSequence, setPettingSequence] = useState(0);
	const [showPettingMessage, setShowPettingMessage] = useState(false);
	const [pettingMessage, setPettingMessage] = useState(PETTING_MESSAGES[0]);
	const [notice, setNotice] = useState<string | null>(null);
	const [authOpen, setAuthOpen] = useState(false);
	const pettingTimer = useRef<number | undefined>(undefined);
	const pettingMessageTimer = useRef<number | undefined>(undefined);
	const lastPointerPetAt = useRef(Number.NEGATIVE_INFINITY);
	const noticeTimer = useRef<number | undefined>(undefined);

	useEffect(() => () => {
		window.clearTimeout(pettingTimer.current);
		window.clearTimeout(pettingMessageTimer.current);
		window.clearTimeout(noticeTimer.current);
	}, []);

	const draftSkin = getPetSkin(draftSkinId);
	const draftHair = getPetHair(draftHairId);
	const skinIsOwned = ownedSkinIds.includes(draftSkinId);
	const skinChanged = draftSkinId !== customization.skinId;
	const hairChanged = draftHairId !== customization.hairId;
	const hasChanges = skinChanged || hairChanged;
	const missingCoins = skinIsOwned ? 0 : Math.max(0, draftSkin.price - coins);
	const previewStyle = {
		"--akin-skin-color": draftSkin.color,
		"--akin-hair-color": draftHair.color,
	} as CSSProperties;

	function playPetReaction() {
		window.clearTimeout(pettingTimer.current);
		setPettingSequence((sequence) => sequence + 1);
		setPetting(true);
		pettingTimer.current = window.setTimeout(() => setPetting(false), PETTING_REACTION_DURATION);
	}

	function petCompanion(event?: PointerEvent<HTMLButtonElement>) {
		if (event) event.currentTarget.setPointerCapture?.(event.pointerId);
		playPetReaction();
		window.clearTimeout(pettingMessageTimer.current);
		setPettingMessage(PETTING_MESSAGES[Math.floor(Math.random() * PETTING_MESSAGES.length)]);
		setShowPettingMessage(true);
		pettingMessageTimer.current = window.setTimeout(() => setShowPettingMessage(false), PETTING_MESSAGE_DURATION);
	}

	function petWithPointerMovement(event: PointerEvent<HTMLButtonElement>) {
		if (event.pointerType !== "mouse") return;
		const now = window.performance.now();
		if (now - lastPointerPetAt.current < POINTER_PET_INTERVAL) return;
		lastPointerPetAt.current = now;
		playPetReaction();
	}

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
				<button className={styles.apply} type="button" onClick={() => void applyLook()} disabled={Boolean(pendingId)} data-purchase={skinChanged && !skinIsOwned || undefined}>
					{skinChanged && !skinIsOwned ? <Coins aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
					<span>{actionLabel}</span>
				</button>
			) : null}
			<div className={styles.content}>
				<AccountRewardsBalance balance={coins} xp={xp} />

				<section className={styles.stage} style={previewStyle} aria-label="Your companion">
					<div className={styles.orbit} aria-hidden="true" data-active={petting || undefined} />
					<button
						className={`${styles.petButton} ${motionStyles.interactive}`}
						type="button"
						onPointerDown={petCompanion}
						onPointerMove={petWithPointerMovement}
						onClick={(event) => { if (event.detail === 0) petCompanion(); }}
						data-interacting={petting || undefined}
						data-pointer-motion="true"
						aria-label="Pet your companion"
					>
						<AkinMascotArtwork key={pettingSequence} className={`${styles.petArtwork} ${motionStyles.animated}`} />
						<span className={styles.petShadow} aria-hidden="true" />
					</button>
					<div className={styles.speech} data-visible={showPettingMessage || undefined} aria-live="polite">{pettingMessage}</div>
				</section>

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
						<ColorRail options={PET_SKINS} selectedId={draftSkinId} equippedId={customization.skinId} ownedIds={ownedSkinIds} onSelect={(id) => setDraftSkinId(id as PetSkinId)} label="Skin colors" />
					) : (
						<ColorRail options={PET_HAIRS} selectedId={draftHairId} equippedId={customization.hairId} onSelect={(id) => setDraftHairId(id as PetHairId)} label="Hair colors" />
					)}

					<div className={styles.selectionSummary}>
						<div><span>Previewing</span><strong>{draftSkin.name} · {draftHair.name}</strong></div>
						{missingCoins > 0 ? <small>Missing {missingCoins} coins</small> : skinChanged && !skinIsOwned ? <small>Yours after purchase</small> : <small>{hasChanges ? "Already owned" : "Equipped"}</small>}
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

function ColorRail({ options, selectedId, equippedId, ownedIds, onSelect, label }: {
	options: ReadonlyArray<{ id: string; name: string; color: string; price?: number }>;
	selectedId: string;
	equippedId: string;
	ownedIds?: readonly string[];
	onSelect: (id: string) => void;
	label: string;
}) {
	return (
		<div className={styles.colorRail} role="group" aria-label={label}>
			{options.map((option) => {
				const selected = option.id === selectedId;
				const equipped = option.id === equippedId;
				const owned = option.price === undefined || ownedIds?.includes(option.id);
				return (
					<button key={option.id} type="button" className={styles.colorChoice} onClick={() => onSelect(option.id)} aria-pressed={selected} aria-label={`${option.name}${owned ? ", owned" : option.price ? `, ${option.price} coins` : ""}`}>
						<span className={styles.colorDot} style={{ "--swatch-color": option.color } as CSSProperties}>{equipped ? <Check aria-hidden="true" /> : null}</span>
						<strong>{option.name}</strong>
						<small>{owned ? (equipped ? "On" : "Owned") : <><Coins aria-hidden="true" /> {option.price}</>}</small>
					</button>
				);
			})}
		</div>
	);
}
