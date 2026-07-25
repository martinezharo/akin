"use client";

import { Check, Clock3, Sparkles, UserPlus, X } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { getPetHair, getPetSkin } from "@/domain/pet/pet-catalog";
import { ui } from "@/i18n/en";
import { AkinMascotArtwork } from "@/shared/ui/akin-mascot-artwork";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { Friend, FriendContext, FriendshipActions } from "../model/friend-types";
import styles from "../friends-page.module.css";

function CancelRequestAction({
	friend,
	actions,
	pending,
}: {
	friend: Friend;
	actions: FriendshipActions;
	pending: boolean;
}) {
	const [isConfirming, setIsConfirming] = useState(false);

	return (
		<>
			<button
				type="button"
				className={styles.requested}
				disabled={pending}
				onClick={() => setIsConfirming(true)}
			>
				<Clock3 aria-hidden="true" /><span>{ui.friends.requested}</span>
			</button>
			{isConfirming ? (
				<ConfirmDialog
					danger
					kicker={ui.friends.cancelRequestKicker}
					title={ui.friends.cancelRequestTitle(friend.username)}
					copy={ui.friends.cancelRequestCopy}
					icon={<Clock3 aria-hidden="true" />}
					confirmLabel={
						<>
							<X aria-hidden="true" />
							{ui.friends.cancelRequestConfirm}
						</>
					}
					dismissLabel={ui.friends.cancelRequestDismiss}
					closeLabel={ui.friends.cancelRequestClose}
					pending={pending}
					onConfirm={() => {
						setIsConfirming(false);
						actions.cancel(friend.id);
					}}
					onDismiss={() => setIsConfirming(false)}
				/>
			) : null}
		</>
	);
}

function FriendAction({
	friend,
	context,
	actions,
	pending,
}: {
	friend: Friend;
	context: FriendContext;
	actions: FriendshipActions;
	pending: boolean;
}) {
	if (context === "incoming" || friend.relationship === "incoming") {
		return (
			<div className={styles.requestActions}>
				<button
					type="button"
					className={styles.accept}
					disabled={pending}
					onClick={() => friend.requestId && actions.respond(friend.requestId, true)}
				>
					<Check aria-hidden="true" /><span>{ui.friends.acceptRequest}</span>
				</button>
				<button
					type="button"
					className={styles.decline}
					disabled={pending}
					onClick={() => friend.requestId && actions.respond(friend.requestId, false)}
					aria-label={`${ui.friends.declineRequest} @${friend.username}`}
				>
					<X aria-hidden="true" />
				</button>
			</div>
		);
	}

	if (context === "outgoing" || friend.relationship === "outgoing") {
		return <CancelRequestAction friend={friend} actions={actions} pending={pending} />;
	}

	return (
		<button type="button" className={styles.addFriend} disabled={pending} onClick={() => actions.send(friend.id)}>
			<UserPlus aria-hidden="true" /><span>{ui.friends.addFriend}</span>
		</button>
	);
}

export function FriendCards({
	friends,
	context,
	actions,
	pendingId,
}: {
	friends: Friend[];
	context: FriendContext;
	actions: FriendshipActions;
	pendingId: string | null;
}) {
	return (
		<div className={styles.grid}>
			{friends.map((friend, index) => {
				const skin = getPetSkin(friend.petSkin);
				const hair = getPetHair(friend.petHair);
				const isFriend = context === "friends" || friend.relationship === "friends";
				const cardStyle = {
					"--friend-skin": skin.color,
					"--friend-hair": hair.color,
					"--card-delay": `${index * 55}ms`,
				} as CSSProperties;

				return (
					<article className={styles.card} style={cardStyle} key={friend.id}>
						<div className={styles.petPortrait}>
							<AkinMascotArtwork className={styles.pet} viewBox="400 900 4216 3216" />
						</div>
						<div className={styles.cardInfo}>
							<h2>@{friend.username}</h2>
							{!isFriend ? (
								<strong className={styles.xp}>
									<Sparkles aria-hidden="true" />
									{friend.xp.toLocaleString("en-US")} {ui.friends.xpUnit}
								</strong>
							) : null}
						</div>
						<div className={styles.cardEnd}>
							{isFriend ? (
								<strong className={styles.friendXp}>
									<Sparkles aria-hidden="true" />
									{friend.xp.toLocaleString("en-US")} <span>{ui.friends.xpUnit}</span>
								</strong>
							) : (
								<FriendAction
									friend={friend}
									context={context}
									actions={actions}
									pending={Boolean(pendingId && (pendingId === friend.id || pendingId === friend.requestId))}
								/>
							)}
						</div>
					</article>
				);
			})}
		</div>
	);
}
