import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { APP_LANGUAGE } from "@/i18n/config";
import "./globals.css";

const nunito = Nunito({
	variable: "--font-nunito",
	subsets: ["latin"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Akin",
	applicationName: "Akin",
	manifest: "/manifest.webmanifest",
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
			<body>{children}</body>
		</html>
	);
}
