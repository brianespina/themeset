// Supabase connection values.
//
// These are read lazily rather than validated at module load, and callers check
// `isSupabaseConfigured()` first. That mirrors how the rest of the app handles
// missing credentials: without a SteamAnalyst key the catalog falls back to
// ByMykel and the header says "Community catalog" rather than erroring. Auth
// behaves the same way — with no Supabase project configured the site still
// renders, just permanently signed out, instead of every page 500ing.
//
// TWO KEY FORMATS: Supabase replaced its legacy JWT keys (`anon` /
// `service_role`) with prefixed API keys (`sb_publishable_…` / `sb_secret_…`).
// Both still work — the client libraries send whichever string they're given as
// the `apikey` header without inspecting its format — so each accessor accepts
// the new name first and falls back to the legacy one. New projects only issue
// the prefixed keys.
//
// The publishable/anon key is NEXT_PUBLIC_ on purpose: it is designed to be
// shipped to the browser. The secret/service-role key is NOT here and must
// never be bundled — see src/lib/supabase/admin.ts.

/** Publishable (or legacy anon) key — safe to expose to the browser. */
export function publishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Secret (or legacy service-role) key — server-side only. */
export function secretKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publishableKey());
}

export class SupabaseConfigError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local from your Supabase " +
        "project (Settings → API keys).",
    );
    this.name = "SupabaseConfigError";
  }
}

/** Throws SupabaseConfigError when either value is missing. */
export function supabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = publishableKey();
  if (!url || !anonKey) throw new SupabaseConfigError();
  return { url, anonKey };
}
