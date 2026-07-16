"use client";

import { Check, ChevronRight, HeartHandshake, X } from "lucide-react";
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
	onResolveDay: (day: LocalDateKey, answers: ReviewAnswers) => void;
	onResolveGap: (days: LocalDateKey[], answers: ReviewAnswers) => void;
};

type QuestionCopy = {
	question: (name: string) => string;
	no: string;
	yes: string;
	optionClassName: string;
};

function useReviewAnswers(streaks: Streak[]) {
	const [answers, setAnswers] = useState<ReviewAnswers>({});
	return {
		answers,
		isComplete: streaks.every((streak) => streak.id in answers),
		answer: (streakId: string, value: boolean) =>
			setAnswers((currentAnswers) => ({ ...currentAnswers, [streakId]: value })),
	};
}

function StreakQuestionList({
	streaks,
	answers,
	onAnswer,
	copy,
}: {
	streaks: Streak[];
	answers: ReviewAnswers;
	onAnswer: (streakId: string, answer: boolean) => void;
	copy: QuestionCopy;
}) {
	return (
		<div className={styles.streaks}>
			{streaks.map((streak) => {
				const answer = answers[streak.id];

				return (
					<fieldset className={styles.streak} key={streak.id}>
						<legend className="sr-only">{copy.question(streak.name)}</legend>
						<div className={styles.identity}>
							<span className={styles.streakIcon}>
								<StreakIcon value={streak.icon} />
							</span>
							<span>{streak.name}</span>
						</div>
						<div className={styles.options}>
							<button
								className={`${copy.optionClassName} ${styles.optionNo}`}
								type="button"
								data-selected={answer === false}
								aria-pressed={answer === false}
								aria-label={copy.no}
								onClick={() => onAnswer(streak.id, false)}
							>
								<X aria-hidden="true" />
								<span>{copy.no}</span>
							</button>
							<button
								className={`${copy.optionClassName} ${styles.optionYes}`}
								type="button"
								data-selected={answer === true}
								aria-pressed={answer === true}
								aria-label={copy.yes}
								onClick={() => onAnswer(streak.id, true)}
							>
								<Check aria-hidden="true" />
								<span>{copy.yes}</span>
							</button>
						</div>
					</fieldset>
				);
			})}
		</div>
	);
}

function DailyQuestions(props: Omit<Parameters<typeof StreakQuestionList>[0], "copy">) {
	return (
		<StreakQuestionList
			{...props}
			copy={{
				question: ui.review.dailyQuestion,
				no: ui.review.no,
				yes: ui.review.yes,
				optionClassName: styles.option,
			}}
		/>
	);
}

function GapQuestions(props: Omit<Parameters<typeof StreakQuestionList>[0], "copy">) {
	return (
		<StreakQuestionList
			{...props}
			copy={{
				question: ui.review.bulkQuestion,
				no: ui.review.notEveryDay,
				yes: ui.review.everyDay,
				optionClassName: `${styles.option} ${styles.labeledOption}`,
			}}
		/>
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
	const review = useReviewAnswers(streaks);

	return (
		<div className={styles.card}>
			<div className={styles.progress} aria-label={ui.review.progress(page, total)}>
				<span className={styles.progressLabel}>{ui.review.progress(page, total)}</span>
				<div className={styles.progressDots} aria-hidden="true">
					{Array.from({ length: total }, (_, index) => (
						<span data-active={index + 1 === page} data-done={index + 1 < page} key={index} />
					))}
				</div>
			</div>

			<p className={styles.kicker}>{ui.review.dailyKicker}</p>
			<h2 className={styles.title} id={titleId}>
				{ui.review.dailyTitle}
			</h2>
			<p className={styles.date}>{formatLocalDate(day)}</p>
			<p className={styles.copy}>{ui.review.dailyCopy}</p>

			<DailyQuestions
				streaks={streaks}
				answers={review.answers}
				onAnswer={review.answer}
			/>

			<button
				className={styles.submit}
				type="button"
				disabled={!review.isComplete}
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
	const review = useReviewAnswers(streaks);

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

			<GapQuestions
				streaks={streaks}
				answers={review.answers}
				onAnswer={review.answer}
			/>

			<button
				className={styles.submit}
				type="button"
				disabled={!review.isComplete}
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
}: ReviewFlowProps) {
	const initialDayCount = useState(days.length)[0];
	const titleId = useId();
	const day = days[0];

	if (!day) return null;

	const isGapReview = initialDayCount > 3;
	const eligibleStreaks = streaks.filter((streak) => streak.createdOn <= day);

	return (
		<ModalDialog className={styles.dialog} labelledBy={titleId}>
			<div className={styles.atmosphere} aria-hidden="true">
				<span />
				<span />
				<span />
			</div>
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
					onSubmit={(answers) => onResolveDay(day, answers)}
				/>
			)}
		</ModalDialog>
	);
}
