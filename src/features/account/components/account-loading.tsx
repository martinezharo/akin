import Image from "next/image";
import styles from "../account-page.module.css";

export function AccountLoading() {
	return (
		<div className={styles.loading} role="status">
			<span className={styles.loadingLogo}>
				<Image src="/brand/akin-app-icon.svg" alt="" width={56} height={56} priority />
			</span>
			<p>Gathering your little wins…</p>
		</div>
	);
}
