import "server-only";

// Fallback metadata source — no key required. SkinBaron's price list doesn't
// carry rarity, collection or a colour palette, so this fills those in. Same
// source the original design prototype used (ByMykel/CSGO-API on GitHub).
const PUBLIC_CATALOG_URL =
  "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json";

interface ByMykelRaw {
  name?: string;
  image?: string;
  weapon?: { name?: string };
  pattern?: { name?: string };
  rarity?: { name?: string; color?: string };
  collections?: { name?: string }[];
  min_float?: number;
  max_float?: number;
  category?: { name?: string };
}

export interface ByMykelRecord {
  marketHashName: string;
  image: string;
  weapon: string;
  pattern: string;
  rarity?: string;
  rarityColor?: string;
  collection?: string;
  minFloat?: number;
  maxFloat?: number;
  type?: string;
}

export async function fetchByMykelCatalog(): Promise<ByMykelRecord[]> {
  // ~7MB, over Next's fetch-cache size limit, so it can't use `next.revalidate`.
  // loadCatalog() wraps the merged result in its own in-memory TTL cache instead.
  const res = await fetch(PUBLIC_CATALOG_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`ByMykel catalog fetch failed: ${res.status}`);
  const json = (await res.json()) as ByMykelRaw[];
  return json
    .filter((s) => s.weapon?.name && s.image)
    .map((s) => ({
      marketHashName: s.name ?? "",
      image: s.image!,
      weapon: s.weapon!.name!,
      pattern: s.pattern?.name ?? "",
      rarity: s.rarity?.name,
      rarityColor: s.rarity?.color,
      collection: s.collections?.[0]?.name,
      minFloat: s.min_float,
      maxFloat: s.max_float,
      type: s.category?.name,
    }));
}
