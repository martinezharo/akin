import type { LocalDateKey } from "../model/calendar";
import type { StreakCheckIn } from "../model/check-in";
import type { Streak } from "../model/streak";

export const LOCAL_IMPORT_CHECK_IN_BATCH_SIZE = 50;
/** Mirrors the ceiling `users.prepareLocalImport` enforces on a single call. */
export const LOCAL_IMPORT_MAX_STREAKS = 100;
export const LOCAL_IMPORT_MAX_CHECK_INS = 20_000;
const LOCAL_IMPORT_RETRY_COUNT = 3;
const LOCAL_IMPORT_RETRY_DELAY_MS = 400;

type LocalImportData = {
	lastReviewedOn: LocalDateKey;
	recentIcons: string[];
	streaks: Streak[];
	checkIns: StreakCheckIn[];
};

type LocalImportOperations = {
	prepare: (args: {
		today: LocalDateKey;
		timeZone: string;
		streaks: Array<{
			clientId: string;
			name: string;
			icon: string;
			days: number;
			createdOn: LocalDateKey;
		}>;
	}) => Promise<{ ready: boolean }>;
	importCheckIns: (args: {
		today: LocalDateKey;
		timeZone: string;
		checkIns: StreakCheckIn[];
	}) => Promise<unknown>;
	finish: (args: {
		today: LocalDateKey;
		timeZone: string;
		lastReviewedOn: LocalDateKey;
		recentIcons: string[];
	}) => Promise<unknown>;
};

const sleep = (milliseconds: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

async function withRetries<T>(
	operation: () => Promise<T>,
	wait: (milliseconds: number) => Promise<void>,
): Promise<T> {
	let lastError: unknown;
	for (let attempt = 0; attempt < LOCAL_IMPORT_RETRY_COUNT; attempt += 1) {
		// A blip that just failed is unlikely to have healed by the next tick, and
		// every attempt re-reads the local day, so backing off also gives a
		// midnight rollover time to settle before the retry re-dates the call.
		if (attempt > 0) await wait(LOCAL_IMPORT_RETRY_DELAY_MS * attempt);
		try {
			return await operation();
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError;
}

/**
 * Moves the guest browser's streaks into the signed-in account.
 *
 * Every mutation is idempotent server-side, so an interrupted run — a dropped
 * request, a closed tab, a reload — simply resumes on the next sign-in: streaks
 * are matched by client id and check-ins by day, and only `finish` marks the
 * account as imported. The local day is resolved per call rather than captured
 * once, because a long import can outlive the day it started in and the server
 * rejects mutations dated to yesterday.
 */
export async function importLocalDataInBatches({
	data,
	resolveToday,
	timeZone,
	operations,
	wait = sleep,
}: {
	data: LocalImportData;
	resolveToday: () => LocalDateKey;
	timeZone: string;
	operations: LocalImportOperations;
	wait?: (milliseconds: number) => Promise<void>;
}) {
	const preparation = await withRetries(
		() =>
			operations.prepare({
				today: resolveToday(),
				timeZone,
				streaks: data.streaks.slice(0, LOCAL_IMPORT_MAX_STREAKS).map((streak) => ({
					clientId: streak.id,
					name: streak.name,
					icon: streak.icon ?? "✨",
					days: streak.days,
					createdOn: streak.createdOn,
				})),
			}),
		wait,
	);
	if (!preparation.ready) return { imported: false };

	const checkInsToImport = data.checkIns.slice(0, LOCAL_IMPORT_MAX_CHECK_INS);
	for (
		let index = 0;
		index < checkInsToImport.length;
		index += LOCAL_IMPORT_CHECK_IN_BATCH_SIZE
	) {
		const checkIns = checkInsToImport.slice(
			index,
			index + LOCAL_IMPORT_CHECK_IN_BATCH_SIZE,
		);
		await withRetries(
			() => operations.importCheckIns({ today: resolveToday(), timeZone, checkIns }),
			wait,
		);
	}
	await withRetries(
		() =>
			operations.finish({
				today: resolveToday(),
				timeZone,
				lastReviewedOn: data.lastReviewedOn,
				recentIcons: data.recentIcons,
			}),
		wait,
	);
	return { imported: true };
}
