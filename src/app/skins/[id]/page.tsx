import Link from "next/link";
import { notFound } from "next/navigation";
import { loadCatalog } from "@/lib/catalog";
import { WEAR_MULTIPLIER, WEAR_NAME } from "@/lib/catalog/normalize";
import { formatPrice, match, pairMatch, priceOf, scoreColor } from "@/lib/scoring";
import { SKINS, THEMES } from "@/lib/seed-data";
import { SkinArt, ArtWell } from "@/components/SkinArt";
import { Button } from "@/components/ui/Button";

export function generateStaticParams() {
  return SKINS.map((s) => ({ id: s.id }));
}

export default async function SkinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skin = SKINS.find((s) => s.id === id);
  if (!skin) notFound();

  const catalog = await loadCatalog();
  const rec = catalog.resolve(skin.wl, skin.n);
  const basePrice = priceOf(skin, catalog);

  const wearRows = (["FN", "MW", "FT", "WW", "BS"] as const).map((code) => {
    const live = catalog.price(skin.wl, skin.n, code);
    const price = live
      ? { amount: live.amount, currency: live.currency, live: true }
      : { amount: skin.p * WEAR_MULTIPLIER[code], currency: "USD" as const, live: false };
    return { code, name: WEAR_NAME[code], price, isCurrent: code === skin.ex };
  });

  const topThemes = THEMES.map((t) => ({ theme: t, value: match(skin, t.name) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const paired = SKINS.filter((s) => s.id !== skin.id)
    .map((s) => ({ skin: s, m: pairMatch(skin, s) }))
    .sort((a, b) => b.m - a.m)
    .slice(0, 4);

  return (
    <main className="mx-auto max-w-[1480px] px-12">
      <div className="pt-7 text-[11px] uppercase tracking-[0.16em] text-ink-dim">
        <Link href="/skins" className="text-ink-muted hover:text-ink">
          Skins
        </Link>{" "}
        / {skin.wl}
      </div>

      <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-14 border-b border-border py-11">
        <div className="relative flex min-h-[400px] items-center justify-center border border-border bg-surface-sunken p-[52px]">
          <div className="absolute inset-x-0 top-0 h-px opacity-50" style={{ background: "var(--acc)" }} />
          <SkinArt weapon={skin.w} src={rec?.image} alt={`${skin.wl} | ${skin.n}`} c1={skin.c1} c2={skin.c2} c3={skin.c3} />
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--acc)" }}>
            {rec?.rarity ?? skin.rar}
          </div>
          <h1 className="mt-2 font-display text-[44px] font-medium leading-[1.05] tracking-[-0.03em]">
            {skin.wl} | {skin.n}
          </h1>
          <p className="mt-2 text-[15px] text-ink-muted">
            {skin.wl} · {rec?.collection ?? skin.col}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {skin.tags.map((tag) => (
              <span
                key={tag}
                className="border border-border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-8">
            <div className="mb-2 text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">
              Price by wear
            </div>
            {wearRows.map((row) => (
              <div
                key={row.code}
                className={`flex items-center justify-between border-b py-[11px] text-[13.5px] ${
                  row.isCurrent ? "text-ink border-acc" : "text-ink-muted border-border-soft"
                }`}
              >
                <span>{row.name}</span>
                <span className="font-display">{formatPrice(row.price)}</span>
              </div>
            ))}
            {!basePrice.live && (
              <p className="mt-2 text-[11px] text-ink-dim">
                Placeholder pricing — add a SteamAnalyst API key and run the daily refresh for live wear-tier prices.
              </p>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="primary" href="/build">
              Add to my set
            </Button>
            <Button variant="secondary" href="/combos">
              Build around it
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-14 py-12">
        <div>
          <div className="mb-4 text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">
            Themes it works in
          </div>
          {topThemes.map(({ theme, value }) => (
            <div key={theme.name} className="mb-3 flex items-center gap-3">
              <span className="h-3.5 w-3.5 flex-none" style={{ background: theme.accent }} />
              <span className="w-28 flex-none text-[13px]">{theme.name}</span>
              <div className="h-0.5 flex-1 bg-track">
                <div className="h-full" style={{ width: `${value}%`, background: theme.accent }} />
              </div>
              <span className="w-8 flex-none text-right font-display text-[13px]">{value}</span>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-4 text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">
            Pairs well with
          </div>
          <div className="grid grid-cols-4 gap-3">
            {paired.map(({ skin: p, m }) => {
              const pRec = catalog.resolve(p.wl, p.n);
              const pPrice = priceOf(p, catalog);
              return (
                <Link
                  key={p.id}
                  href={`/skins/${p.id}`}
                  className="block border border-border bg-surface hover:border-acc"
                >
                  <ArtWell className="h-[88px] p-4">
                    <SkinArt weapon={p.w} src={pRec?.image} alt={`${p.wl} | ${p.n}`} c1={p.c1} c2={p.c2} c3={p.c3} />
                  </ArtWell>
                  <div className="px-3 pt-2.5 text-[12px] font-medium truncate">
                    {p.wl} | {p.n}
                  </div>
                  <div className="flex items-center justify-between px-3 pb-3 pt-1">
                    <span className="font-display text-[11.5px]">{formatPrice(pPrice)}</span>
                    <span className="text-[11.5px]" style={{ color: scoreColor(m) }}>
                      {m}%
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
