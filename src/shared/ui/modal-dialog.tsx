"use client";

import { type ReactNode, useEffect, useRef } from "react";

export function ModalDialog({
	children,
	className,
	labelledBy,
}: {
	children: ReactNode;
	className: string;
	labelledBy: string;
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
			onCancel={(event) => event.preventDefault()}
		>
			{children}
		</dialog>
	);
}
