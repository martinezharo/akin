# Akin

Akin is a mobile-first streak tracker for daily goals. It combines check-ins,
missed-day review, rewards, a customizable companion, and an optional friends
board in an installable web app.

Guests keep their streak data in the browser. Signed-in accounts use Convex for
the profile, streaks, check-ins, coins, pet customisation, and friendships.

## Features

- Daily goals with icons, check-ins, review of missed days, and undo for recent
  check-ins, reviews, and deletions.
- Coins earned from eligible streaks and a pet studio with purchasable skins and
  selectable hairstyles.
- Username search, friend requests, and a weekly XP board for signed-in users.
- Account-free demo routes and an installable PWA with offline shell caching.

Routes: `/` landing page, `/streaks` tracker, `/pet` pet studio, `/friends`
friends, `/me` account, and `/demo` account-free demo.

## Stack

Next.js, React, TypeScript, CSS Modules, Convex, Better Auth, Vitest, and pnpm.
The production app is deployed to Cloudflare Workers through OpenNext.

## Development

Requires Node.js and pnpm.

```sh
pnpm install
pnpm dev          # Convex and Next.js together at http://localhost:3000
```

For separate processes, use `pnpm dev:backend` and `pnpm dev:web`. Do not start
a second Convex development process alongside `pnpm dev`.

Useful checks:

```sh
pnpm lint
pnpm test
pnpm build
```

Guest mode needs no account configuration. To enable GitHub sign-in, put
`NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` in `.env.local` (see
[`.env.example`](.env.example)), then set these variables in the Convex
deployment:

```sh
pnpm exec convex env set BETTER_AUTH_SECRET
pnpm exec convex env set SITE_URL http://localhost:3000
pnpm exec convex env set GITHUB_CLIENT_ID
pnpm exec convex env set GITHUB_CLIENT_SECRET
```

The GitHub OAuth callback is `<SITE_URL>/api/auth/callback/github`.

## Deployment

The frontend and Convex backend are deployed separately:

```sh
pnpm deploy          # build and deploy the OpenNext Worker
pnpm preview         # build and preview the Workers artifact locally
pnpm convex:deploy   # deploy the Convex backend
```

For a local Cloudflare deployment, authenticate with `pnpm exec wrangler login`
first. The public Convex variables must be available at frontend build time;
configure them in `.env.local` or in the Workers Build environment.

See the [Convex documentation](https://docs.convex.dev),
[OpenNext Cloudflare documentation](https://opennext.js.org/cloudflare), and
the [GNU GPL-3.0 license](LICENSE).
