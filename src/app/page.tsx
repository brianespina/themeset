import { loadCatalog, type Catalog } from "@/lib/catalog";
import { formatPrice, priceOf, scoreColor } from "@/lib/scoring";
import { SETS, skinById, type Skin } from "@/lib/seed-data";
import { PopularThemes } from "@/components/PopularThemes";
import { SetCard, type SetCardArt } from "@/components/SetCard";
import { SkinArt } from "@/components/SkinArt";
import { Button } from "@/components/ui/Button";

function artFor(skin: Skin, catalog: Catalog): SetCardArt {
  const rec = catalog.resolve(skin.wl, skin.n);
  return {
    weapon: skin.w,
    img: rec?.image,
    alt: `${skin.wl} | ${skin.n}`,
    c1: skin.c1,
    c2: skin.c2,
    c3: skin.c3,
  };
}

function buildSetCardProps(slug: string, catalog: Catalog) {
  const set = SETS.find((s) => s.slug === slug)!;
  const items = set.skinIds.map(skinById);
  const total = items.reduce((acc, s) => acc + priceOf(s, catalog).amount, 0);
  return {
    slug: set.slug,
    name: set.name,
    creator: set.creator,
    score: set.score,
    scoreColor: scoreColor(set.score),
    totalStr: formatPrice({ amount: total, currency: "USD", live: false }),
    likes: set.likes,
    art: items.slice(0, 4).map((s) => artFor(s, catalog)),
  };
}

export default async function HomePage() {
  const catalog = await loadCatalog();
  const featured = buildSetCardProps("crimson-phantom", catalog);
  const trending = SETS.slice(0, 6).map((s) => buildSetCardProps(s.slug, catalog));

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-border px-12 py-[86px] pb-[74px]">
        <div className="mx-auto grid max-w-[1480px] grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center gap-16">
          <div>
            <div className="mb-6 flex items-center gap-2.5">
              <span className="h-px w-[22px]" style={{ background: "var(--acc)" }} />
              <span className="text-[11px] uppercase tracking-[0.24em] text-ink-muted">
                CS2 loadout styling
              </span>
            </div>
            <h1 className="font-display text-[66px] font-medium leading-[1.02] tracking-[-0.025em]">
              Build a CS2 style that actually matches.
            </h1>
            <p className="mt-6 max-w-[470px] text-[16.5px] leading-[1.62] text-ink-muted">
              Stop running a karambit that fights your gloves. Pick a theme, pull skins that sit
              together, and lock a full set — knife to Glock.
            </p>
            <div className="mt-8 flex gap-3">
              <Button variant="primary" href="/build">
                Create a ThemeSet
              </Button>
              <Button variant="secondary" href="/explore">
                Explore ThemeSets
              </Button>
            </div>
            <div className="mt-12 flex gap-11">
              {[
                ["12,480", "Skins indexed"],
                ["34,190", "Sets built"],
                ["88", "Avg. match"],
              ].map(([value, label]) => (
                <div key={label}>
                  <div className="font-display text-[25px]">{value}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative border border-border bg-surface">
            <div className="absolute inset-x-0 top-0 h-px opacity-55" style={{ background: "var(--acc)" }} />
            <div className="flex items-center justify-between border-b border-border px-[22px] py-[18px]">
              <span className="text-[10.5px] uppercase tracking-[0.22em] text-ink-muted">
                Set of the week
              </span>
              <span className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: "var(--acc)" }}>
                {SETS[0].theme}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-2">
              {featured.art.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center border border-border-soft bg-surface-sunken ${
                    i < 2 ? "h-[132px] p-9" : "h-[112px] p-8"
                  }`}
                >
                  <SkinArt weapon={a.weapon} src={a.img} alt={a.alt} c1={a.c1} c2={a.c2} c3={a.c3} />
                </div>
              ))}
            </div>
            <div className="flex items-end justify-between px-[22px] py-[22px]">
              <div>
                <div className="font-display text-[27px]">{featured.name}</div>
                <div className="text-xs text-ink-muted">
                  {featured.creator} · {SETS[0].skinIds.length} items
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-[44px]" style={{ color: "var(--acc)" }}>
                  {featured.score}
                </div>
                <div className="text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">
                  Theme match
                </div>
              </div>
            </div>
            <a
              href={`/themeset/${featured.slug}`}
              className="flex items-center justify-between border-t border-border px-[22px] py-[15px] hover:bg-surface-raised"
            >
              <span className="text-[11px] uppercase tracking-[0.16em]">Open the set</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* Popular themes */}
      <section className="border-b border-border px-12 py-16">
        <div className="mx-auto max-w-[1480px]">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-[31px] font-medium tracking-[-0.02em]">Popular themes</h2>
            <span className="text-[11px] text-ink-muted">Tap one — the whole site tunes to it</span>
          </div>
          <PopularThemes />
        </div>
      </section>

      {/* Trending ThemeSets */}
      <section className="border-b border-border px-12 py-16">
        <div className="mx-auto max-w-[1480px]">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-display text-[31px] font-medium tracking-[-0.02em]">Trending ThemeSets</h2>
            <a href="/explore" className="text-[11px] uppercase tracking-[0.16em] text-ink-muted hover:text-ink">
              All sets →
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            {trending.map((s) => (
              <SetCard key={s.slug} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-12 py-[78px] pb-[86px]">
        <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-8">
          <div>
            <h2 className="max-w-[620px] font-display text-[42px] font-medium tracking-[-0.025em]">
              Your inventory deserves better than a random pull.
            </h2>
            <p className="mt-3 text-[15px] text-ink-muted">
              Start with a theme, or start from what you already own.
            </p>
          </div>
          <div className="flex flex-none gap-3">
            <Button variant="primary" href="/build">
              Create a ThemeSet
            </Button>
            <Button variant="secondary" href="/generate">
              Surprise me
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
