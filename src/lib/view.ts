// Server-side view-model layer: resolves each seed skin against the catalog
// (ByMykel image, SteamAnalyst live price via Postgres, ByMykel rarity/
// collection) into a plain, fully-serializable object that client components
// can consume without ever touching the catalog (and therefore never
// touching Prisma or the SteamAnalyst key).

import type { Catalog } from "./catalog";
import { formatPrice, priceOf, type ResolvedPrice } from "./scoring";
import { SKINS, type Skin } from "./seed-data";

export interface ResolvedSkinView extends Skin {
  img?: string;
  price: ResolvedPrice;
  priceStr: string;
  rarity: string;
  collection: string;
}

export function resolveSkinView(skin: Skin, catalog: Catalog): ResolvedSkinView {
  const rec = catalog.resolve(skin.wl, skin.n);
  const price = priceOf(skin, catalog);
  return {
    ...skin,
    img: rec?.image,
    price,
    priceStr: formatPrice(price),
    rarity: rec?.rarity ?? skin.rar,
    collection: rec?.collection ?? skin.col,
  };
}

export function resolveAllSkins(catalog: Catalog): ResolvedSkinView[] {
  return SKINS.map((s) => resolveSkinView(s, catalog));
}

/** Sums resolved prices. Both live (SteamAnalyst) and placeholder prices are USD. */
export function sumPrices(items: { price: ResolvedPrice }[]): ResolvedPrice {
  const amount = items.reduce((acc, it) => acc + it.price.amount, 0);
  const live = items.some((it) => it.price.live);
  return { amount, currency: "USD", live };
}
