import { loadCatalog } from "@/lib/catalog";
import { formatPrice, scoreColor } from "@/lib/scoring";
import { CREATORS, SETS } from "@/lib/seed-data";
import { resolveAllSkins, sumPrices } from "@/lib/view";
import { CommunityScreen, type CommunitySetCard } from "@/components/community/CommunityScreen";

export const metadata = { title: "Community — ThemeSet" };

export default async function CommunityPage() {
  const catalog = await loadCatalog();
  const resolved = resolveAllSkins(catalog);
  const byId = new Map(resolved.map((s) => [s.id, s]));

  const sets: CommunitySetCard[] = SETS.map((set) => {
    const items = set.skinIds.map((id) => byId.get(id)!).filter(Boolean);
    const total = sumPrices(items);
    return {
      slug: set.slug,
      name: set.name,
      creator: set.creator,
      score: set.score,
      scoreColor: scoreColor(set.score),
      totalStr: formatPrice(total),
      likes: set.likes,
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

  return <CommunityScreen sets={sets} setDefs={SETS} creators={CREATORS} />;
}
