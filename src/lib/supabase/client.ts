"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

// Browser-side Supabase client. Only ever used to *start* an OAuth redirect
// and to sign out — never to read authorisation state we trust. Anything that
// decides what a user may see or change reads the session server-side via
// src/lib/auth/dal.ts, because a client-held session is user-controlled.
export function createClient() {
  const { url, anonKey } = supabaseEnv();
  return createBrowserClient(url, anonKey);
}
