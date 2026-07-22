export function getExperiencePath(pathname: string | null, destination: "/" | "/akin") {
	const demoPrefix = pathname === "/demo" || pathname?.startsWith("/demo/") ? "/demo" : "";
	return destination === "/" ? demoPrefix || "/" : `${demoPrefix}${destination}`;
}
