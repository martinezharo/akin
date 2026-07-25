"use client";

import { X } from "lucide-react";
import { type ReactNode, useId } from "react";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import styles from "./confirm-dialog.module.css";

export function ConfirmDialog({
	kicker,
	title,
	copy,
	icon,
	confirmLabel,
	dismissLabel,
	closeLabel,
	danger = false,
	pending = false,
	onConfirm,
	onDismiss,
}: {
	kicker: string;
	title: string;
	copy: string;
	icon?: ReactNode;
	confirmLabel: ReactNode;
	dismissLabel: string;
	closeLabel: string;
	danger?: boolean;
	pending?: boolean;
	onConfirm: () => void;
	onDismiss: () => void;
}) {
	const titleId = useId();
	const copyId = useId();

	return (
		<ModalDialog
			className={styles.dialog}
			labelledBy={titleId}
			describedBy={copyId}
			onDismiss={onDismiss}
		>
			<section className={styles.panel} data-danger={danger}>
				<button className={styles.close} type="button" aria-label={closeLabel} onClick={onDismiss}>
					<X aria-hidden="true" />
				</button>
				{icon ? (
					<div className={styles.identity} aria-hidden="true">
						{icon}
					</div>
				) : null}
				<p className={styles.kicker}>{kicker}</p>
				<h2 className={styles.title} id={titleId}>
					{title}
				</h2>
				<p className={styles.copy} id={copyId}>
					{copy}
				</p>
				<div className={styles.footer}>
					<button className={styles.dismiss} type="button" onClick={onDismiss}>
						{dismissLabel}
					</button>
					<button className={styles.confirm} type="button" disabled={pending} onClick={onConfirm}>
						{confirmLabel}
					</button>
				</div>
			</section>
		</ModalDialog>
	);
}
