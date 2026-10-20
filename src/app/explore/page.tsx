import { loadCatalog } from "@/lib/catalog";
import { formatPrice, scoreColor } from "@/lib/scoring";
import { SETS } from "@/lib/seed-data";
import { resolveAllSkins, sumPrices } from "@/lib/view";
import { ExploreScreen, type ExploreSetView } from "@/components/explore/ExploreScreen";

export const metadata = { title: "Explore — ThemeSet" };

export default async function ExplorePage() {
  const catalog = await loadCatalog();
  const resolved = resolveAllSkins(catalog);
  const byId = new Map(resolved.map((s) => [s.id, s]));

  const sets: ExploreSetView[] = SETS.map((set) => {
    const items = set.skinIds.map((id) => byId.get(id)!).filter(Boolean);
    const total = sumPrices(items);
    const tags = new Set<string>();
    items.forEach((s) => s.tags.forEach((t) => tags.add(t)));
    return {
      slug: set.slug,
      name: set.name,
      creator: set.creator,
      score: set.score,
      scoreColor: scoreColor(set.score),
      totalStr: formatPrice(total),
      totalAmount: total.amount,
      likes: set.likes,
      tags: [...tags],
      art: items.slice(0, 4).map((s) => ({
        weapon: s.w,
        img: s.img,
        alt: `${s.wl} | ${s.n}`,
        c1: s.c1,
        c2: s.c2,
        c3: s.c3,
      })),
    };
  });

  return <ExploreScreen sets={sets} />;
}
