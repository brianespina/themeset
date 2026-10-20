# ThemeSet.online

CS2 loadout-styling web app. Pick a theme, build a 12-slot loadout, and see
every skin scored 0–100 on how well it fits. Built from the design handoff
(`ThemeSet.online — Developer Handoff.pdf`) and its HTML prototype.

## Stack

Next.js (App Router) + React + TypeScript + Tailwind CSS v4, Supabase
(Postgres + Auth) accessed through Prisma for persistence and price storage,
SteamAnalyst as the marketplace data source.

## Setup

```bash
pnpm install
cp .env.example .env.local   # see .env.example for what each value is and where to find it
pnpm prisma migrate deploy   # applies prisma/migrations against DATABASE_URL
pnpm dev
```

Everything except the database is optional: with no SteamAnalyst key the catalog
falls back to ByMykel, and with no Supabase keys the site runs permanently
signed out rather than erroring. Saving sets needs Supabase and Postgres.

### SteamAnalyst API key

Put it in `.env.local` as `STEAMANALYST_API_KEY=...` (get one from
[steamanalyst.com/api_info](https://www.steamanalyst.com/api_info)). It's
read server-side only, in `src/lib/steamanalyst/client.ts` — never sent to
the browser.

SkinBaron was the original data source but never approved API access, so
ThemeSet moved to SteamAnalyst. Its free Hobby tier is **100 requests/day,
single-item lookup only** (no bulk "all items" endpoint) — nowhere near
enough to price the catalog live on every request. So pricing isn't fetched
per-request at all: a daily job (`src/lib/pricing/refresh.ts`, triggered via
`GET /api/cron/refresh-prices`) does one lookup per seed skin (40 today,
comfortably under the 100/day cap) and writes the results into Postgres.
Every page reads prices from there. Without a key, or before the job has run
once, the app falls back to the public ByMykel catalog (no live prices;
header pill reads "Community catalog").

Wire the daily job up with an external scheduler (Vercel Cron, GitHub
Actions, etc.) hitting `/api/cron/refresh-prices` once a day with
`Authorization: Bearer <CRON_SECRET>`. `CRON_SECRET` is your own arbitrary
value — set the same one in `.env.local` and in the scheduler.

### Database

Postgres is the Supabase project's database — one less moving part, since
Supabase Auth and the app data then live together.

Use the **Session pooler** string from Supabase → Settings → Database → Connect,
not the "Direct connection" one the dashboard defaults to: `db.<ref>.supabase.co`
resolves IPv6-only and IPv4 there is a paid add-on, so it fails with
`Network is unreachable` from most networks. The session pooler reaches the same
database over IPv4, and its username carries the project ref
(`postgres.<ref>`), which is how it routes tenants.

The datasource declares two URLs. Locally both point at the session pooler
(5432). On Vercel, `DATABASE_URL` becomes the **transaction** pooler (6543,
`?pgbouncer=true&connection_limit=1`) because each function instance holds its
own connection, while `DIRECT_URL` stays on 5432 — pgBouncer's transaction mode
cannot run migrations.

**Row-level security is handled by a migration**, not a dashboard step — see
`prisma/migrations/20261020000001_enable_row_level_security`. It matters because
Supabase auto-exposes the `public` schema over PostgREST using the publishable
key that ships to every browser: without RLS, `users` and `loadouts` are
readable *and writable* at `https://<ref>.supabase.co/rest/v1/loadouts`,
bypassing the ownership checks in the API routes entirely. Prisma's
`CREATE TABLE` does not enable it.

The migration enables RLS on all eleven tables and defines **no policies**. That
is deliberate: zero policies denies the `anon` and `authenticated` roles
everything, closing the REST API, while Prisma connects as `postgres` — which
has `BYPASSRLS` — and is unaffected. Verified both halves against a real
Postgres: a role without `BYPASSRLS` sees 0 rows and gets
`new row violates row-level security policy` on insert, while the app's own
queries pass unchanged. If you ever want to read a table from the browser via
supabase-js, add an explicit policy for it rather than disabling RLS.

Run migrations with `prisma migrate deploy`, not `migrate dev`: the migration in
`prisma/migrations/20261020000000_supabase_auth_users_and_loadout_refs` was
generated offline with `prisma migrate diff`, and `migrate dev` wants a shadow
database it can create and drop, which Supabase doesn't grant.

`prisma/schema.prisma` holds the full data model. `Skin`/`SkinVariant`/`Price`/
`PriceHistory` are written by the daily refresh job; `User`/`Loadout`/
`LoadoutItem` are written by auth and the saved-sets API. `Like`/`Favorite`/
`Comment` are still schema-only — see "What's not built" below.

### Auth

Supabase Auth owns identity; Prisma owns the `users` profile row. There is no
Postgres trigger syncing them — `syncUser()` in `src/lib/auth/user.ts` upserts
the profile on the first authenticated request after sign-in, so the logic stays
in the codebase where it can be reviewed.

Enable the providers in Supabase → Authentication → Providers, and add
`<your-url>/auth/callback` to the allowed redirect URLs. Leave the **Email**
provider enabled even though ThemeSet never sends mail: the Steam flow mints its
session through `generateLink({ type: "magiclink" })`, which needs it.

Supabase's prefixed API keys (`sb_publishable_…` / `sb_secret_…`) and the legacy
JWT keys (`anon` / `service_role`) are both accepted — `src/lib/supabase/env.ts`
prefers the new names and falls back to the old ones.

- **Discord / Google** — ordinary Supabase OAuth providers. The browser client
  starts the redirect; `/auth/callback` exchanges the code and sets the cookies.
- **Steam** — hand-rolled, because Steam authenticates with **OpenID 2.0**, a
  spec Supabase Auth has no provider for. `/auth/steam` builds the OpenID
  request; `/auth/steam/callback` verifies the assertion with Steam's
  `check_authentication` endpoint (the query string is attacker-controlled until
  that round-trip succeeds), then mints a Supabase session by generating a
  magic-link token with the service-role key and redeeming it server-side. The
  token is never emailed or exposed to the browser. Steam accounts are filed
  under a synthetic, non-deliverable address — see `STEAM_EMAIL_DOMAIN`.

Session handling notes:

- **`src/proxy.ts`, not `middleware.ts`.** Next.js 16 deprecated and renamed the
  middleware convention to Proxy. Supabase's published boilerplate still shows
  `middleware.ts`; that file is the adapted version. It only refreshes the
  session cookie — it authorises nothing.
- **Authorisation happens next to the data.** `src/lib/auth/dal.ts` is the Data
  Access Layer the Next.js auth guide recommends: one `cache()`-memoised
  session read per render, using `getUser()` (which revalidates the JWT with
  Supabase) rather than `getSession()` (which only decodes a cookie). Every API
  route re-checks; ownership is enforced by scoping queries to `userId`.
- **The header reads the session, so every route renders dynamically.** That's
  the trade: `/skins/[id]` and `/themeset/[slug]` were SSG before and are now
  server-rendered on demand. Fine at this scale; if it ever matters, move the
  account menu to a client-side session fetch or adopt Partial Prerendering.

## Architecture

```
SteamAnalyst API ──▶ src/lib/pricing/refresh.ts ──▶ Postgres (Price, PriceHistory)
                        (daily cron, 1 call/skin)          │
                                                            ▼
ByMykel catalog ─────────────────────────────────▶ src/lib/catalog  →  resolve()/price()  →  pages
                                                      (merge + 15-min in-memory cache)
```

- **`src/lib/steamanalyst/`** — typed REST client for SteamAnalyst's
  `/v1/prices` endpoint (Bearer-token auth). Only the free Hobby tier's
  single-item lookup is implemented; the bulk `/v1/prices/all` and `/v2`
  endpoints need a paid tier ThemeSet doesn't have.
- **`src/lib/pricing/refresh.ts`** — the daily job. Resolves each seed skin
  to a ByMykel identity, calls SteamAnalyst for that exact exterior, and
  upserts `Skin`/`SkinVariant`/`Price`/`PriceHistory` rows via Prisma.
  Exposed at `GET /api/cron/refresh-prices`, guarded by `CRON_SECRET`.
- **`src/lib/catalog/`** — merges Postgres (live price, refreshed daily) with
  the ByMykel public catalog (identity: weapon, paint, image, rarity,
  collection, float range). Neither source ships a colour palette, so
  `c1/c2/c3` stay hand-curated in `lib/seed-data.ts`, same as the original
  prototype's fallback behaviour.
- **`src/lib/scoring.ts`** — the matching engine (`match`, `pairMatch`,
  builder set-score, the random generator), ported verbatim from the
  prototype per the handoff's "reimplement verbatim" instruction.
- **`src/lib/seed-data.ts`** — the prototype's 40 skins / 14 themes / 10 sets
  / etc., ported as typed data.
- **`src/components/SkinArt.tsx`** — renders real artwork with a per-weapon
  SVG silhouette fallback on image error, ported from `SkinArt.dc.html`.
- **`src/lib/supabase/`** — the three clients, kept apart on purpose:
  `client.ts` (browser, anon key), `server.ts` (request-scoped, reads/writes
  cookies), and `admin.ts` (service role, Steam sign-in only, `server-only`).
  `env.ts` decides whether auth is configured at all.
- **`src/lib/auth/`** — `dal.ts` (session + profile), `user.ts` (profile sync
  and username de-duplication), `steam.ts` (OpenID 2.0 verification),
  `redirect.ts` (the `next=` parameter guard, which blocks open redirects).
- **`src/lib/loadouts.ts`** — saved-set persistence and the request validator.
  `skinRef` values are seed-catalogue ids with no foreign key behind them, so
  `parseSaveInput()` is the only thing rejecting unknown skins, unknown slots,
  duplicate slots, and skins that don't fit the slot they're assigned to.

## What's built

- Project scaffold, design tokens (Tailwind v4 `@theme`), fonts (Space
  Grotesk + Inter), global header/nav with the live data-source pill.
- Full SteamAnalyst + ByMykel data layer, plus the daily refresh job that
  writes SteamAnalyst prices into Postgres and the catalog layer that reads
  them back out.
- Scoring engine, ported and type-checked.
- All nine screens from the design prototype, each wired to live pricing/
  images (not placeholder markup):
  - **Home** — hero, theme picker, trending sets
  - **Explore** — palette/style/budget filters, sort, all client-side over
    server-resolved set data
  - **Set detail** (`/themeset/[slug]`) — score band, loadout table, swap
    ideas
  - **Build** — the 3-column editor: loadout tree, stage, live sub-scores,
    candidate panel with search/sort
  - **Combos** (`/combos`) — the 3-step Complete the Set flow, ranked by
    `pairMatch` against whatever's locked in so far
  - **Skin database** — tabs, theme-based ranking
  - **Skin detail** — price-by-wear table sourced from the daily-refreshed
    catalog, top themes, pairs-well-with
  - **Community** — profile + leaderboard, switchable client-side
  - **Generate** — the random-set roller, wired to the ported `rollSet()`
- **Accounts** — Supabase Auth with Discord, Google and Steam; account menu in
  the header, `/signin` screen, POST-only sign-out.
- **Saved sets** — the Build screen's "Save ThemeSet" button persists the
  current loadout, and `/my-sets` lists, re-prices and deletes saved sets.
  Backed by `GET`/`POST /api/loadouts` and `PUT`/`DELETE /api/loadouts/[id]`.
- Prisma schema for the full data model (users, skins, variants, prices,
  price history, loadouts, likes, favorites, comments).
  `Skin`/`SkinVariant`/`Price`/`PriceHistory` are written by the daily refresh
  job, and `User`/`Loadout`/`LoadoutItem` by auth and the saved-sets API.
  `Like`/`Favorite`/`Comment` are still schema-only.

## What's not built yet

Per the handoff's own phase breakdown (section 40), this covers Phase 1
(Foundation) and Phase 2 (Core Builder) UI-wise. Still open:

- **Likes, favourites and comments** — still local component state that resets
  on reload. The hearts on `SetCard` and `SetDetailScreen` are `useState` and
  fake the count by adding one client-side; Community's leaderboard totals are
  computed from seed data. The tables exist, so these are API routes plus
  wiring, following the same shape as `/api/loadouts`.
- **Saved sets are not re-editable.** "Open builder" on `/my-sets` goes to a
  fresh builder rather than loading that set, and `PUT /api/loadouts/[id]`
  exists but nothing calls it — the builder has no "load a set" path yet.
- **Public sets** — `Loadout.isPublic` is stored and always false; nothing sets
  it and no screen reads it, so Explore and Community still show seed sets
  rather than real user ones.
- **Routing as state** — screen params (`setSlug`, `skinId`, filters) that
  the handoff says "should become routes/URL state" are mostly there
  (`/themeset/[slug]`, `/skins/[id]`) except Explore's filters and
  Community's selected creator, which are in-memory only for now.
- Live header search and a "Best deals for your theme" home section (from
  the original research) aren't built — SteamAnalyst's free tier doesn't
  expose search/best-deals endpoints, so these would need a paid tier or a
  different source.
- Responsive/mobile breakpoints — desktop-only per the handoff's own scope
  note; the header holds to 924px but the 3-column Build layout and 4-7 col
  grids don't have a mobile plan yet.
- Admin dashboard, moderation, SEO pages, analytics events, sharing/OG
  metadata — all listed in the handoff as later phases, none started.
