import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { InstallApp } from "@/features/pwa/components/install-app";
import { APP_LANGUAGE } from "@/i18n/config";
import "./globals.css";

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
		<html lang={APP_LANGUAGE} className={nunito.variable}>
			<body>
				{children}
				<InstallApp />
			</body>
		</html>
	);
}
