"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { SkinArt, ArtWell } from "@/components/SkinArt";
import { clamp, formatPrice, match, rollSet, scoreColor, slotName } from "@/lib/scoring";
import { sumPrices, type ResolvedSkinView } from "@/lib/view";
import { SKINS, THEMES } from "@/lib/seed-data";

const THEME_CHIPS = ["Surprise me", "Crimson", "Midnight", "Whiteout", "Gold", "Toxic", "Cyberpunk", "Royal Purple"];
const BUDGET_CHIPS = ["$250", "$500", "$1,500", "No limit"];
const STYLE_CHIPS = ["Random", "Minimal", "Loud", "Tactical", "Luxury"];

export function GenerateScreen({ skins }: { skins: ResolvedSkinView[] }) {
  const { setThemeName } = useTheme();
  const byId = useMemo(() => new Map(skins.map((s) => [s.id, s])), [skins]);

  const [gTheme, setGTheme] = useState("Surprise me");
  const [gBudget, setGBudget] = useState("$500");
  const [gStyle, setGStyle] = useState("Random");
  const [out, setOut] = useState<{ theme: string; picks: string[] } | null>(null);

  function roll() {
    const result = rollSet(SKINS, THEMES, gTheme, gBudget);
    setOut(result);
    setThemeName(result.theme);
  }

  const items = out ? out.picks.map((id) => byId.get(id)).filter((s): s is ResolvedSkinView => !!s) : [];
  const total = sumPrices(items);
  const score = out && items.length
    ? clamp(Math.round(items.reduce((a, s) => a + match(s, out.theme), 0) / items.length))
    : 0;

  return (
    <main className="mx-auto max-w-[1480px] px-12">
      <div className="border-b border-border py-14 pb-[30px]">
        <div className="mb-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--acc)" }}>
          Random theme generator
        </div>
        <h1 className="font-display text-[48px] font-medium tracking-[-0.025em]">
          Can&rsquo;t decide? Let it roll.
        </h1>
        <p className="mt-3 max-w-[560px] text-[15px] text-ink-muted">
          Set the constraints, hit roll, and you get a full six-slot set that actually holds
          together. Reroll until something clicks.
        </p>
      </div>

      <div className="grid gap-11 py-9 pb-[90px]" style={{ gridTemplateColumns: "320px minmax(0,1fr)" }}>
        <div
          className="border border-border bg-surface p-5.5"
          style={{ position: "sticky", top: 100, alignSelf: "start" }}
        >
          <ChipGroup label="Theme" opts={THEME_CHIPS} value={gTheme} onChange={setGTheme} />
          <ChipGroup label="Budget" opts={BUDGET_CHIPS} value={gBudget} onChange={setGBudget} />
          <ChipGroup label="Style" opts={STYLE_CHIPS} value={gStyle} onChange={setGStyle} last />
          <button
            type="button"
            onClick={roll}
            className="w-full bg-ink py-[17px] text-[12px] font-semibold uppercase tracking-[0.18em] text-bg hover:bg-white"
          >
            Roll a set
          </button>
        </div>

        {!out ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center border border-border bg-surface-sunken text-center">
            <div className="font-display text-[26px] text-ink-dim">Nothing rolled yet</div>
            <p className="mt-2 max-w-[320px] text-[13.5px] text-ink-dim">
              Pick your constraints on the left and hit roll. Six slots, one palette, no clashing.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-end justify-between border-b border-border pb-5">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--acc)" }}>
                  {out.theme}
                </div>
                <div className="mt-1 font-display text-[36px]">Rolled set</div>
              </div>
              <div className="flex gap-11">
                <div className="text-right">
                  <div className="font-display text-[20px]">{total.amount ? formatPrice(total) : "—"}</div>
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-muted">Est. total</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-[58px] leading-[0.85]" style={{ color: "var(--acc)" }}>
                    {score}
                  </div>
                  <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-muted">Theme match</div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {items.map((s) => {
                const m = match(s, out.theme);
                return (
                  <Link
                    key={s.id}
                    href={`/skins/${s.id}`}
                    className="block border border-border bg-surface hover:border-acc"
                  >
                    <ArtWell className="h-32 p-6">
                      <SkinArt weapon={s.w} src={s.img} alt={`${s.wl} | ${s.n}`} c1={s.c1} c2={s.c2} c3={s.c3} />
                    </ArtWell>
                    <div className="px-3.5 pt-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-ink-dim">{slotName(s.w)}</div>
                      <div className="mt-1 text-[13.5px]">
                        {s.wl} | {s.n}
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-3.5 pb-3.5 pt-2">
                      <span className="font-display text-[12.5px]">{s.priceStr}</span>
                      <span className="text-[12.5px]" style={{ color: scoreColor(m) }}>
                        {m}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={roll}
                className="border border-border-strong px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] hover:border-ink"
              >
                Roll again
              </button>
              <Link
                href="/build"
                className="bg-ink px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white"
              >
                Refine in builder
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ChipGroup({
  label,
  opts,
  value,
  onChange,
  last,
}: {
  label: string;
  opts: string[];
  value: string;
  onChange: (v: string) => void;
  last?: boolean;
}) {
  return (
    <div className={last ? "mb-6" : "mb-6"}>
      <div className="mb-2.5 text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className="border px-2.5 py-1.5 text-[11.5px]"
              style={{ borderColor: on ? "var(--acc)" : "#29292F", color: on ? "#F5F5F5" : "#96969F" }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
