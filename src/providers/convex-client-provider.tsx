"use client";

import {
	ConvexBetterAuthProvider,
	type AuthClient,
} from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import { type ReactNode, useState } from "react";
import { authClient } from "@/lib/auth-client";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
	const [client] = useState(() => {
		if (!convexUrl) throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured");
		return new ConvexReactClient(convexUrl);
	});

	return (
		<ConvexBetterAuthProvider client={client} authClient={authClient as unknown as AuthClient}>
			{children}
		</ConvexBetterAuthProvider>
	);
}
