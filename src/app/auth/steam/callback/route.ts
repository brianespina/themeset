import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/dal";
import { fetchSteamProfile, verifySteamAssertion } from "@/lib/auth/steam";
import { safeNext } from "@/lib/auth/redirect";
import { STEAM_NEXT_COOKIE } from "../route";

/**
 * Domain for the synthetic address a Steam account is filed under.
 *
 * Steam never gives us an email, but Supabase Auth keys users by one. These
 * addresses are deliberately non-deliverable: nothing is ever sent to them,
 * and the magic link generated below is consumed server-side in this handler
 * rather than emailed. Override only if you need to avoid a collision with
 * real sign-ups.
 */
const STEAM_EMAIL_DOMAIN = process.env.STEAM_EMAIL_DOMAIN ?? "steam.themeset.invalid";

function signInError(origin: string, reason: string) {
  return NextResponse.redirect(`${origin}/signin?error=${encodeURIComponent(reason)}`);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { origin } = url;
  const next = safeNext(request.cookies.get(STEAM_NEXT_COOKIE)?.value);

  if (!isSupabaseConfigured()) {
    return signInError(origin, "auth_not_configured");
  }

  // 1. Confirm with Steam that it really signed this assertion. Everything in
  //    the query string is attacker-supplied until this returns.
  const steamId = await verifySteamAssertion(url.searchParams);
  if (!steamId) {
    return signInError(origin, "Steam sign-in could not be verified.");
  }

  const email = `steam_${steamId}@${STEAM_EMAIL_DOMAIN}`;
  const profile = await fetchSteamProfile(steamId);
  const metadata = {
    steam_id: steamId,
    provider: "steam",
    user_name: profile.personaName ?? `steam_${steamId.slice(-8)}`,
    avatar_url: profile.avatarUrl,
  };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (e) {
    console.error("[steam-auth] service role key missing", e);
    return signInError(origin, "Steam sign-in is not configured on the server.");
  }

  // 2. Make sure an auth user exists for this Steam id. A second sign-in hits
  //    the "already registered" path, which is expected, not an error.
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (created.error) {
    const alreadyExists =
      created.error.code === "email_exists" ||
      /already.*registered|already.*exists/i.test(created.error.message);
    if (!alreadyExists) {
      console.error("[steam-auth] createUser failed", created.error);
      return signInError(origin, "Could not create your ThemeSet account.");
    }
  }

  // 3. Mint a session. Supabase has no "sign in as this user" admin call, so
  //    we generate a magic-link token and redeem it here, server-side, without
  //    it ever being emailed or exposed to the browser.
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (link.error || !link.data?.properties?.hashed_token) {
    console.error("[steam-auth] generateLink failed", link.error);
    return signInError(origin, "Could not start your Steam session.");
  }

  // Refresh persona name / avatar on returning sign-ins.
  if (link.data.user?.id) {
    const updated = await admin.auth.admin.updateUserById(link.data.user.id, {
      user_metadata: metadata,
    });
    if (updated.error) {
      // Non-fatal: the session below still works, the profile is just stale.
      console.warn("[steam-auth] metadata refresh failed", updated.error);
    }
  }

  const supabase = await createClient();
  const verified = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: link.data.properties.hashed_token,
  });
  if (verified.error) {
    console.error("[steam-auth] verifyOtp failed", verified.error);
    return signInError(origin, "Could not complete your Steam sign-in.");
  }

  // 4. Create/refresh the ThemeSet profile row before redirecting.
  await getCurrentUser();

  const response = NextResponse.redirect(`${origin}${next}`);
  response.cookies.delete(STEAM_NEXT_COOKIE);
  return response;
}
