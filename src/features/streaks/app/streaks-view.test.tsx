/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StreaksController } from "./use-streaks-controller";
import { StreaksView } from "./streaks-view";

vi.mock("@/shared/ui/akin-mascot", () => ({
	AkinMascot: () => <div data-testid="akin-mascot" />,
}));

vi.mock("@/shared/ui/undo-toast", () => ({ UndoToast: () => null }));
vi.mock("@/features/rewards/coin-reward-feedback", () => ({
	CoinRewardFeedback: () => null,
}));
vi.mock("@/features/rewards/reward-sound-preference", () => ({
	primeRewardSound: vi.fn(),
}));
vi.mock("../components/composer/streak-composer", () => ({
	StreakComposer: () => null,
}));
vi.mock("../components/list/streak-list", () => ({ StreakList: () => null }));
vi.mock("../components/review/streak-review", () => ({
	StreakReviewFlow: () => null,
}));

afterEach(cleanup);

const controller = {} as StreaksController;

describe("StreaksView mascot visibility", () => {
	it("keeps the mascot hidden by default", () => {
		render(<StreaksView controller={controller} />);

		expect(screen.queryByTestId("akin-mascot")).toBeNull();
	});

	it("shows the mascot when the experience enables it", () => {
		render(<StreaksView controller={controller} showMascot />);

		expect(screen.getByTestId("akin-mascot")).toBeTruthy();
	});
});
