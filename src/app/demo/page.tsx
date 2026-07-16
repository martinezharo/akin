import styles from "@/features/streaks/app/streaks-page.module.css";
import { StreaksDemo } from "@/features/streaks/app/streaks-demo";

export default function DemoPage() {
	return (
		<main className={styles.page}>
			<StreaksDemo />
		</main>
	);
}
