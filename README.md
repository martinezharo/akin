# Akin

Akin is a mobile-first streak app built with web technologies. Check in for the
day, watch the streak grow, make your pet happy, and let your friends see it. No
grey tables or joyless checkboxes: opening Akin should feel like a treat.

## What it does

- **Streaks.** Goals with a name and icon, daily check-ins, and a review window
  that lets you catch up without falsifying dates.
- **Undo.** Every check-in or deletion can be reversed from its toast, including
  any coins it awarded.
- **Coins.** One per valid check-in, up to three per streak during review, with
  no more than ten streaks earning coins at once.
- **Pet.** Pet it, watch it react, and dress it in skins and hairstyles bought
  with your coins.
- **Friends.** Send requests by username and follow a shared activity feed.
- **Installable.** On mobile it behaves like an app, not another browser tab.

Routes: `/` landing page · `/streaks` app · `/pet` pet and shop · `/friends`
friends · `/me` account · `/demo` account-free tour.

## Data

Without an account, streaks live in `localStorage` and all the essentials still
work. With an account, Convex stores the profile, streaks, check-ins, coins, and
friendships in real time. Existing local data is imported once, without awarding
coins retroactively.

The user identifier never comes from the client; it is derived from the signed
session. Check-ins and the coin ledger are validated on the server against real
dates in the account's time zone.

## Stack

Next.js 16 · React 19 · CSS Modules · Convex · Better Auth · TypeScript · Vitest
· pnpm. There is no component library: menus, dialogs, and toasts are custom
built because the look and feel are part of the product.

## Development

```bash
pnpm install
pnpm dev          # Convex + Next.js together at http://localhost:3000
```

The first run lets you sign in to Convex or create an anonymous local deployment,
then writes the public variables to `.env.local`. Use `pnpm dev:backend` and
`pnpm dev:web` to debug each side separately, but do not run `dev:backend` while
`pnpm dev` is active: both would compete for the same deployment.

Better Auth and GitHub sign-in require these variables **in the Convex
deployment**, not in Next.js:

```bash
pnpm exec convex env set BETTER_AUTH_SECRET   # long and random
pnpm exec convex env set SITE_URL http://localhost:3000
pnpm exec convex env set GITHUB_CLIENT_ID
pnpm exec convex env set GITHUB_CLIENT_SECRET
```

The local OAuth App uses `http://localhost:3000/api/auth/callback/github` as its
callback. In production, `SITE_URL` and the callback point to the real public
URL and use separate credentials.

Before calling a change done, run `pnpm lint`, `pnpm test`, and `pnpm build`.

## Deployment

Akin runs as a Next.js application on Cloudflare Workers through OpenNext.
Wrangler publishes both the Worker and its static assets:

```bash
pnpm install --frozen-lockfile
pnpm run deploy
```

Sign in once with `pnpm exec wrangler login` before deploying locally. The
`NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` variables must be
available at build time. In Workers Builds, configure them as build variables;
for a local deployment they can live in `.env.local`.

Connect the `akin` Worker to this repository's `main` branch through Workers
Builds to build and deploy every push automatically. Use `pnpm run preview` to
test the exact Workers artifact locally. The Worker name, assets, observability,
and bindings are defined in `wrangler.jsonc`.

The backend remains on Convex and is deployed separately with
`pnpm convex:deploy`. The production deployment needs `BETTER_AUTH_SECRET` and
`SITE_URL` configured with the real public domain, and the GitHub callback must
use that same domain.
