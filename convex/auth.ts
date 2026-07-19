import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;
const githubClientId = process.env.GITHUB_CLIENT_ID!;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET!;

export const authComponent = createClient<DataModel>(components.betterAuth);

export function createAuth(ctx: GenericCtx<DataModel>) {
	return betterAuth({
		baseURL: siteUrl,
		database: authComponent.adapter(ctx),
		socialProviders: {
			github: {
				clientId: githubClientId,
				clientSecret: githubClientSecret,
			},
		},
		plugins: [convex({ authConfig })],
	});
}

export const { getAuthUser } = authComponent.clientApi();
