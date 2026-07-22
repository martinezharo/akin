import { AppPreferences } from "@/features/preferences/app-preferences";
import { AppNavigation } from "@/shared/ui/app-navigation";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import styles from "./page.module.css";

export default function PetPage() {
	return (
		<main className={styles.page}>
			<section className={styles.preview} aria-labelledby="pet-title">
				<AkinMascotArtwork className={styles.mascot} />
				<p>A new little corner</p>
				<h1 id="pet-title">Akin’s room is taking shape.</h1>
				<span>The companion controls will live here soon.</span>
			</section>
			<AppNavigation preferencesControl={<AppPreferences placement="navigation" />} />
		</main>
	);
}
