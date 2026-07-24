"use client";

import { Check, Coins } from "lucide-react";
import type { CSSProperties } from "react";
import { ui } from "@/i18n/en";
import styles from "../pet-page.module.css";

export function ColorRail({ options, selectedId, equippedId, ownedIds, onSelect, label }: {
	options: ReadonlyArray<{ id: string; name: string; color: string; price?: number }>;
	selectedId: string;
	equippedId: string;
	ownedIds?: readonly string[];
	onSelect: (id: string) => void;
	label: string;
}) {
	return (
		<div className={styles.colorRail} role="group" aria-label={label}>
			{options.map((option) => {
				const selected = option.id === selectedId;
				const equipped = option.id === equippedId;
				const owned = option.price === undefined || ownedIds?.includes(option.id);
				return (
					<button
						key={option.id}
						type="button"
						className={styles.colorChoice}
						onClick={() => onSelect(option.id)}
						aria-pressed={selected}
						aria-label={`${option.name}${owned ? `, ${ui.pet.colorRail.owned}` : option.price ? `, ${ui.pet.colorRail.coins(option.price)}` : ""}`}
					>
						<span className={styles.colorDot} style={{ "--swatch-color": option.color } as CSSProperties}>
							{equipped ? <Check aria-hidden="true" /> : null}
						</span>
						<strong>{option.name}</strong>
						<small>{owned ? (equipped ? ui.pet.colorRail.on : ui.pet.colorRail.ownedLabel) : <><Coins aria-hidden="true" /> {option.price}</>}</small>
					</button>
				);
			})}
		</div>
	);
}
