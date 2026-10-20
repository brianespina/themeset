import { loadCatalog } from "@/lib/catalog";
import { formatPrice, priceOf } from "@/lib/scoring";
import { SKINS } from "@/lib/seed-data";
import { SkinDatabaseGrid, type DbItem } from "@/components/SkinDatabaseGrid";

export const metadata = { title: "Skin database — ThemeSet" };

export default async function SkinsPage() {
  const catalog = await loadCatalog();

  const items: DbItem[] = SKINS.map((skin) => {
    const rec = catalog.resolve(skin.wl, skin.n);
    const price = priceOf(skin, catalog);
    return {
      skin,
      img: rec?.image,
      priceStr: formatPrice(price),
      rarity: rec?.rarity ?? skin.rar,
    };
  });

  const indexNote =
    catalog.source === "steamanalyst"
      ? `${catalog.count.toLocaleString("en-US")} skins indexed · ${SKINS.length} hand-scored so far`
      : `${SKINS.length} scored`;

  return (
    <main className="mx-auto max-w-[1480px] px-12">
      <div className="border-b border-border py-14">
        <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-ink-muted">
          Skin database
        </div>
        <h1 className="font-display text-[48px] font-medium tracking-[-0.025em]">
          Every skin, scored against your theme.
        </h1>
        <p className="mt-4 text-[15px] text-ink-muted">{indexNote}</p>
      </div>

      <div className="pt-9">
        <SkinDatabaseGrid items={items} />
      </div>
    </main>
  );
}
