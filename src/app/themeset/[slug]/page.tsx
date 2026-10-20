import { notFound } from "next/navigation";
import { loadCatalog } from "@/lib/catalog";
import { formatPrice, match, slotName } from "@/lib/scoring";
import { SETS } from "@/lib/seed-data";
import { resolveAllSkins, sumPrices } from "@/lib/view";
import { SetDetailScreen, type DetailRow } from "@/components/detail/SetDetailScreen";

export function generateStaticParams() {
  return SETS.map((s) => ({ slug: s.slug }));
}

export default async function SetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const set = SETS.find((s) => s.slug === slug);
  if (!set) notFound();

  const catalog = await loadCatalog();
  const skins = resolveAllSkins(catalog);
  const byId = new Map(skins.map((s) => [s.id, s]));

  const rows: DetailRow[] = set.skinIds
    .map((id) => byId.get(id))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((s) => ({ ...s, slot: slotName(s.w), m: match(s, set.theme) }));

  const usedIds = new Set(set.skinIds);
  const alts: DetailRow[] = skins
    .filter((s) => !usedIds.has(s.id) && s.w !== "knife" && s.w !== "gloves")
    .map((s) => ({ ...s, slot: slotName(s.w), m: match(s, set.theme) }))
    .sort((a, b) => b.m - a.m)
    .slice(0, 4);

  const total = sumPrices(rows);

  return <SetDetailScreen set={set} rows={rows} alts={alts} totalStr={formatPrice(total)} />;
}
