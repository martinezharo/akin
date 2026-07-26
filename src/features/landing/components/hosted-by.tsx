import { ui } from "@/i18n/en";
import styles from "./hosted-by.module.css";

/** Where Akin actually runs. */
export const CUBEPATH_URL = "https://cubepath.com/";

const copy = ui.landing;

/**
 * The hosting credit in the footer. Quiet by default and only as loud as a
 * signature — it should read as a mark of who runs the thing, never as an ad.
 */
export function HostedBy() {
	return (
		<span className={styles.credit}>
			<span className={styles.prefix}>{copy.poweredBy}</span>
			<a
				className={styles.link}
				href={CUBEPATH_URL}
				target="_blank"
				rel="noreferrer noopener"
				aria-label={copy.hostLinkLabel}
			>
				{copy.hostLabel}
			</a>
		</span>
	);
}
