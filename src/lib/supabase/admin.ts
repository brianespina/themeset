import "server-only";

import { createClient } from "@supabase/supabase-js";

import { secretKey, supabaseEnv } from "./env";

// Service-role client: bypasses Row Level Security and can mint sessions.
//
// Used ONLY by the Steam sign-in flow (src/app/auth/steam/callback/route.ts),
// which has to create an auth user for a Steam id that Supabase Auth has no
// provider for. Never import this into anything that handles ordinary requests,
// and never from a Client Component — `server-only` makes that a build error.
export function createAdminClient() {
  const { url } = supabaseEnv();
  const serviceKey = secretKey();
  if (!serviceKey) {
    throw new Error(
      "No Supabase secret key set — required for Steam sign-in. Set " +
        "SUPABASE_SECRET_KEY (Supabase → Settings → API keys → secret key, " +
        "`sb_secret_…`) or the legacy SUPABASE_SERVICE_ROLE_KEY. Server-side only.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
