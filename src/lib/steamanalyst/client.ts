import "server-only";

import { CS2_APP, type GetPriceRequest, type PriceResponse } from "./types";

/**
 * SteamAnalyst REST client — https://www.steamanalyst.com/api-doc
 *
 * Replaces SkinBaron as ThemeSet's price source (SkinBaron declined API
 * access). The Hobby (free) plan is 100 requests/day and single-item lookup
 * only via /v1/prices — there is no bulk endpoint on this tier, so callers
 * must fetch one market_hash_name at a time (see src/lib/pricing/refresh.ts,
 * which budgets one call per catalog item, once a day).
 *
 * Auth is a Bearer token, unlike SkinBaron's body-embedded key.
 * This module is server-only: the key must never reach the browser bundle.
 */

const BASE_URL = "https://api.steamanalyst.com";

function getApiKey(): string {
  const key = process.env.STEAMANALYST_API_KEY;
  if (!key) {
    throw new SteamAnalystConfigError(
      "STEAMANALYST_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }
  return key;
}

export class SteamAnalystConfigError extends Error {}

export class SteamAnalystApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(`SteamAnalyst ${endpoint} failed: ${status} ${body}`);
    this.name = "SteamAnalystApiError";
  }
}

async function get<TResponse>(endpoint: string, params: Record<string, string>): Promise<TResponse> {
  const url = new URL(endpoint, BASE_URL);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
    // Refresh is driven by our own daily job (see lib/pricing/refresh.ts),
    // not by Next's fetch cache — every call here should hit the network.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new SteamAnalystApiError(endpoint, res.status, text);
  }

  return (await res.json()) as TResponse;
}

/** Single-item price lookup. The only endpoint available on the free Hobby tier. */
export function saGetPrice({ marketHashName }: GetPriceRequest) {
  return get<PriceResponse>("/v1/prices", { app: CS2_APP, market_name: marketHashName });
}
