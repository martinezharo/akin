import type { OptimisticLocalStore } from "convex/browser";
import { api } from "@convex/_generated/api";

type Dashboard = NonNullable<
	(typeof api.dashboard.get)["_returnType"]
>;
type DashboardStreak = Dashboard["streaks"][number];

/**
 * Applies a change to the cached dashboard so the UI moves on the same frame as
 * the tap, before the mutation reaches the server. Convex rolls this back
 * automatically once the authoritative result lands, so the patch only has to
 * predict the common case, never guard against every rejection.
 */
export function patchDashboard(
	localStore: OptimisticLocalStore,
	patch: (dashboard: Dashboard) => Dashboard,
) {
	const dashboard = localStore.getQuery(api.dashboard.get, {});
	if (!dashboard) return;
	localStore.setQuery(api.dashboard.get, {}, patch(dashboard));
}

export function patchDashboardStreak(
	localStore: OptimisticLocalStore,
	streakId: string,
	patch: (streak: DashboardStreak) => DashboardStreak,
) {
	patchDashboard(localStore, (dashboard) => ({
		...dashboard,
		streaks: dashboard.streaks.map((streak) =>
			streak.id === streakId ? patch(streak) : streak,
		),
	}));
}

/** Mirrors `progress.completeToday`: one check-in and one day on the counter. */
export function completeTodayOptimistically(
	localStore: OptimisticLocalStore,
	{ streakId, today }: { streakId: string; today: string },
) {
	patchDashboard(localStore, (dashboard) => {
		const streak = dashboard.streaks.find((candidate) => candidate.id === streakId);
		const alreadyCompleted = dashboard.checkIns.some(
			(checkIn) => checkIn.streakId === streakId && checkIn.completedOn === today,
		);
		if (!streak || alreadyCompleted || streak.createdOn > today) return dashboard;

		return {
			...dashboard,
			streaks: dashboard.streaks.map((candidate) =>
				candidate.id === streakId
					? { ...candidate, days: candidate.days + 1 }
					: candidate,
			),
			checkIns: [
				...dashboard.checkIns,
				{ streakId, completedOn: today, completedAt: Date.now() },
			],
		};
	});
}

/** Mirrors `streaks.remove`: the streak leaves the list right away. */
export function removeStreakOptimistically(
	localStore: OptimisticLocalStore,
	{ streakId }: { streakId: string },
) {
	patchDashboard(localStore, (dashboard) => ({
		...dashboard,
		streaks: dashboard.streaks.filter((streak) => streak.id !== streakId),
		checkIns: dashboard.checkIns.filter((checkIn) => checkIn.streakId !== streakId),
	}));
}
