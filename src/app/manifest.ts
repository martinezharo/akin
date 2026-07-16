import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		id: "/",
		name: "Akin",
		short_name: "Akin",
		description: "Build playful streaks for the promises that matter to you.",
		start_url: "/",
		scope: "/",
		display: "standalone",
		background_color: "#fefefd",
		theme_color: "#fefefd",
		categories: ["lifestyle", "productivity"],
		icons: [
			{
				src: "/icons/akin-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/akin-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icons/akin-maskable-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	};
}
