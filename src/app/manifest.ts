import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Akin",
		short_name: "Akin",
		start_url: "/",
		display: "standalone",
		background_color: "#fefefd",
		theme_color: "#fefefd",
		icons: [
			{
				src: "/favicon.svg",
				sizes: "any",
				type: "image/svg+xml",
			},
		],
	};
}
