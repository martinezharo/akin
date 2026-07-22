"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getExperiencePath } from "@/shared/routing/experience-paths";
import { AkinMascotArtwork } from "./akin-mascot-artwork";
import motionStyles from "./akin-mascot-motion.module.css";
import styles from "./akin-mascot.module.css";

export function AkinMascot() {
	const pathname = usePathname();

	return (
		<Link
			className={styles.mascot}
			href={getExperiencePath(pathname, "/pet")}
			aria-label="Visit your pet"
		>
			<AkinMascotArtwork className={`${styles.artwork} ${motionStyles.animated}`} />
		</Link>
	);
}
