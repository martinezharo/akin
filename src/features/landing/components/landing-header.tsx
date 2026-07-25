"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ui } from "@/i18n/en";
import { APP_HOME_PATH } from "@/shared/routing/experience-paths";
import styles from "./landing-header.module.css";

/** Far enough that a stray trackpad twitch does not draw the border. */
const SETTLE_OFFSET = 12;

/**
 * Sticky, and invisible until it has something to sit on top of: at the top of
 * the page the header is just the logo floating over the hero, and it only
 * grows a surface and a hairline once content starts sliding underneath it.
 */
export function LandingHeader() {
	const [lifted, setLifted] = useState(false);

	useEffect(() => {
		function syncLift() {
			setLifted(window.scrollY > SETTLE_OFFSET);
		}

		syncLift();
		window.addEventListener("scroll", syncLift, { passive: true });
		return () => window.removeEventListener("scroll", syncLift);
	}, []);

	return (
		<header className={styles.header} data-lifted={lifted || undefined}>
			<div className={styles.inner}>
				<Link className={styles.brand} href="/" aria-label={ui.landing.logoLabel}>
					<Image
						className={styles.mark}
						src="/brand/akin-app-icon.svg"
						alt=""
						width={36}
						height={36}
						priority
					/>
					<span className={styles.name}>{ui.metadata.title}</span>
				</Link>
				<Link className={styles.action} href={APP_HOME_PATH}>
					{ui.landing.enterAction}
				</Link>
			</div>
		</header>
	);
}
