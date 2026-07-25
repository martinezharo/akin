"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getExperiencePath } from "@/shared/routing/experience-paths";
import { ui } from "@/i18n/en";
import styles from "../account.module.css";

/**
 * The dock follows whichever experience it is mounted in: on `/demo/*` it keeps
 * the visitor inside the demo, so there is no separate demo variant.
 */
export function AccountDock({ avatarBadge }: { avatarBadge?: string }) {
	const pathname = usePathname();
	const meHref = getExperiencePath(pathname, "/me");

	return (
		<Link className={styles.accountButton} href={meHref} aria-current={pathname === meHref ? "page" : undefined} aria-label={ui.account.dockLabel}>
			<UserRound aria-hidden="true" />
			<span>{ui.account.me}</span>
			{avatarBadge ? <small>{avatarBadge}</small> : null}
		</Link>
	);
}
