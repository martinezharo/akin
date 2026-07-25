"use client";

import { Check, Clock3, Sparkles, UserPlus, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { ui } from "@/i18n/en";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import type { Friend, FriendContext, FriendshipActions } from "../model/friend-types";
import { FriendPortrait } from "./friend-portrait";
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
	const relationship = context === "search" ? friend.relationship : context;

	if (relationship === "incoming") {
		return (
			<div className={styles.rowActions}>
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

	if (relationship === "outgoing") {
		return <CancelRequestAction friend={friend} actions={actions} pending={pending} />;
	}

	// Someone already in the crew keeps their badge instead of an action: there
	// is nothing left to do from a search result.
	if (relationship === "friends") {
		return (
			<span className={styles.alreadyFriends}>
				<UsersRound aria-hidden="true" />{ui.friends.friendsAlready}
			</span>
		);
	}

	return (
		<button type="button" className={styles.addFriend} disabled={pending} onClick={() => actions.send(friend.id)}>
			<UserPlus aria-hidden="true" /><span>{ui.friends.addFriend}</span>
		</button>
	);
}

/**
 * One person in the roster. `medal` marks a podium place on the crew board —
 * only the top three, because below that a number is noise rather than meaning.
 */
function WeeklyXp({ friend }: { friend: Friend }) {
	if (friend.weeklyXp === 0) return <span className={styles.weekScoreEmpty}>{ui.friends.weeklyXpNone}</span>;
	return (
		<strong className={styles.weekScore}>
			<Sparkles aria-hidden="true" />
			{friend.weeklyXp.toLocaleString("en-US")}
			<span>{ui.friends.xpUnit}</span>
		</strong>
	);
}

/**
 * One person in the roster. `medal` marks a podium place on the crew board —
 * only the top three, because below that a number is noise rather than meaning.
 *
 * The week's XP is the row's headline on the crew board, where it decides the
 * order; everywhere else it sits under the name and the action takes the end.
 */
export function FriendRow({
	friend,
	context,
	actions,
	pendingId,
	medal,
}: {
	friend: Friend;
	context: FriendContext;
	actions: FriendshipActions;
	pendingId: string | null;
	medal?: number;
}) {
	const pending = Boolean(pendingId && (pendingId === friend.id || pendingId === friend.requestId));
	const isCrew = context === "friends";

	return (
		<li className={styles.row}>
			<span className={styles.rowPet}>
				<FriendPortrait friend={friend} size="2.9rem" petClassName={styles.pet} />
				{medal ? <span className={styles.medal} data-medal={medal}>{medal}</span> : null}
			</span>
			<div className={styles.rowBody}>
				<p className={styles.rowName}>@{friend.username}</p>
				{isCrew ? null : (
					<span className={styles.rowXp}>
						<Sparkles aria-hidden="true" />
						{friend.weeklyXp === 0
							? ui.friends.weeklyXpNone
							: `${friend.weeklyXp.toLocaleString("en-US")} ${ui.friends.weeklyXpUnit}`}
					</span>
				)}
			</div>
			{isCrew
				? <WeeklyXp friend={friend} />
				: <FriendAction friend={friend} context={context} actions={actions} pending={pending} />}
		</li>
	);
}
