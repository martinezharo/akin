"use client";

import { ArrowRight, Cloud, Coins, ShieldCheck, Sparkles, X } from "lucide-react";
import { useId, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ui } from "@/i18n/en";
import { APP_HOME_PATH } from "@/shared/routing/experience-paths";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import styles from "../account.module.css";

function GitHubMark() {
	return (
		<svg aria-hidden="true" viewBox="0 0 24 24">
			<path
				fill="currentColor"
				d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.29-5.28-1.28-5.28-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a10.96 10.96 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.2c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z"
			/>
		</svg>
	);
}

export function AuthModal({
	onDismiss,
	callbackURL = APP_HOME_PATH,
}: {
	onDismiss: () => void;
	callbackURL?: string;
}) {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const titleId = useId();
	const descriptionId = useId();

	async function continueWithGitHub() {
		setPending(true);
		setError(null);
		try {
			const result = await authClient.signIn.social({
				provider: "github",
				callbackURL,
			});
			if (!result.error) return;
			setError(result.error.message || ui.account.auth.fallbackError);
		} catch {
			setError(ui.account.auth.fallbackError);
		} finally {
			setPending(false);
		}
	}

	return (
		<ModalDialog
			className={styles.authDialog}
			labelledBy={titleId}
			describedBy={descriptionId}
			onDismiss={onDismiss}
		>
			<div className={styles.authCard}>
				<button className={styles.close} type="button" onClick={onDismiss} aria-label={ui.account.auth.close}>
					<X aria-hidden="true" />
				</button>
				<div className={styles.authMark} aria-hidden="true">
					<Sparkles />
				</div>
				<p className={styles.eyebrow}>{ui.account.auth.kicker}</p>
				<h2 className={styles.authTitle} id={titleId}>
					{ui.account.auth.title}
				</h2>
				<p className={styles.authCopy} id={descriptionId}>
					{ui.account.auth.description}
				</p>
				<ul className={styles.authBenefits} aria-label={ui.account.auth.benefitsLabel}>
					<li><span><Cloud aria-hidden="true" /></span>{ui.account.auth.benefitSync}</li>
					<li><span><Coins aria-hidden="true" /></span>{ui.account.auth.benefitCoins}</li>
					<li><span><Sparkles aria-hidden="true" /></span>{ui.account.auth.benefitCompanion}</li>
					<li><span><ShieldCheck aria-hidden="true" /></span>{ui.account.auth.benefitSafe}</li>
				</ul>

				{error ? <p className={styles.authError} role="alert">{error}</p> : null}
				<button className={styles.githubSubmit} type="button" disabled={pending} onClick={() => void continueWithGitHub()}>
					<span className={styles.githubBadge}><GitHubMark /></span>
					<strong>{pending ? ui.account.auth.buttonLoading : ui.account.auth.buttonIdle}</strong>
					<ArrowRight aria-hidden="true" />
				</button>
				<p className={styles.authFootnote}>{ui.account.auth.footnote}</p>
			</div>
		</ModalDialog>
	);
}
