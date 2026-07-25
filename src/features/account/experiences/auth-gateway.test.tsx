/** @vitest-environment jsdom */

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthGateway } from "./auth-gateway";

vi.mock("convex/react", () => ({
	Authenticated: () => null,
	Unauthenticated: () => null,
	AuthLoading: ({ children }: { children: React.ReactNode }) => children,
	useMutation: vi.fn(),
	useQuery: vi.fn(),
}));

vi.mock("@/features/streaks/app/streaks-app", () => ({
	StreaksApp: () => <div>Local streaks are ready</div>,
}));

vi.mock("@/features/preferences/app-preferences", () => ({
	AppPreferences: () => <button type="button">Settings</button>,
}));

afterEach(() => {
	cleanup();
	vi.useRealTimers();
});

describe("authentication loading fallback", () => {
	it("opens local guest mode when Convex does not answer", () => {
		vi.useFakeTimers();
		render(<AuthGateway />);

		expect(screen.getByText("Waking up your streaks…")).toBeTruthy();

		act(() => vi.advanceTimersByTime(4_000));

		expect(screen.getByText("Local streaks are ready")).toBeTruthy();
		expect(screen.getByText("Convex is taking a nap")).toBeTruthy();
		expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
	});
});
