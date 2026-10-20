import { NextResponse } from "next/server";

import { refreshPrices } from "@/lib/pricing/refresh";
import { SteamAnalystConfigError } from "@/lib/steamanalyst/client";

// Meant to be hit by an external scheduler (Vercel Cron, GitHub Actions, etc.)
// once a day — see README for setup. Guarded by CRON_SECRET so it can't be
// triggered by anyone who finds the URL and burns the SteamAnalyst daily quota.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await refreshPrices();
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof SteamAnalystConfigError) {
      return NextResponse.json({ error: e.message }, { status: 500 });
    }
    throw e;
  }
}
