import type { LocalDateKey } from "../model/calendar";
import type { StreakCheckIn } from "../model/check-in";
import type { Streak } from "../model/streak";

export const LOCAL_IMPORT_CHECK_IN_BATCH_SIZE = 50;
const LOCAL_IMPORT_RETRY_COUNT = 3;

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

async function withRetries<T>(operation: () => Promise<T>): Promise<T> {
	let lastError: unknown;
	for (let attempt = 0; attempt < LOCAL_IMPORT_RETRY_COUNT; attempt += 1) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;
		}
	}
	throw lastError;
}

export async function importLocalDataInBatches({
	data,
	today,
	timeZone,
	operations,
}: {
	data: LocalImportData;
	today: LocalDateKey;
	timeZone: string;
	operations: LocalImportOperations;
}) {
	const preparation = await withRetries(() =>
		operations.prepare({
			today,
			timeZone,
			streaks: data.streaks.slice(0, 100).map((streak) => ({
				clientId: streak.id,
				name: streak.name,
				icon: streak.icon ?? "✨",
				days: streak.days,
				createdOn: streak.createdOn,
			})),
		}),
	);
	if (!preparation.ready) return { imported: false };

	const checkInsToImport = data.checkIns.slice(0, 20_000);
	for (
		let index = 0;
		index < checkInsToImport.length;
		index += LOCAL_IMPORT_CHECK_IN_BATCH_SIZE
	) {
		const checkIns = checkInsToImport.slice(
			index,
			index + LOCAL_IMPORT_CHECK_IN_BATCH_SIZE,
		);
		await withRetries(() =>
			operations.importCheckIns({ today, timeZone, checkIns }),
		);
	}
	await withRetries(() =>
		operations.finish({
			today,
			timeZone,
			lastReviewedOn: data.lastReviewedOn,
			recentIcons: data.recentIcons,
		}),
	);
	return { imported: true };
}
