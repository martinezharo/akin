"use client";

import {
	Ellipsis,
	Minus,
	PencilLine,
	Plus,
	SlidersHorizontal,
	Trash2,
	X,
} from "lucide-react";
import {
	type CSSProperties,
	type FormEvent,
	type ReactNode,
	useId,
	useState,
} from "react";
import { ui } from "@/i18n/en";
import { usePausableTimeout } from "@/shared/hooks/use-pausable-timeout";
import {
	useAdaptivePopoverPlacement,
	usePopover,
} from "@/shared/hooks/use-popover";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import { STREAK_NAME_MAX_LENGTH, type Streak } from "../../model/streak";
import { StreakIcon } from "../icon-picker/streak-icons";
import styles from "./streak-actions.module.css";

type ActionName = "rename" | "adjust" | "delete";

const STARTING_COUNT_HINT_DURATION_MS = 5_000;

type StartingCountHintStyle = CSSProperties & {
	"--starting-count-hint-duration": string;
};

const startingCountHintStyle: StartingCountHintStyle = {
	"--starting-count-hint-duration": `${STARTING_COUNT_HINT_DURATION_MS}ms`,
};

type StreakActionsProps = {
	streak: Streak;
	onRename: (name: string) => void;
	onAdjustDays: (days: number) => void;
	onRemove: () => void;
	showAdjustHint?: boolean;
	onDismissAdjustHint?: () => void;
};

type EditorShellProps = {
	streak: Streak;
	kicker: string;
	title: string;
	copy: string;
	danger?: boolean;
	onDismiss: () => void;
	children: ReactNode;
};

function EditorShell({
	streak,
	kicker,
	title,
	copy,
	danger = false,
	onDismiss,
	children,
}: EditorShellProps) {
	const titleId = useId();
	const copyId = useId();

	return (
		<ModalDialog
			className={styles.dialog}
			labelledBy={titleId}
			describedBy={copyId}
			onDismiss={onDismiss}
		>
			<section className={styles.editor} data-danger={danger}>
				<button
					className={styles.close}
					type="button"
					aria-label={ui.streaks.closeEditor}
					onClick={onDismiss}
				>
					<X aria-hidden="true" />
				</button>
				<div className={styles.identity} aria-hidden="true">
					<StreakIcon value={streak.icon} />
				</div>
				<p className={styles.kicker}>{kicker}</p>
				<h2 className={styles.title} id={titleId}>
					{title}
				</h2>
				<p className={styles.copy} id={copyId}>
					{copy}
				</p>
				{children}
			</section>
		</ModalDialog>
	);
}

function RenameEditor({
	streak,
	onSave,
	onDismiss,
}: {
	streak: Streak;
	onSave: (name: string) => void;
	onDismiss: () => void;
}) {
	const [name, setName] = useState(streak.name);

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName) return;
		onSave(trimmedName);
	}

	return (
		<EditorShell
			streak={streak}
			kicker={ui.streaks.renameKicker}
			title={ui.streaks.renameTitle}
			copy={ui.streaks.renameCopy}
			onDismiss={onDismiss}
		>
			<form className={styles.form} onSubmit={submit}>
				<label className="sr-only" htmlFor="streak-rename">
					{ui.streaks.renameLabel}
				</label>
				<input
					className={styles.nameInput}
					id="streak-rename"
					type="text"
					value={name}
					maxLength={STREAK_NAME_MAX_LENGTH}
					autoComplete="off"
					autoFocus
					onChange={(event) => setName(event.currentTarget.value)}
				/>
				<div className={styles.footer}>
					<button className={styles.cancel} type="button" onClick={onDismiss}>
						{ui.streaks.cancelAction}
					</button>
					<button className={styles.save} type="submit" disabled={!name.trim()}>
						{ui.streaks.saveName}
					</button>
				</div>
			</form>
		</EditorShell>
	);
}

function AdjustEditor({
	streak,
	onSave,
	onDismiss,
}: {
	streak: Streak;
	onSave: (days: number) => void;
	onDismiss: () => void;
}) {
	const [value, setValue] = useState(String(streak.days));
	const days = Number(value);
	const isValid = value !== "" && Number.isInteger(days) && days >= 0;

	function nudge(delta: number) {
		setValue(String(Math.max(0, (isValid ? days : 0) + delta)));
	}

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!isValid) return;
		onSave(days);
	}

	return (
		<EditorShell
			streak={streak}
			kicker={ui.streaks.adjustKicker}
			title={ui.streaks.adjustTitle}
			copy={ui.streaks.adjustCopy}
			onDismiss={onDismiss}
		>
			<form className={styles.form} onSubmit={submit}>
				<div className={styles.counter}>
					<button
						className={styles.nudge}
						type="button"
						disabled={isValid && days === 0}
						aria-label={ui.streaks.decreaseCount}
						onClick={() => nudge(-1)}
					>
						<Minus aria-hidden="true" />
					</button>
					<label className="sr-only" htmlFor="streak-days">
						{ui.streaks.adjustLabel}
					</label>
					<input
						className={styles.daysInput}
						id="streak-days"
						type="number"
						inputMode="numeric"
						min="0"
						step="1"
						value={value}
						autoFocus
						onChange={(event) => setValue(event.currentTarget.value)}
					/>
					<button
						className={styles.nudge}
						type="button"
						aria-label={ui.streaks.increaseCount}
						onClick={() => nudge(1)}
					>
						<Plus aria-hidden="true" />
					</button>
				</div>
				<div className={styles.footer}>
					<button className={styles.cancel} type="button" onClick={onDismiss}>
						{ui.streaks.cancelAction}
					</button>
					<button className={styles.save} type="submit" disabled={!isValid}>
						{ui.streaks.saveCount}
					</button>
				</div>
			</form>
		</EditorShell>
	);
}

