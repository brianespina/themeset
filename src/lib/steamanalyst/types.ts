// Types transcribed from the SteamAnalyst CS2 Pricing API docs:
// https://www.steamanalyst.com/api-doc (fetched 2026-09-27).
// Hobby (free) tier only exposes single-item lookup via /v1/prices — the
// bulk /v1/prices/all and /v2 endpoints require a paid tier. Keep in sync if
// SteamAnalyst revises the schema.

export const CS2_APP = "cs2";

// GET /v1/prices?app=cs2&market_name=...
export interface GetPriceRequest {
  marketHashName: string;
}

export interface PriceResponse {
  market_name: string;
  price: number;
  currency: string;
  updated_at?: string;
  manipulated?: boolean;
}
