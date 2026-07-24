export function getExperiencePath(pathname: string | null, destination: "/" | "/friends" | "/pet" | "/me") {
	const demoPrefix = pathname === "/demo" || pathname?.startsWith("/demo/") ? "/demo" : "";
	return destination === "/" ? demoPrefix || "/" : `${demoPrefix}${destination}`;
}
