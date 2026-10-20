import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { supabaseEnv } from "./env";

// Request-scoped Supabase client for Server Components, Server Actions and
// Route Handlers.
//
// `cookies()` is async in Next 16 (see node_modules/next/dist/docs →
// 03-api-reference/04-functions/cookies.md), hence the await.
export async function createClient() {
  const { url, anonKey } = supabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Next.js forbids setting cookies while rendering a Server Component
          // — only Server Actions and Route Handlers can write response
          // headers. That's expected here: proxy.ts already refreshed the
          // session cookie for this request, so dropping the write is safe.
          // See the "Understanding Cookie Behavior in Server Components"
          // section of the cookies API reference.
        }
      },
    },
  });
}
