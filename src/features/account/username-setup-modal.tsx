"use client";

import { ArrowRight, AtSign, Sparkles } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import styles from "./account.module.css";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function normalizeUsername(value: string) {
	return value.trim().toLowerCase();
}

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
			setError("Use 3–20 lowercase letters, numbers, or underscores.");
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
			setError(caughtError instanceof Error ? caughtError.message : "That username could not be saved. Try again.");
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
				<p className={styles.eyebrow}>A tiny signature</p>
				<h2 className={styles.authTitle} id={titleId}>What should we call you?</h2>
				<p className={styles.authCopy} id={descriptionId}>
					Pick a unique username for your Akin world. You can use letters, numbers, and underscores.
				</p>

				<form className={styles.usernameForm} onSubmit={(event) => void submit(event)}>
					<label htmlFor={inputId}>Username</label>
					<div className={styles.usernameInputWrap}>
						<AtSign aria-hidden="true" />
						<input
							autoCapitalize="none"
							autoComplete="username"
							autoFocus
							id={inputId}
							inputMode="text"
							maxLength={20}
							minLength={3}
							name="username"
							pattern="[a-zA-Z0-9_]{3,20}"
							placeholder="your_name"
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
						<strong>{pending ? "Saving your name…" : "Make it mine"}</strong>
						<ArrowRight aria-hidden="true" />
					</button>
				</form>
				<p className={styles.authFootnote}>This is how your streak world knows you.</p>
			</div>
		</ModalDialog>
	);
}

export function UsernamePresence({ username, today, timeZone }: { username?: string | null; today?: string; timeZone?: string }) {
	if (username === undefined) return null;
	if (!username) return <UsernameSetupModal today={today} timeZone={timeZone} />;

	return (
		<div className={styles.usernameBadge} aria-label={`Signed in as @${username}`}>
			<AtSign aria-hidden="true" />
			<strong>@{username}</strong>
		</div>
	);
}

export function RemoteUsernamePresence({ today, timeZone }: { today?: string; timeZone?: string }) {
	const identity = useQuery(api.users.current);
	return <UsernamePresence username={identity?.username} today={today} timeZone={timeZone} />;
}
