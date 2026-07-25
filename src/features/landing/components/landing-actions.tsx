import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ui } from "@/i18n/en";
import { APP_HOME_PATH, DEMO_HOME_PATH } from "@/shared/routing/experience-paths";
import styles from "./landing-actions.module.css";

/**
 * The two doors, in the same order everywhere they appear: the app for people
 * who mean it, the demo for people who are still deciding.
 */
export function LandingActions({ className }: { className?: string }) {
	return (
		<div className={className ? `${styles.actions} ${className}` : styles.actions}>
			<Link className={styles.primary} href={APP_HOME_PATH}>
				{ui.landing.enterAction}
				<ArrowRight aria-hidden="true" />
			</Link>
			<Link className={styles.secondary} href={DEMO_HOME_PATH}>
				{ui.landing.demoAction}
			</Link>
			<p className={styles.hint}>{ui.landing.demoHint}</p>
		</div>
	);
}
