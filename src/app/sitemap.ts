import type { MetadataRoute } from "next";

const SITE_URL = "https://akin.4oli.com";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: `${SITE_URL}/`,
			changeFrequency: "monthly",
			priority: 1,
		},
		{
			url: `${SITE_URL}/demo`,
			changeFrequency: "monthly",
			priority: 0.8,
		},
	];
}
