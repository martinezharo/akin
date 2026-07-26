"use client";

import { House, LockKeyhole, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { getExperiencePath } from "@/shared/routing/experience-paths";
import { ui } from "@/i18n";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import motionStyles from "@/shared/ui/akin-mascot-motion.module.css";
import styles from "./app-navigation.module.css";

export type AppNavigationProps = {
	accountControl?: ReactNode;
	onLockedFriendsClick?: () => void;
	onLockedPetClick?: () => void;
};

export function AppNavigation({
	accountControl,
	onLockedFriendsClick,
	onLockedPetClick,
}: AppNavigationProps) {
	const pathname = usePathname();
	const homeHref = getExperiencePath(pathname, "home");
	const petHref = getExperiencePath(pathname, "/pet");
	const friendsHref = getExperiencePath(pathname, "/friends");
	const meHref = getExperiencePath(pathname, "/me");

	return (
		<nav className={styles.navigation} aria-label={ui.navigation.label}>
			<Link className={styles.item} href={homeHref} aria-current={pathname === homeHref ? "page" : undefined}>
				<House aria-hidden="true" />
				<span>{ui.navigation.home}</span>
			</Link>

			{onLockedFriendsClick ? (
				<button className={styles.item} type="button" onClick={onLockedFriendsClick}>
					<UsersRound aria-hidden="true" />
					<span>{ui.navigation.friends}</span>
				</button>
			) : (
				<Link className={styles.item} href={friendsHref} aria-current={pathname === friendsHref ? "page" : undefined}>
					<UsersRound aria-hidden="true" />
					<span>{ui.navigation.friends}</span>
				</Link>
			)}

			{onLockedPetClick ? (
				<button
					className={`${styles.item} ${styles.akinItem} ${styles.akinLocked}`}
					type="button"
					onClick={onLockedPetClick}
					aria-label={ui.navigation.lockedPet}
				>
					<span className={styles.akinIcon} aria-hidden="true">
						<AkinMascotArtwork className={styles.akinArtwork} viewBox="400 900 4216 3216" />
						<span className={styles.akinLock}><LockKeyhole /></span>
					</span>
				</button>
			) : (
				<Link className={`${styles.item} ${styles.akinItem}`} href={petHref} aria-current={pathname === petHref ? "page" : undefined}>
					<span className={`${styles.akinIcon} ${motionStyles.interactive}`} aria-hidden="true">
						<AkinMascotArtwork className={`${styles.akinArtwork} ${motionStyles.animated}`} viewBox="400 900 4216 3216" />
					</span>
				</Link>
			)}

			<div className={styles.control}>
				{accountControl ?? (
					<Link className={styles.item} href={meHref} aria-current={pathname === meHref ? "page" : undefined} aria-label={ui.account.me}>
						<UserRound aria-hidden="true" />
						<span>{ui.account.me}</span>
					</Link>
				)}
			</div>

			<div className={styles.control}>
				<AppPreferences placement="navigation" />
			</div>
		</nav>
	);
}
