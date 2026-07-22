export function getExperiencePath(pathname: string | null, destination: "/" | "/pet") {
	const demoPrefix = pathname === "/demo" || pathname?.startsWith("/demo/") ? "/demo" : "";
	return destination === "/" ? demoPrefix || "/" : `${demoPrefix}${destination}`;
}
