/** The marketing door. Everything below it is the product behind that door. */
export const LANDING_PATH = "/";

/**
 * The app's home. Named after what you keep rather than after the software —
 * the same reason Duolingo sends you to `/learn` and not to `/app`.
 */
export const APP_HOME_PATH = "/streaks";

/** The account-free tour. It mirrors the app one level down. */
export const DEMO_HOME_PATH = "/demo";

/**
 * `home` resolves to whichever home the visitor is currently inside, so callers
 * never have to know whether they are in the demo.
 */
export type ExperienceDestination = "home" | "/friends" | "/pet" | "/me";

export function getExperiencePath(pathname: string | null, destination: ExperienceDestination) {
	const inDemo = pathname === DEMO_HOME_PATH || pathname?.startsWith(`${DEMO_HOME_PATH}/`);
	if (destination === "home") return inDemo ? DEMO_HOME_PATH : APP_HOME_PATH;
	return inDemo ? `${DEMO_HOME_PATH}${destination}` : destination;
}

/**
 * The landing paints its own frame — its own header, its own footer, its own
 * full-bleed sections — so the app's fixed navigation and wallet stay off it.
 */
export function hasAppChrome(pathname: string | null) {
	return pathname !== LANDING_PATH;
}
