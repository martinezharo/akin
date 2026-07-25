"use client";

import type { CSSProperties } from "react";
import { getPetHair, getPetSkin } from "@/domain/pet/pet-catalog";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import type { Friend } from "../model/friend-types";
import styles from "./friend-portrait.module.css";

/**
 * A friend's companion in its blob bubble, tinted with their skin and hair.
 * `size` sets the bubble diameter; `className` is for the layout around it.
 */
export function FriendPortrait({
	friend,
	size,
	className,
	petClassName,
}: {
	friend: Pick<Friend, "petSkin" | "petHair">;
	size?: string;
	className?: string;
	petClassName?: string;
}) {
	const skin = getPetSkin(friend.petSkin);
	const hair = getPetHair(friend.petHair);
	const style = {
		"--friend-skin": skin.color,
		"--friend-hair": hair.color,
		...(size ? { "--portrait-size": size } : null),
	} as CSSProperties;

	return (
		<span className={className ? `${styles.portrait} ${className}` : styles.portrait} style={style}>
			<AkinMascotArtwork
				className={petClassName ? `${styles.pet} ${petClassName}` : styles.pet}
				viewBox="400 900 4216 3216"
			/>
		</span>
	);
}
