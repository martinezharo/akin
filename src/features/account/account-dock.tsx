"use client";

import { UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getExperiencePath } from "@/shared/routing/experience-paths";
import styles from "./account.module.css";

type AccountDockViewProps = {
	avatarBadge?: string;
};

function AccountDockView({
	avatarBadge,
}: AccountDockViewProps) {
	const pathname = usePathname();
	const meHref = getExperiencePath(pathname, "/me");

	return (
		<Link className={styles.accountButton} href={meHref} aria-current={pathname === meHref ? "page" : undefined} aria-label="Open account and reward settings">
			<UserRound aria-hidden="true" />
			<span>Me</span>
			{avatarBadge ? <small>{avatarBadge}</small> : null}
		</Link>
	);
}

export function AccountDock({ avatarBadge }: { avatarBadge?: string }) {
	return <AccountDockView avatarBadge={avatarBadge} />;
}

export function DemoAccountDock({
	avatarBadge,
}: {
	avatarBadge?: string;
}) {
	return <AccountDockView avatarBadge={avatarBadge} />;
}
