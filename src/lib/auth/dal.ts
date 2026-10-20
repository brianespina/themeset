import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@prisma/client";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { syncUser } from "./user";

// Data Access Layer for auth, per the Next.js authentication guide's
// recommendation: centralise the session check, memoise it with React's
// `cache` so one render pass hits Supabase once, and run it as close to the
// data as possible rather than relying on Proxy.

/**
 * The verified Supabase auth user for this request, or null.
 *
 * Uses `getUser()`, which validates the JWT with Supabase. `getSession()`
 * would be cheaper but only decodes the cookie, and a cookie is attacker-
 * controlled — never authorise on it.
 */
export const getAuthUser = cache(async () => {
  // No Supabase project configured — the site runs signed-out rather than
  // failing every request. See src/lib/supabase/env.ts.
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/**
 * The signed-in user's ThemeSet profile, creating it on first sign-in.
 * Returns null when nobody is signed in — callers that require a user should
 * use `requireUser` (pages) or `getSessionUser` + a 401 (API routes).
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  try {
    return await syncUser(authUser);
  } catch (e) {
    // The user is genuinely authenticated with Supabase, but Postgres is
    // unreachable or unmigrated. Treating that as signed-out keeps every page
    // renderable (the catalog has its own offline fallback) instead of turning
    // a database problem into a site-wide 500.
    console.error("[auth] could not load profile for", authUser.id, e);
    return null;
  }
});

/**
 * Profile for a page that only makes sense signed in. Redirects to the
 * sign-in screen, carrying the current path so the user lands back where they
 * started.
 */
export async function requireUser(returnTo?: string): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    const next = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/signin${next}`);
  }
  return user;
}
