"use client";

import { ArrowRight, AtSign, Sparkles } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
	normalizeUsername,
	USERNAME_HTML_PATTERN,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_PATTERN,
} from "@/domain/account/username";
import { ui } from "@/i18n/en";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import styles from "../account.module.css";

export function UsernameSetupModal({ today, timeZone }: { today?: string; timeZone?: string }) {
	const setUsername = useMutation(api.users.setUsername);
	const [username, setUsernameValue] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const titleId = useId();
	const descriptionId = useId();
	const inputId = useId();

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const normalized = normalizeUsername(username);
		if (!USERNAME_PATTERN.test(normalized)) {
			setError(ui.account.username.invalidError);
			return;
		}

		setPending(true);
		setError(null);
		try {
			if (today && timeZone) {
				await setUsername({ username: normalized, today, timeZone });
			} else {
				await setUsername({ username: normalized });
			}
		} catch (caughtError) {
			setError(caughtError instanceof Error ? caughtError.message : ui.account.username.saveFailed);
		} finally {
			setPending(false);
		}
	}

	return (
		<ModalDialog
			className={styles.usernameDialog}
			labelledBy={titleId}
			describedBy={descriptionId}
		>
			<div className={styles.usernameCard}>
				<div className={styles.usernameMark} aria-hidden="true">
					<Sparkles />
				</div>
				<p className={styles.eyebrow}>{ui.account.username.kicker}</p>
				<h2 className={styles.authTitle} id={titleId}>{ui.account.username.title}</h2>
				<p className={styles.authCopy} id={descriptionId}>
					{ui.account.username.description}
				</p>

				<form className={styles.usernameForm} onSubmit={(event) => void submit(event)}>
					<label htmlFor={inputId}>{ui.account.username.label}</label>
					<div className={styles.usernameInputWrap}>
						<AtSign aria-hidden="true" />
						<input
							autoCapitalize="none"
							autoComplete="username"
							autoFocus
							id={inputId}
							inputMode="text"
							maxLength={USERNAME_MAX_LENGTH}
							minLength={USERNAME_MIN_LENGTH}
							name="username"
							pattern={USERNAME_HTML_PATTERN}
							placeholder={ui.account.username.placeholder}
							spellCheck={false}
							value={username}
							onChange={(event) => {
								setUsernameValue(event.target.value);
								setError(null);
							}}
						/>
					</div>
					{error ? <p className={styles.authError} role="alert">{error}</p> : null}
					<button className={styles.usernameSubmit} type="submit" disabled={pending}>
						<strong>{pending ? ui.account.username.buttonLoading : ui.account.username.buttonIdle}</strong>
						<ArrowRight aria-hidden="true" />
					</button>
				</form>
				<p className={styles.authFootnote}>{ui.account.username.footnote}</p>
			</div>
		</ModalDialog>
	);
}

export function UsernamePresence({ username, today, timeZone }: { username?: string | null; today?: string; timeZone?: string }) {
	if (username === undefined) return null;
	if (!username) return <UsernameSetupModal today={today} timeZone={timeZone} />;

	return (
		<div className={styles.usernameBadge} aria-label={ui.account.username.signedInAs(username)}>
			<AtSign aria-hidden="true" />
			<strong>@{username}</strong>
		</div>
	);
}

export function RemoteUsernamePresence({ today, timeZone }: { today?: string; timeZone?: string }) {
	const identity = useQuery(api.users.current);
	return <UsernamePresence username={identity?.username} today={today} timeZone={timeZone} />;
}
