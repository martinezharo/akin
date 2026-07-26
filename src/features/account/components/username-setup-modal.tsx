"use client";

import { AlertCircle, ArrowRight, AtSign, LogIn, Sparkles } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
	normalizeUsername,
	getUsernameValidationError,
	USERNAME_HTML_PATTERN,
	USERNAME_MAX_LENGTH,
	USERNAME_MIN_LENGTH,
	USERNAME_ERROR_CODES,
	type UsernameValidationError,
} from "@/domain/account/username";
import { ui } from "@/i18n";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import styles from "../account.module.css";

export function UsernameSetupModal({ today, timeZone }: { today?: string; timeZone?: string }) {
	const setUsername = useMutation(api.users.setUsername);
	const [username, setUsernameValue] = useState("");
	const [pending, setPending] = useState(false);
	const [validationError, setValidationError] = useState<UsernameValidationError | null>(null);
	const [saveError, setSaveError] = useState<"taken" | "profileNotReady" | "generic" | null>(null);
	const [hasSubmitted, setHasSubmitted] = useState(false);
	const titleId = useId();
	const descriptionId = useId();
	const inputId = useId();
	const hintId = useId();
	const errorId = useId();

	const errorMessage = validationError
		? ui.account.username.validationErrors[validationError]
		: saveError === "taken"
			? ui.account.username.takenError
			: saveError === "profileNotReady"
				? ui.account.username.profileNotReadyError
				: saveError === "generic"
					? ui.account.username.saveFailed
					: null;

	async function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const normalized = normalizeUsername(username);
		const nextValidationError = getUsernameValidationError(username);
		setHasSubmitted(true);
		setValidationError(nextValidationError);
		setSaveError(null);
		if (nextValidationError) {
			return;
		}

		setPending(true);
		try {
			if (today && timeZone) {
				await setUsername({ username: normalized, today, timeZone });
			} else {
				await setUsername({ username: normalized });
			}
		} catch (caughtError) {
			const message = caughtError instanceof Error ? caughtError.message : "";
			setSaveError(
				message.includes(USERNAME_ERROR_CODES.taken)
					? "taken"
					: message.includes(USERNAME_ERROR_CODES.profileNotReady)
						? "profileNotReady"
						: "generic",
			);
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
					<div className={styles.usernameInputWrap} data-invalid={errorMessage ? "true" : undefined}>
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
							aria-describedby={[descriptionId, hintId, errorMessage ? errorId : null].filter(Boolean).join(" ")}
							aria-invalid={errorMessage ? "true" : "false"}
							spellCheck={false}
							value={username}
							onChange={(event) => {
								const nextValue = event.target.value;
								setUsernameValue(nextValue);
								setSaveError(null);
								if (hasSubmitted) setValidationError(getUsernameValidationError(nextValue));
							}}
							onBlur={() => {
								if (hasSubmitted || username) setValidationError(getUsernameValidationError(username));
							}}
						/>
					</div>
					<p className={styles.usernameHint} id={hintId}>
						<span>{ui.account.username.hint}</span>
						<small aria-label={ui.account.username.characters(username.length, USERNAME_MAX_LENGTH)}>
							{ui.account.username.characters(username.length, USERNAME_MAX_LENGTH)}
						</small>
					</p>
					{errorMessage ? (
						<p className={styles.usernameError} id={errorId} role="alert">
							<AlertCircle aria-hidden="true" />
							<span>{errorMessage}</span>
						</p>
					) : null}
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

/** The guest stand-in for the username badge: same shape, but it opens auth. */
export function GuestUsernamePresence({ onRequestAccess }: { onRequestAccess: () => void }) {
	return (
		<button
			className={`${styles.usernameBadge} ${styles.guestUsernameBadge}`}
			type="button"
			onClick={onRequestAccess}
			aria-label={ui.account.username.guestBadgeLabel}
		>
			<LogIn aria-hidden="true" />
			<strong>{ui.account.username.guestBadge}</strong>
		</button>
	);
}

export function RemoteUsernamePresence({ today, timeZone }: { today?: string; timeZone?: string }) {
	const identity = useQuery(api.users.current);
	return <UsernamePresence username={identity?.username} today={today} timeZone={timeZone} />;
}
