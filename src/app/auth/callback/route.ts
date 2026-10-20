import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/dal";
import { safeNext } from "@/lib/auth/redirect";

// OAuth return leg for Discord and Google.
//
// Supabase redirects here with a one-time `code`; exchanging it sets the
// session cookies. This must be a Route Handler rather than a page because
// only Route Handlers and Server Actions may write cookies (see the Next.js
// cookies API reference).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/signin?error=auth_not_configured`);
  }

  // Supabase reports a refused/failed consent as query params, not an throw.
  const providerError = searchParams.get("error_description") ?? searchParams.get("error");
  if (providerError) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(providerError)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/signin?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Create the ThemeSet profile row now, while we're still in a context that
  // can surface a failure, instead of letting the first page render do it.
  await getCurrentUser();

  return NextResponse.redirect(`${origin}${next}`);
}
