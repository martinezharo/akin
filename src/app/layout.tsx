import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import { AppPreferences } from "@/features/preferences/app-preferences";
import { APP_LANGUAGE } from "@/i18n/config";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import "./globals.css";

const preferencesBootScript = `
try {
	const stored = JSON.parse(localStorage.getItem("akin.preferences.v1") || "null");
	const theme = stored?.theme === "dark" || stored?.theme === "light"
		? stored.theme
		: (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
	document.documentElement.dataset.theme = theme;
	if (stored?.language === "en") document.documentElement.lang = stored.language;
} catch {
	document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
`;

const nunito = Nunito({
	variable: "--font-nunito",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Akin",
	description: "Build playful streaks for the promises that matter to you.",
	applicationName: "Akin",
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		title: "Akin",
		statusBarStyle: "default",
	},
	icons: {
		icon: "/favicon.svg",
		apple: "/icons/akin-apple-touch.png",
	},
	formatDetection: {
		telephone: false,
	},
};

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#fefefd" },
		{ media: "(prefers-color-scheme: dark)", color: "#050505" },
	],
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang={APP_LANGUAGE} className={nunito.variable} suppressHydrationWarning>
			<head>
				<Script id="akin-preferences" strategy="beforeInteractive">
					{preferencesBootScript}
				</Script>
			</head>
			<body>
				<ConvexClientProvider>
					{children}
					<AppPreferences />
				</ConvexClientProvider>
			</body>
		</html>
	);
}
