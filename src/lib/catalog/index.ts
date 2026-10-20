import "server-only";

import { prisma } from "@/lib/prisma";
import { fetchByMykelCatalog, type ByMykelRecord } from "./bymykel";
import { bestMatch, norm, splitMarketName, WEAR_NAME } from "./normalize";

/**
 * The catalog layer. Recreates the interface of the original design's
 * themeset-data.js `loadCatalog()` — `resolve()` + `price()`.
 *
 * Prices used to come from a live SkinBaron call on every cache miss;
 * SkinBaron never approved API access, so pricing now comes from Postgres,
 * populated once a day by src/lib/pricing/refresh.ts against SteamAnalyst's
 * free (100 req/day, single-item) tier — see that file for why a live call
 * per request isn't an option on that plan.
 *
 *   Postgres (`Price`) -> live price snapshot, refreshed daily
 *   ByMykel            -> identity (weapon, paint, image), rarity, collection,
 *                         float range — same free public catalog as before
 *
 * Neither source ships a colour palette, so c1/c2/c3 stay hand-curated in
 * lib/seed-data.ts, same as the original prototype's fallback behaviour.
 */

export type CatalogSource = "steamanalyst" | "public" | "offline";

export interface ResolvedSkin {
  marketHashName: string;
  weapon: string;
  pattern: string;
  image?: string;
  rarity?: string;
  rarityColor?: string;
  collection?: string;
  minFloat?: number;
  maxFloat?: number;
}

export interface LivePrice {
  amount: number;
  currency: string;
  marketplace: "steamanalyst";
  updatedAt: number;
}

export interface Catalog {
  source: CatalogSource;
  note: string;
  count: number;
  resolve(weaponLabel: string, paintName: string): ResolvedSkin | null;
  price(weaponLabel: string, paintName: string, exteriorShort: string): LivePrice | null;
}

interface DbIdentity {
  marketHashName: string;
  weapon: string;
  pattern: string;
  image?: string;
  variants: Map<string, { price: number; currency: string; updatedAt: number }>; // exterior full name -> price
}

const CACHE_TTL_MS = 15 * 60 * 1000; // matches the UI's "updated every 15 min" copy

interface CacheEntry {
  catalog: Catalog;
  fetchedAt: number;
}

// Survives HMR in dev; a real deployment should move this to a shared cache
// (Redis/DB) since serverless instances don't share memory — see handoff
// section 34 (Performance): "cache price data appropriately".
const globalForCatalog = globalThis as unknown as { __themesetCatalog?: CacheEntry };

function indexByWeapon<T extends { weapon: string }>(records: T[]): Map<string, T[]> {
  const byWeapon = new Map<string, T[]>();
  for (const r of records) {
    const key = norm(r.weapon);
    if (!byWeapon.has(key)) byWeapon.set(key, []);
    byWeapon.get(key)!.push(r);
  }
  return byWeapon;
}

async function fromDatabase(): Promise<Map<string, DbIdentity>> {
  const skins = await prisma.skin.findMany({
    include: { variants: { include: { prices: { where: { marketplace: "steamanalyst" } } } } },
  });

  const byName = new Map<string, DbIdentity>();
  for (const s of skins) {
    const [weapon, pattern] = splitMarketName(s.marketHashName);
    const identity: DbIdentity = {
      marketHashName: s.marketHashName,
      weapon,
      pattern,
      image: s.imageUrl ?? undefined,
      variants: new Map(),
    };
    for (const v of s.variants) {
      const price = v.prices[0];
      if (v.exterior && price) {
        identity.variants.set(v.exterior, {
          price: price.price,
          currency: price.currency,
          updatedAt: price.updatedAt.getTime(),
        });
      }
    }
    byName.set(s.marketHashName, identity);
  }
  return byName;
}

function buildCatalog(
  db: Map<string, DbIdentity> | null,
  byMykel: ByMykelRecord[] | null,
  source: CatalogSource,
  note: string
): Catalog {
  const dbRecords = db ? [...db.values()] : [];
  const dbByWeapon = indexByWeapon(dbRecords);
  const bmByWeapon = byMykel ? indexByWeapon(byMykel) : new Map<string, ByMykelRecord[]>();

  const resolveCache = new Map<string, ResolvedSkin | null>();

  function resolve(weaponLabel: string, paintName: string): ResolvedSkin | null {
    const key = weaponLabel + "|" + paintName;
    if (resolveCache.has(key)) return resolveCache.get(key)!;

    const dbHit = bestMatch(dbByWeapon.get(norm(weaponLabel)) ?? [], paintName);
    const bmHit = bestMatch(bmByWeapon.get(norm(weaponLabel)) ?? [], paintName);

    let out: ResolvedSkin | null = null;
    if (dbHit || bmHit) {
      out = {
        marketHashName: dbHit?.marketHashName ?? bmHit?.marketHashName ?? `${weaponLabel} | ${paintName}`,
        weapon: dbHit?.weapon ?? bmHit?.weapon ?? weaponLabel,
        pattern: dbHit?.pattern ?? bmHit?.pattern ?? paintName,
        image: dbHit?.image ?? bmHit?.image,
        rarity: bmHit?.rarity,
        rarityColor: bmHit?.rarityColor,
        collection: bmHit?.collection,
        minFloat: bmHit?.minFloat,
        maxFloat: bmHit?.maxFloat,
      };
    }
    resolveCache.set(key, out);
    return out;
  }

  function price(weaponLabel: string, paintName: string, exteriorShort: string): LivePrice | null {
    const dbHit = bestMatch(dbByWeapon.get(norm(weaponLabel)) ?? [], paintName);
    if (!dbHit) return null;
    const wear = WEAR_NAME[exteriorShort];
    const entry = (wear && dbHit.variants.get(wear)) ?? dbHit.variants.values().next().value;
    if (!entry) return null;
    return { amount: entry.price, currency: entry.currency, marketplace: "steamanalyst", updatedAt: entry.updatedAt };
  }

  return { source, note, count: dbRecords.length || (byMykel?.length ?? 0), resolve, price };
}

async function load(): Promise<Catalog> {
  let db: Map<string, DbIdentity> | null = null;
  let note = "";

  try {
    db = await fromDatabase();
    if (db.size === 0) {
      note = "No cached prices yet — run the daily refresh job (see README)";
    }
  } catch {
    note = "Database unreachable — using the public catalog (no live prices)";
  }

  let byMykel: ByMykelRecord[] | null = null;
  try {
    byMykel = await fetchByMykelCatalog();
  } catch {
    // Metadata enrichment is best-effort; DB identity alone still works.
  }

  if ((!db || db.size === 0) && !byMykel) {
    return {
      source: "offline",
      note: "No network — showing silhouettes",
      count: 0,
      resolve: () => null,
      price: () => null,
    };
  }

  const source: CatalogSource = db && db.size > 0 ? "steamanalyst" : "public";
  return buildCatalog(db, byMykel, source, note);
}

export async function loadCatalog(): Promise<Catalog> {
  const cached = globalForCatalog.__themesetCatalog;
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.catalog;
  }
  const catalog = await load();
  globalForCatalog.__themesetCatalog = { catalog, fetchedAt: Date.now() };
  return catalog;
}
