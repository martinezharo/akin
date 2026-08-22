import type { MetadataRoute } from "next";

const SITE_URL = "https://akin.4oli.com";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: ["/", "/demo"],
			disallow: ["/api/", "/streaks", "/pet", "/friends", "/me"],
		},
		sitemap: `${SITE_URL}/sitemap.xml`,
	};
}
