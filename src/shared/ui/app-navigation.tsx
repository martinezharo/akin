"use client";

import { House, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { getExperiencePath } from "@/shared/routing/experience-paths";
import { AkinMascotArtwork } from "./akin-mascot-artwork";
import motionStyles from "./akin-mascot-motion.module.css";
import styles from "./app-navigation.module.css";

type AppNavigationProps = {
	accountControl?: ReactNode;
	preferencesControl: ReactNode;
};

export function AppNavigation({ accountControl, preferencesControl }: AppNavigationProps) {
	const pathname = usePathname();
	const homeHref = getExperiencePath(pathname, "/");
	const akinHref = getExperiencePath(pathname, "/akin");

	return (
		<nav className={styles.navigation} aria-label="Main navigation">
			<Link className={styles.item} href={homeHref} aria-current={pathname === homeHref ? "page" : undefined}>
				<House aria-hidden="true" />
				<span>Home</span>
			</Link>

			<button className={styles.item} type="button" disabled aria-label="Friends, coming soon">
				<UsersRound aria-hidden="true" />
				<span>Friends</span>
				<small aria-hidden="true">Soon</small>
			</button>

			<Link className={`${styles.item} ${styles.akinItem}`} href={akinHref} aria-current={pathname === akinHref ? "page" : undefined}>
				<span className={`${styles.akinIcon} ${motionStyles.interactive}`} aria-hidden="true">
					<AkinMascotArtwork className={`${styles.akinArtwork} ${motionStyles.animated}`} viewBox="400 900 4216 3216" />
				</span>
			</Link>

			<div className={styles.control}>
				{accountControl ?? (
					<Link className={styles.item} href={homeHref} aria-label="Profile">
						<UserRound aria-hidden="true" />
						<span>Profile</span>
					</Link>
				)}
			</div>

			<div className={styles.control}>
				{preferencesControl}
			</div>
		</nav>
	);
}
