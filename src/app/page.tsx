import { AuthGateway } from "@/features/account/auth-gateway";
import styles from "@/features/streaks/app/streaks-page.module.css";

export default function Home() {
	return (
		<main className={styles.page}>
			<AuthGateway />
		</main>
	);
}
