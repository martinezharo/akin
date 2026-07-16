"use client";

import type { ReactNode } from "react";
import { ui } from "@/i18n/en";
import { StreakComposer } from "../components/composer/streak-composer";
import { StreakList } from "../components/list/streak-list";
import { StreakReviewFlow } from "../components/review/streak-review";
import styles from "./streaks-shell.module.css";
import type { StreaksController } from "./use-streaks-controller";

export function StreaksView({
	controller,
	children,
}: {
	controller: StreaksController;
	children?: ReactNode;
}) {
	return (
		<>
			<section className={styles.shell} aria-labelledby="streaks-title">
				<h1 id="streaks-title" className="sr-only">
					{ui.streaks.title}
				</h1>
				<StreakComposer
					iconOptions={controller.iconOptions}
					onCreate={controller.create}
					onRememberIcon={controller.rememberIcon}
				/>
				<StreakList
					streaks={controller.streaks}
					iconOptions={controller.iconOptions}
					onUpdateIcon={controller.updateIcon}
					onRename={controller.rename}
					onAdjustDays={controller.adjustDays}
					onRemove={controller.remove}
				/>
			</section>

			{controller.hasPendingReview ? (
				<StreakReviewFlow
					days={controller.unreviewedDays}
					streaks={controller.streaks}
					onResolveDay={controller.resolveDay}
					onResolveGap={controller.resolveGap}
				/>
			) : null}

			{children}
		</>
	);
}
