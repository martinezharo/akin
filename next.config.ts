import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig = (phase: string): NextConfig => ({
	// Keep development artifacts separate so `next build` cannot invalidate a
	// running development server by cleaning its output directory.
	distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
});

export default nextConfig;

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
initOpenNextCloudflareForDev();
