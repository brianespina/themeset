import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { publishableKey } from "@/lib/supabase/env";

// Supabase session refresh.
//
// NOTE ON FILE NAME: this is `proxy.ts`, not `middleware.ts`. Next.js 16
// deprecated and renamed the middleware convention to Proxy — same
// functionality, different file and export name. Supabase's published
// boilerplate still shows `middleware.ts`; this is that code adapted. See
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.
//
// Supabase access tokens are short-lived. Server Components cannot write
// cookies, so without this the refreshed token would never reach the browser
// and users would be silently signed out. Running it here means every request
// starts with a fresh session cookie.
//
// This does NOT authorise anything. Per the Next.js auth guide, Proxy is for
// optimistic checks only; the real checks live next to the data in
// src/lib/auth/dal.ts and are re-done in every API route.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = publishableKey();
  // Nothing to refresh when auth isn't configured — pass the request straight
  // through so the rest of the site keeps working.
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser() — not getSession() — because it revalidates the JWT against
  // Supabase instead of trusting the cookie payload, and it is what triggers
  // the refresh-and-set-cookie path above.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Skip static assets and image files: they don't carry a session and running
  // an auth round-trip for each one would be pure latency.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
