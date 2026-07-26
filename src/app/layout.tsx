import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { APP_LANGUAGE } from "@/i18n/config";
import { ui } from "@/i18n";
import { I18nProvider } from "@/i18n/i18n-provider";
import { ConvexClientProvider } from "@/providers/convex-client-provider";
import { PetCustomizationProvider } from "@/features/pet/model/pet-customization-provider";
import { AppChromeProvider } from "@/features/navigation/app-chrome";
import "./globals.css";

const preferencesBootScript = `
try {
	const stored = JSON.parse(localStorage.getItem("akin.preferences.v1") || "null");
	const theme = stored?.theme === "dark" || stored?.theme === "light"
		? stored.theme
		: (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
	document.documentElement.dataset.theme = theme;
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
	title: ui.metadata.title,
	description: ui.metadata.description,
	applicationName: ui.metadata.title,
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		title: ui.metadata.title,
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
				<script id="akin-preferences" dangerouslySetInnerHTML={{ __html: preferencesBootScript }} />
			</head>
			<body>
				<ConvexClientProvider>
					<PetCustomizationProvider>
					<I18nProvider>
						<AppChromeProvider>{children}</AppChromeProvider>
					</I18nProvider>
					</PetCustomizationProvider>
				</ConvexClientProvider>
			</body>
		</html>
	);
}
