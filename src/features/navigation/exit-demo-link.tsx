import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ui } from "@/i18n/en";
import { LANDING_PATH } from "@/shared/routing/experience-paths";
import styles from "./exit-demo-link.module.css";

/**
 * The demo's way out. It takes the username badge's corner — a tour has no
 * name to show there anyway — so the visitor always has a door back to the
 * landing page without the chrome growing an extra control.
 */
export function ExitDemoLink() {
	return (
		<Link className={styles.exit} href={LANDING_PATH} aria-label={ui.demo.exitLabel}>
			<ArrowLeft aria-hidden="true" />
			<strong>{ui.demo.exit}</strong>
		</Link>
	);
}
