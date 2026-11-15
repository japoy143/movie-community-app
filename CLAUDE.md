# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Verify changes

Run `npm run typecheck && npm run lint && npm run build`. There is no test suite yet.

## Database (Neon Postgres + Drizzle)

- The client lives in `src/db/index.ts` and imports `server-only`. Import `db` only from Server Components, Server Actions or route handlers, never from `"use client"` files.
- Define all tables in `src/db/schema.ts`.
- Schema changes always go through `npm run db:generate`, then `npm run db:migrate`, with the generated SQL in `drizzle/` committed. Never use `db:push`. Use `/db-change` for this workflow.
- Env vars go in `.env.local` or `.env`; both Next.js and `drizzle.config.ts` read them (`.env.local` wins). Keep `.env.example` in sync when adding env vars.
- The build needs `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` and a real `TMDB_READ_ACCESS_TOKEN`: the home page prerenders TMDB data at build time.

## Movies (TMDB) and community

- TMDB client: `src/lib/tmdb.ts` (`"use cache"` + `cacheLife("hours")`). Never call TMDB from client code or uncached paths. The TMDB attribution footer (`src/components/layout/site-footer.tsx`) is required by TMDB's terms; keep it.
- Movies are keyed by TMDB id; there is no local movies table. Likes and comments live in `movie_like` and `comment`.
- Comments are members-only: never query or render comment text for a guest. `getComments()` in `src/lib/community.ts` throws for guests on purpose. Guests may like (via the HMAC-signed `mc_vid` cookie in `src/lib/visitor.ts`).
- Viewer-specific data (likes, comments, session) must render inside `<Suspense>` so TMDB content stays in the static shell. Dynamic route params are awaited inside `<Suspense>` (see `src/app/movies/[id]/page.tsx`).
- Logging: use `createLogger(scope)` from `src/lib/logger.ts`. Wrap only the data loading in try/catch, not JSX (the React lint rule forbids JSX in try/catch), and call `unstable_rethrow(error)` first in every catch in server components so Next's prerender/notFound signals aren't swallowed.
- Server Actions (`src/app/movies/actions.ts`) are public endpoints: validate every argument (`isValidId`, `instanceof FormData`), check the movie exists, and rate-limit with `rateLimit()` from `src/lib/rate-limit.ts` (`failClosed: true` for abuse-prone writes). Likes use `setLike(movieId, liked)` (idempotent), never a toggle.
- Client state survives navigation (Next keeps up to 3 routes mounted via Activity): reset pending flags in `finally`, and resync client state when server props change.

## Auth (Better Auth)

- Server config: `src/lib/auth.ts` (DB-backed rate limiting, display-name validation in `databaseHooks`). Client: `src/lib/auth-client.ts`.
- Sessions (`src/lib/session.ts`): use `getSession()` in Server Components (cached, no refresh) and `getActionSession()` in Server Actions (can refresh the cookie).
- `src/proxy.ts` redirects signed-in users away from `/sign-in` and `/sign-up`. It confirms the session with `auth.api.getSession` (`disableRefresh`), because a stale cookie alone would lock users out of those pages, and builds redirects from `BETTER_AUTH_URL`, never the Host header. It's a convenience; never rely on it for authorization.
- Sign-in, sign-up and sign-out hard-navigate with `navigateWithFlash()` (`src/lib/flash.ts`) so no cached signed-in/out view survives. Validate `?next=` with `safeNextPath()`.
- Client IPs come from `getClientIp()` (`src/lib/ip.ts`), which shares Better Auth's resolution. Only headers listed in `TRUSTED_IP_HEADERS` are trusted (none by default).
- The Better Auth tables in `src/db/schema.ts` must keep Better Auth's camelCase property names (column names are snake_case). If you enable a plugin that adds fields, add them there and generate a migration.
- `cacheComponents` is on, so any component that calls `getSession()` (it reads `headers()`) must render inside `<Suspense>`.

## UI's

- Before creating new components find if there is existing component to use
- Make all the UI in components and can easily be maintained
- Make it also a minimalist designed

## Functions

- Add an error handlers and loggers
