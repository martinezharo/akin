"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import type { KeyboardEvent } from "react";
import { ui } from "@/i18n";
import type { Language } from "@/i18n/config";
import { usePopover } from "@/shared/hooks/use-popover";
import { languageOptions } from "./languages";
import styles from "./language-menu.module.css";

/**
 * The language setting on its own.
 *
 * `setting` is the row inside the preferences panel, where there is room to spell
 * the language out; `compact` is the header button, which only has room for the
 * globe and the code.
 */
export function LanguageMenu({
	id,
	labelledBy,
	value,
	variant = "setting",
	onChange,
}: {
	id: string;
	/** Set by the preferences panel, which already labels the row. */
	labelledBy?: string;
	value: Language;
	variant?: "setting" | "compact";
	onChange: (language: Language) => void;
}) {
	const { isOpen, rootRef, popoverRef, triggerRef, dismiss, toggle } = usePopover();
	const options = languageOptions();
	const selected = options.find((option) => option.value === value) ?? options[0];
	const compact = variant === "compact";

	function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
		if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
		event.preventDefault();
		if (!isOpen) toggle();
	}

	return (
		<div className={styles.picker} data-variant={variant} ref={rootRef}>
			<button
				id={id}
				ref={triggerRef}
				className={styles.trigger}
				type="button"
				data-open={isOpen}
				aria-haspopup="menu"
				aria-expanded={isOpen}
				aria-controls={`${id}-menu`}
				{...(labelledBy
					? { "aria-labelledby": `${labelledBy} ${id}-value` }
					: { "aria-label": `${ui.preferences.language}: ${selected.name}` })}
				onClick={toggle}
				onKeyDown={handleTriggerKeyDown}
			>
				{compact ? <Languages className={styles.globe} aria-hidden="true" /> : null}
				<span className={styles.code} aria-hidden="true">{selected.code}</span>
				{compact ? null : <strong id={`${id}-value`}>{selected.name}</strong>}
				<span className={styles.chevron} aria-hidden="true" data-open={isOpen}>
					<ChevronDown />
				</span>
			</button>

			{isOpen ? (
				<div className={styles.menu} id={`${id}-menu`} ref={popoverRef} role="menu" aria-label={ui.preferences.language}>
					{options.map((option) => (
						<button
							key={option.value}
							type="button"
							role="menuitemradio"
							aria-checked={value === option.value}
							data-selected={value === option.value}
							onClick={() => {
								onChange(option.value);
								dismiss({ restoreFocus: true });
							}}
						>
							<span className={styles.code} aria-hidden="true">{option.code}</span>
							<strong>{option.name}</strong>
							{value === option.value ? <Check aria-hidden="true" /> : <span className={styles.checkSlot} aria-hidden="true" />}
						</button>
					))}
				</div>
			) : null}
		</div>
	);
}
