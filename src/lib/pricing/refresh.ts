import "server-only";

import { prisma } from "@/lib/prisma";
import { fetchByMykelCatalog, type ByMykelRecord } from "@/lib/catalog/bymykel";
import { bestMatch, norm, WEAR_NAME } from "@/lib/catalog/normalize";
import { SKINS } from "@/lib/seed-data";
import { saGetPrice, SteamAnalystApiError, SteamAnalystConfigError } from "@/lib/steamanalyst/client";

/**
 * Daily price refresh. SteamAnalyst's free Hobby tier is single-item lookup
 * only (no bulk endpoint) capped at 100 requests/day — one call per seed
 * skin (currently 40) keeps this comfortably under budget with room for the
 * catalog to grow. Meant to be run once a day (see the /api/cron route),
 * never on a request path.
 *
 * Identity (weapon, paint, image, rarity, collection, float range) still
 * comes from the free ByMykel catalog, same as before SkinBaron was dropped.
 */

export interface RefreshFailure {
  marketHashName: string;
  error: string;
}

export interface RefreshResult {
  attempted: number;
  updated: number;
  failed: RefreshFailure[];
}

function indexByWeapon(records: ByMykelRecord[]): Map<string, ByMykelRecord[]> {
  const byWeapon = new Map<string, ByMykelRecord[]>();
  for (const r of records) {
    const key = norm(r.weapon);
    if (!byWeapon.has(key)) byWeapon.set(key, []);
    byWeapon.get(key)!.push(r);
  }
  return byWeapon;
}

export async function refreshPrices(): Promise<RefreshResult> {
  const byMykel = await fetchByMykelCatalog();
  const byWeapon = indexByWeapon(byMykel);

  const result: RefreshResult = { attempted: 0, updated: 0, failed: [] };

  for (const skin of SKINS) {
    const identity = bestMatch(byWeapon.get(norm(skin.wl)) ?? [], skin.n);
    const label = `${skin.wl} | ${skin.n}`;
    if (!identity) {
      result.failed.push({ marketHashName: label, error: "no ByMykel identity match" });
      continue;
    }

    const wearName = WEAR_NAME[skin.ex];
    const fullMarketHashName = wearName
      ? `${identity.marketHashName} (${wearName})`
      : identity.marketHashName;

    result.attempted++;
    try {
      const priceRes = await saGetPrice({ marketHashName: fullMarketHashName });

      const skinRow = await prisma.skin.upsert({
        where: { marketHashName: identity.marketHashName },
        update: {
          weapon: identity.weapon,
          name: identity.pattern,
          imageUrl: identity.image,
          rarity: identity.rarity,
          collection: identity.collection,
        },
        create: {
          weapon: identity.weapon,
          name: identity.pattern,
          marketHashName: identity.marketHashName,
          imageUrl: identity.image,
          rarity: identity.rarity,
          collection: identity.collection,
        },
      });

      // Prisma's generated compound-unique input doesn't accept `null` for
      // nullable fields (exterior/phase), so this can't be a single upsert.
      const existingVariant = await prisma.skinVariant.findFirst({
        where: { skinId: skinRow.id, exterior: wearName ?? null, stattrak: false, souvenir: false, phase: null },
      });
      const variantRow =
        existingVariant ??
        (await prisma.skinVariant.create({
          data: {
            skinId: skinRow.id,
            exterior: wearName ?? null,
            floatMin: identity.minFloat,
            floatMax: identity.maxFloat,
          },
        }));

      await prisma.price.upsert({
        where: {
          skinVariantId_marketplace: { skinVariantId: variantRow.id, marketplace: "steamanalyst" },
        },
        update: { price: priceRes.price, currency: priceRes.currency ?? "USD" },
        create: {
          skinVariantId: variantRow.id,
          marketplace: "steamanalyst",
          price: priceRes.price,
          currency: priceRes.currency ?? "USD",
        },
      });

      await prisma.priceHistory.create({
        data: { skinVariantId: variantRow.id, marketplace: "steamanalyst", price: priceRes.price },
      });

      result.updated++;
    } catch (e) {
      // A missing key means every subsequent call will fail the same way — stop the loop.
      if (e instanceof SteamAnalystConfigError) throw e;
      const message = e instanceof SteamAnalystApiError ? `${e.status} ${e.message}` : String(e);
      result.failed.push({ marketHashName: fullMarketHashName, error: message });
    }
  }

  return result;
}
