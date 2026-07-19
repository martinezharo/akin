import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

function requireEnvironment(name: "NEXT_PUBLIC_CONVEX_URL" | "NEXT_PUBLIC_CONVEX_SITE_URL") {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is required to use authenticated Akin accounts`);
	return value;
}

export const convexAuth = convexBetterAuthNextJs({
	convexUrl: requireEnvironment("NEXT_PUBLIC_CONVEX_URL"),
	convexSiteUrl: requireEnvironment("NEXT_PUBLIC_CONVEX_SITE_URL"),
});
