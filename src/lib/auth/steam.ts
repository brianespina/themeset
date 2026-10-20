import "server-only";

// Steam sign-in, implemented by hand.
//
// WHY THIS FILE EXISTS: Steam authenticates with OpenID 2.0, a spec that was
// deprecated in 2014 and which Supabase Auth has no provider for (its social
// logins are OAuth2/OIDC). Discord and Google go through
// supabase.auth.signInWithOAuth; Steam cannot. So we run the OpenID exchange
// ourselves, verify it with Steam, and then mint a Supabase session for the
// verified Steam id (see src/app/auth/steam/callback/route.ts).

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";

/** Steam always returns a claimed_id of this exact shape. */
const CLAIMED_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/;

/**
 * URL to send the user to in order to begin Steam sign-in.
 *
 * `identifier_select` means "let the user pick which Steam account"; Steam
 * fills in the real identity on the way back.
 */
export function buildSteamAuthUrl(returnTo: string, realm: string): string {
  const params = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": returnTo,
    "openid.realm": realm,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

/**
 * Verifies Steam's assertion and returns the 17-digit SteamID64.
 *
 * The parameters arrive as query string values on a redirect, so they are
 * entirely user-supplied: anyone can hand us a URL claiming to be any Steam
 * id. The only thing that makes them trustworthy is `check_authentication`,
 * which asks Steam to confirm it really signed this exact set of values. Never
 * read the steam id out of the query string without this round-trip.
 *
 * Returns null on any failure — unsigned, tampered, or rejected by Steam.
 */
export async function verifySteamAssertion(
  query: URLSearchParams,
): Promise<string | null> {
  const claimedId = query.get("openid.claimed_id");
  if (!claimedId) return null;

  const match = CLAIMED_ID_PATTERN.exec(claimedId);
  if (!match) return null;
  const steamId = match[1];

  // Echo every openid.* parameter back with mode swapped to
  // check_authentication. Steam recomputes the signature over the fields named
  // in openid.signed and tells us whether it matches.
  const body = new URLSearchParams();
  for (const [key, value] of query.entries()) {
    if (key.startsWith("openid.")) body.set(key, value);
  }
  body.set("openid.mode", "check_authentication");

  let response: Response;
  try {
    response = await fetch(STEAM_OPENID_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
  } catch {
    return null;
  }

  if (!response.ok) return null;

  const text = await response.text();
  // Key-value form response, e.g. "ns:...\nis_valid:true\n".
  const isValid = text
    .split("\n")
    .some((line) => line.trim() === "is_valid:true");

  return isValid ? steamId : null;
}

export interface SteamProfile {
  personaName: string | null;
  avatarUrl: string | null;
}

/**
 * Display name and avatar for a verified Steam id.
 *
 * Optional: needs STEAM_WEB_API_KEY. Without one, sign-in still works and the
 * user just gets a generated username they can change. Never let a profile
 * lookup failure block a sign-in that Steam already verified.
 */
export async function fetchSteamProfile(steamId: string): Promise<SteamProfile> {
  const key = process.env.STEAM_WEB_API_KEY;
  if (!key) return { personaName: null, avatarUrl: null };

  try {
    const url = new URL("https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/");
    url.searchParams.set("key", key);
    url.searchParams.set("steamids", steamId);

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return { personaName: null, avatarUrl: null };

    const json = (await response.json()) as {
      response?: { players?: { personaname?: string; avatarfull?: string }[] };
    };
    const player = json.response?.players?.[0];
    return {
      personaName: player?.personaname ?? null,
      avatarUrl: player?.avatarfull ?? null,
    };
  } catch {
    return { personaName: null, avatarUrl: null };
  }
}
