"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function ModalDialog({
	children,
	className,
	labelledBy,
	describedBy,
	onDismiss,
}: {
	children: ReactNode;
	className: string;
	labelledBy: string;
	describedBy?: string;
	onDismiss?: () => void;
}) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		if (!dialog.open) dialog.showModal();

		return () => {
			document.body.style.overflow = previousOverflow;
			if (dialog.open) dialog.close();
		};
	}, []);

	return (
		<dialog
			className={className}
			ref={dialogRef}
			aria-labelledby={labelledBy}
			aria-describedby={describedBy}
			onCancel={(event) => {
				event.preventDefault();
				onDismiss?.();
			}}
			onClick={(event) => {
				if (event.target === event.currentTarget) onDismiss?.();
			}}
		>
			{children}
		</dialog>
	);
}
