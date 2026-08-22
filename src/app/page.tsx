import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";
import { ui } from "@/i18n";

/** The app's own title is just "Akin"; the front door has to sell as well. */
export const metadata: Metadata = {
	title: ui.landing.metadata.title,
	description: ui.landing.metadata.description,
	alternates: {
		canonical: "/",
		types: { "text/markdown": "/index.md" },
	},
	openGraph: {
		title: ui.landing.metadata.title,
		description: ui.landing.metadata.description,
		type: "website",
	},
};

export default function Home() {
	return <LandingPage />;
}