function DeleteEditor({
	streak,
	onConfirm,
	onDismiss,
}: {
	streak: Streak;
	onConfirm: () => void;
	onDismiss: () => void;
}) {
	return (
		<EditorShell
			streak={streak}
			kicker={ui.streaks.deleteKicker}
			title={ui.streaks.deleteTitle(streak.name)}
			copy={ui.streaks.deleteCopy}
			danger
			onDismiss={onDismiss}
		>
			<div className={styles.footer}>
				<button className={styles.cancel} type="button" onClick={onDismiss}>
					{ui.streaks.cancelAction}
				</button>
				<button className={styles.deleteConfirm} type="button" onClick={onConfirm}>
					<Trash2 aria-hidden="true" />
					{ui.streaks.confirmDelete}
				</button>
			</div>
		</EditorShell>
	);
}

function StartingCountHint({
	onAdjust,
	onDismiss,
}: {
	onAdjust: () => void;
	onDismiss: () => void;
}) {
	const [isPaused, setIsPaused] = useState(false);
	usePausableTimeout({
		durationMs: STARTING_COUNT_HINT_DURATION_MS,
		paused: isPaused,
		onTimeout: onDismiss,
	});

	return (
		<div
			className={styles.startingHint}
			data-paused={isPaused}
			style={startingCountHintStyle}
			onMouseEnter={() => setIsPaused(true)}
			onMouseLeave={() => setIsPaused(false)}
			onFocusCapture={() => setIsPaused(true)}
			onBlurCapture={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
			}}
		>
			<span className={styles.hintCopy} role="status">
				{ui.streaks.newStreakHint}
			</span>
			<button className={styles.hintAction} type="button" onClick={onAdjust}>
				{ui.streaks.newStreakHintAction}
			</button>
			<span className={styles.countdown} aria-hidden="true">
				<span className={styles.countdownProgress} />
			</span>
		</div>
	);
}

export function StreakActions({
	streak,
	onRename,
	onAdjustDays,
	onRemove,
	showAdjustHint = false,
	onDismissAdjustHint,
}: StreakActionsProps) {
	const [action, setAction] = useState<ActionName | null>(null);
	const menuId = useId();
	const { isOpen, rootRef, popoverRef, triggerRef, dismiss, toggle } = usePopover();
	const placement = useAdaptivePopoverPlacement({
		isOpen,
		triggerRef,
		popoverRef,
	});

	function openEditor(nextAction: ActionName) {
		dismiss();
		setAction(nextAction);
	}

	function closeEditor() {
		setAction(null);
		requestAnimationFrame(() => triggerRef.current?.focus());
	}

	function openSuggestedAdjust() {
		onDismissAdjustHint?.();
		openEditor("adjust");
	}

	function toggleMenu() {
		if (!isOpen) onDismissAdjustHint?.();
		toggle();
	}

	function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
		if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
		const items = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
		const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
		let nextIndex = currentIndex;
		if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
		if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
		if (event.key === "Home") nextIndex = 0;
		if (event.key === "End") nextIndex = items.length - 1;
		event.preventDefault();
		items[nextIndex]?.focus();
	}

	return (
		<>
			<div className={styles.actions} data-streak-actions-open={isOpen} ref={rootRef}>
				<button
					className={styles.trigger}
					type="button"
					ref={triggerRef}
					aria-label={ui.streaks.openActions(streak.name)}
					aria-expanded={isOpen}
					aria-controls={isOpen ? menuId : undefined}
					aria-haspopup="menu"
					onClick={toggleMenu}
				>
					<Ellipsis aria-hidden="true" />
				</button>

				{isOpen ? (
					<div
						className={styles.menu}
						id={menuId}
						ref={popoverRef}
						data-placement={placement}
						role="menu"
						aria-label={ui.streaks.actionsLabel(streak.name)}
						onKeyDown={handleMenuKeyDown}
					>
						<button type="button" role="menuitem" onClick={() => openEditor("rename")}>
							<PencilLine aria-hidden="true" />
							<span>{ui.streaks.renameAction}</span>
						</button>
						<button type="button" role="menuitem" onClick={() => openEditor("adjust")}>
							<SlidersHorizontal aria-hidden="true" />
							<span>{ui.streaks.adjustAction}</span>
						</button>
						<button
							className={styles.deleteItem}
							type="button"
							role="menuitem"
							onClick={() => openEditor("delete")}
						>
							<Trash2 aria-hidden="true" />
							<span>{ui.streaks.deleteAction}</span>
						</button>
					</div>
				) : null}
			</div>

			{showAdjustHint ? (
				<StartingCountHint
					onAdjust={openSuggestedAdjust}
					onDismiss={() => onDismissAdjustHint?.()}
				/>
			) : null}

			{action === "rename" ? (
				<RenameEditor
					streak={streak}
					onDismiss={closeEditor}
					onSave={(name) => {
						onRename(name);
						closeEditor();
					}}
				/>
			) : null}
			{action === "adjust" ? (
				<AdjustEditor
					streak={streak}
					onDismiss={closeEditor}
					onSave={(days) => {
						onAdjustDays(days);
						closeEditor();
					}}
				/>
			) : null}
			{action === "delete" ? (
				<DeleteEditor streak={streak} onDismiss={closeEditor} onConfirm={onRemove} />
			) : null}
		</>
	);
}
