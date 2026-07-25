"use client";

import { Check, ChevronRight, HeartHandshake } from "lucide-react";
import { useId, useState } from "react";
import { ui } from "@/i18n/en";
import { ModalDialog } from "@/shared/ui/modal-dialog";
import { formatLocalDate, type LocalDateKey } from "../../model/calendar";
import type { ReviewAnswers } from "../../model/progress";
import type { Streak } from "../../model/streak";
import { StreakIcon } from "../icon-picker/streak-icons";
import styles from "./streak-review.module.css";

type ReviewFlowProps = {
	days: LocalDateKey[];
	streaks: Streak[];
	onResolveDay: (
		day: LocalDateKey,
		answers: ReviewAnswers,
		options: { isFinalDay: boolean },
	) => void;
	onResolveGap: (days: LocalDateKey[], answers: ReviewAnswers) => void;
	isCompletedOn: (streakId: string, day: LocalDateKey) => boolean;
};

function useChecklistAnswers(streaks: Streak[]) {
	const [answers, setAnswers] = useState<ReviewAnswers>(() =>
		Object.fromEntries(streaks.map((streak) => [streak.id, false])),
	);
	return {
		answers,
		answer: (streakId: string, value: boolean) =>
			setAnswers((currentAnswers) => ({ ...currentAnswers, [streakId]: value })),
	};
}

function StreakIdentity({ streak }: { streak: Streak }) {
	return (
		<span className={styles.identity}>
			<span className={styles.streakIcon}>
				<StreakIcon value={streak.icon} />
			</span>
			<span>{streak.name}</span>
		</span>
	);
}

function StreakChecklist({
	streaks,
	answers,
	onAnswer,
	question,
}: {
	streaks: Streak[];
	answers: ReviewAnswers;
	onAnswer: (streakId: string, answer: boolean) => void;
	question: (name: string) => string;
}) {
	return (
		<div className={styles.streaks}>
			{streaks.map((streak) => (
				<label className={`${styles.streak} ${styles.checklistStreak}`} key={streak.id}>
					<StreakIdentity streak={streak} />
					<input
						className={styles.checkboxInput}
						type="checkbox"
						checked={answers[streak.id] === true}
						aria-label={question(streak.name)}
						onChange={(event) => onAnswer(streak.id, event.currentTarget.checked)}
					/>
					<span className={styles.checkbox} aria-hidden="true">
						<Check />
					</span>
				</label>
			))}
		</div>
	);
}

function DailyReview({
	day,
	streaks,
	page,
	total,
	titleId,
	onSubmit,
}: {
	day: LocalDateKey;
	streaks: Streak[];
	page: number;
	total: number;
	titleId: string;
	onSubmit: (answers: ReviewAnswers) => void;
}) {
	const review = useChecklistAnswers(streaks);

	return (
		<div className={styles.card}>
			<div className={styles.reviewHeader}>
				<p className={styles.date}>{formatLocalDate(day)}</p>
				{total > 1 && (
					<div className={styles.progressDots} aria-hidden="true">
						{Array.from({ length: total }, (_, index) => (
							<span
								data-active={index + 1 === page}
								data-done={index + 1 < page}
								key={index}
							/>
						))}
					</div>
				)}
			</div>

			<p className={styles.kicker}>{ui.review.dailyKicker}</p>
			<h2 className={styles.title} id={titleId}>
				{ui.review.dailyTitle}
			</h2>
			<p className={styles.copy}>{ui.review.dailyCopy(page)}</p>

			<StreakChecklist
				streaks={streaks}
				answers={review.answers}
				onAnswer={review.answer}
				question={ui.review.dailyQuestion}
			/>

			<button
				className={styles.submit}
				type="button"
				onClick={() => onSubmit(review.answers)}
			>
				<span>{page === total ? ui.review.finish : ui.review.nextDay}</span>
				<ChevronRight aria-hidden="true" />
			</button>
		</div>
	);
}

function GapReview({
	days,
	streaks,
	titleId,
	onSubmit,
}: {
	days: LocalDateKey[];
	streaks: Streak[];
	titleId: string;
	onSubmit: (answers: ReviewAnswers) => void;
}) {
	const review = useChecklistAnswers(streaks);

	return (
		<div className={`${styles.card} ${styles.gapCard}`}>
			<div className={styles.heart} aria-hidden="true">
				<HeartHandshake />
			</div>
			<p className={styles.kicker}>{ui.review.gapKicker}</p>
			<h2 className={`${styles.title} ${styles.gapTitle}`} id={titleId}>
				{ui.review.gapTitle}
			</h2>
			<p className={`${styles.copy} ${styles.gapCopy}`}>{ui.review.gapCopy(days.length)}</p>
			<p className={styles.honestyNote}>{ui.review.honestyNote}</p>

			<StreakChecklist
				streaks={streaks}
				answers={review.answers}
				onAnswer={review.answer}
				question={ui.review.bulkQuestion}
			/>

			<button
				className={styles.submit}
				type="button"
				onClick={() => onSubmit(review.answers)}
			>
				<span>{ui.review.keepPromise}</span>
				<HeartHandshake aria-hidden="true" />
			</button>
		</div>
	);
}

export function StreakReviewFlow({
	days,
	streaks,
	onResolveDay,
	onResolveGap,
	isCompletedOn,
}: ReviewFlowProps) {
	const initialDayCount = useState(days.length)[0];
	const titleId = useId();
	const day = days[0];

	if (!day) return null;

	const isGapReview = initialDayCount > 3;
	const eligibleStreaks = streaks.filter(
		(streak) => streak.createdOn <= day && !isCompletedOn(streak.id, day),
	);

	return (
		<ModalDialog className={styles.dialog} labelledBy={titleId}>
			{isGapReview ? (
				<GapReview
					days={days}
					streaks={streaks.filter((streak) => streak.createdOn <= days.at(-1)!)}
					titleId={titleId}
					onSubmit={(answers) => onResolveGap(days, answers)}
				/>
			) : (
				<DailyReview
					key={day}
					day={day}
					streaks={eligibleStreaks}
					page={initialDayCount - days.length + 1}
					total={initialDayCount}
					titleId={titleId}
					onSubmit={(answers) =>
						onResolveDay(day, answers, { isFinalDay: days.length === 1 })
					}
				/>
			)}
		</ModalDialog>
	);
}
