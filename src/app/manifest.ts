import type { MetadataRoute } from "next";
import { ui } from "@/i18n/en";

export default function manifest(): MetadataRoute.Manifest {
	return {
		id: "/",
		name: ui.metadata.title,
		short_name: ui.metadata.title,
		description: ui.metadata.description,
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
