import { FriendPortrait } from "@/features/friends/components/friend-portrait";
import { DEMO_FRIENDS } from "@/features/friends/demo/demo-friends-fixture";
import { byWeeklyXp } from "@/features/friends/model/friend-types";
import { ui } from "@/i18n";
import styles from "./crew-preview.module.css";

/** The demo crew, sorted the way the real board sorts it. */
const CREW = DEMO_FRIENDS.filter((friend) => friend.relationship === "friends").sort(byWeeklyXp);

export function CrewPreview() {
	return (
		<div className={styles.crew}>
			<p className={styles.sortNote}>{ui.landing.crew.sortNote}</p>
			<ol className={styles.list}>
				{CREW.map((friend, index) => (
					<li className={styles.row} key={friend.id} data-lead={index === 0 || undefined}>
						<span className={styles.rank}>{index + 1}</span>
						<FriendPortrait friend={friend} size="2.5rem" />
						<span className={styles.username}>@{friend.username}</span>
						<span className={styles.xp}>
							{friend.weeklyXp}
							<small>{ui.landing.crew.unit}</small>
						</span>
					</li>
				))}
			</ol>
		</div>
	);
}
