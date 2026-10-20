-- Enable row-level security on every application table.
--
-- WHY: Supabase auto-exposes the `public` schema through PostgREST, reachable
-- with the publishable (anon) key that ships to every browser. Prisma's
-- CREATE TABLE does not enable RLS, so without this migration `users`,
-- `loadouts` and friends are readable AND writable at
-- https://<ref>.supabase.co/rest/v1/<table> by anyone who views source —
-- completely bypassing the ownership checks in src/app/api/loadouts/*.
--
-- NO POLICIES ARE DEFINED, and that is deliberate. RLS with zero policies
-- denies the `anon` and `authenticated` roles everything, which closes the REST
-- API. ThemeSet never uses that API: it reaches Postgres through Prisma as the
-- `postgres` role, which has BYPASSRLS and is unaffected.
--
-- If you ever DO want to query a table from the browser via supabase-js, add an
-- explicit policy for it — don't disable RLS.

alter table "users"           enable row level security;
alter table "loadouts"        enable row level security;
alter table "loadout_items"   enable row level security;
alter table "likes"           enable row level security;
alter table "favorites"       enable row level security;
alter table "comments"        enable row level security;
alter table "skins"           enable row level security;
alter table "skin_variants"   enable row level security;
alter table "skin_attributes" enable row level security;
alter table "prices"          enable row level security;
alter table "price_history"   enable row level security;
