import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const openNextConfig = {
	...defineCloudflareConfig({
		// Uncomment to enable R2 cache,
		// It should be imported as:
		// `import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";`
		// See https://opennext.js.org/cloudflare/caching for more details
		// incrementalCache: r2IncrementalCache,
	}),
	// Workers Builds runs `pnpm run build`, which must create the OpenNext
	// worker. Keep the nested Next.js build on a separate script to avoid
	// recursively invoking OpenNext.
	buildCommand: "pnpm run build:next",
};

export default openNextConfig;
