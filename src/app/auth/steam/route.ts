import { NextResponse, type NextRequest } from "next/server";

import { buildSteamAuthUrl } from "@/lib/auth/steam";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/auth/redirect";

export const STEAM_NEXT_COOKIE = "steam_next";

// Kicks off Steam sign-in.
//
// The post-sign-in destination goes in a short-lived httpOnly cookie rather
// than in openid.return_to, because Steam signs return_to and any mismatch
// between what we send and what comes back invalidates the assertion.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/signin?error=auth_not_configured`);
  }

  const returnTo = `${origin}/auth/steam/callback`;
  // Realm must be a prefix of return_to — Steam shows it on the consent screen.
  const response = NextResponse.redirect(buildSteamAuthUrl(returnTo, origin));

  response.cookies.set(STEAM_NEXT_COOKIE, next, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
