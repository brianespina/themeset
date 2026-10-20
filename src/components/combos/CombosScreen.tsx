"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { SkinArt, ArtWell } from "@/components/SkinArt";
import { formatPrice, match, pairMatch, rankByAnchors, scoreColor } from "@/lib/scoring";
import { sumPrices, type ResolvedSkinView } from "@/lib/view";

const STEPS: [number, string][] = [
  [1, "Your knife"],
  [2, "Matching gloves"],
  [3, "Fill the weapons"],
];

const FILL_GROUPS = ["ak", "m4", "awp", "pistol"];

export function CombosScreen({ skins }: { skins: ResolvedSkinView[] }) {
  const router = useRouter();
  const { themeName } = useTheme();
  const [step, setStep] = useState(1);
  const [comboKnife, setComboKnife] = useState<string | null>("karambit-doppler");
  const [comboGloves, setComboGloves] = useState<string | null>(null);

  const byId = useMemo(() => new Map(skins.map((s) => [s.id, s])), [skins]);
  const knife = comboKnife ? byId.get(comboKnife) ?? null : null;
  const gloves = comboGloves ? byId.get(comboGloves) ?? null : null;
  const anchors = [knife, gloves].filter((x): x is ResolvedSkinView => !!x);

  let candTitle = "";
  let candNote = "";
  let cands: (ResolvedSkinView & { m: number })[] = [];

  if (step === 1) {
    candTitle = "Pick the knife you already own";
    candNote = "Everything after this gets ranked against it.";
    cands = skins
      .filter((s) => s.w === "knife")
      .map((s) => ({ ...s, m: match(s, themeName) }))
      .sort((a, b) => b.p - a.p);
  } else if (step === 2) {
    candTitle = "Gloves that sit with it";
    candNote = "Scored on colour distance and style tags against your knife.";
    cands = rankByAnchors(skins.filter((s) => s.w === "gloves"), anchors);
  } else {
    candTitle = "Weapons that finish the set";
    candNote = "Top pick per slot is pre-filled below. Swap anything you disagree with.";
    cands = rankByAnchors(
      skins.filter((s) => s.w !== "knife" && s.w !== "gloves"),
      anchors
    ).slice(0, 12);
  }

  const chosen: ResolvedSkinView[] = [];
  if (knife) chosen.push(knife);
  if (gloves) chosen.push(gloves);
  if (step === 3) {
    for (const group of FILL_GROUPS) {
      const best = rankByAnchors(skins.filter((s) => s.w === group), anchors)[0];
      if (best) chosen.push(byId.get(best.id)!);
    }
  }
  const total = sumPrices(chosen);
  const ms = chosen.length > 1 ? chosen.map((s, i) => (i === 0 ? 90 : pairMatch(s, chosen[0]))) : [];
  const score = ms.length ? Math.max(58, Math.min(99, Math.round(ms.reduce((a, b) => a + b, 0) / ms.length))) : 0;
  const pairScore = knife && gloves ? pairMatch(knife, gloves) : 0;

  function pick(s: ResolvedSkinView) {
    if (step === 1) {
      setComboKnife(s.id);
      setStep(2);
    } else if (step === 2) {
      setComboGloves(s.id);
      setStep(3);
    } else {
      router.push(`/skins/${s.id}`);
    }
  }

  return (
    <main className="mx-auto max-w-[1480px] px-12">
      <div className="border-b border-border py-14 pb-[30px]">
        <div className="mb-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--acc)" }}>
          Complete the Set
        </div>
        <h1 className="font-display text-[48px] font-medium tracking-[-0.025em]">
          You own the knife. We&rsquo;ll do the rest.
        </h1>
        <p className="mt-3 text-[15px] text-ink-muted">
          Three steps. Each one is scored against what you&rsquo;ve already locked in, so the set can&rsquo;t
          drift.
        </p>
      </div>

      <div className="grid grid-cols-3 border-t border-border">
        {STEPS.map(([n, label]) => {
          const done = step > n;
          const on = step === n;
          const clickable = n <= step || (n === 2 && knife) || (n === 3 && knife && gloves);
          return (
            <button
              key={n}
              type="button"
              disabled={!clickable}
              onClick={() => clickable && setStep(n)}
              className="-mt-px border-t-2 py-4 pb-4 text-left disabled:cursor-default"
              style={{ borderColor: on ? "var(--acc)" : done ? "#4A4A54" : "#22222A" }}
            >
              <span
                className="mr-2 font-display text-[13px]"
                style={{ color: on ? "var(--acc)" : done ? "#F5F5F5" : "#3A3A42" }}
              >
                0{n}
              </span>
              <span className="text-[13px]" style={{ color: on || done ? "#F5F5F5" : "#5E5E68" }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-11 pb-[90px] pt-9" style={{ gridTemplateColumns: "308px minmax(0,1fr)" }}>
        {/* Left rail */}
        <div className="flex flex-col gap-2.5" style={{ position: "sticky", top: 100, alignSelf: "start" }}>
          <ComboCard
            stepLabel="Step 01 · Knife"
            skin={knife}
            metaEmpty="Step 1"
          />
          <ComboCard
            stepLabel="Step 02 · Gloves"
            skin={gloves}
            metaEmpty="Step 2"
          />
          {step === 3 && (
            <div className="border border-border bg-surface p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-[46px]" style={{ color: "var(--acc)" }}>
                  {score}
                </div>
                <div className="text-right">
                  <div className="font-display text-[16px]">{total.amount ? formatPrice(total) : "—"}</div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                    {chosen.length} items
                  </div>
                </div>
              </div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-muted">Set match</div>
              <div className="mt-3 grid grid-cols-3 gap-1.5">
                {chosen.map((s) => (
                  <ArtWell key={s.id} className="h-12 p-1.5">
                    <SkinArt weapon={s.w} src={s.img} alt={`${s.wl} | ${s.n}`} c1={s.c1} c2={s.c2} c3={s.c3} />
                  </ArtWell>
                ))}
              </div>
              <button
                type="button"
                onClick={() => router.push("/build")}
                className="mt-4 w-full bg-ink py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white"
              >
                Open in builder
              </button>
            </div>
          )}
          {knife && gloves && step < 3 && (
            <p className="px-1 text-[11px] text-ink-dim">Knife + gloves pair match: {pairScore}%</p>
          )}
        </div>

        {/* Candidates */}
        <div>
          <h2 className="font-display text-[24px] font-medium tracking-[-0.02em]">{candTitle}</h2>
          <p className="mt-1 text-[13px] text-ink-muted">{candNote}</p>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {cands.map((s) => {
              const selected = (step === 1 && comboKnife === s.id) || (step === 2 && comboGloves === s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s)}
                  className="border p-0 text-left"
                  style={{ borderColor: selected ? "var(--acc)" : "#29292F" }}
                >
                  <ArtWell className="h-[104px] p-4">
                    <SkinArt weapon={s.w} src={s.img} alt={`${s.wl} | ${s.n}`} c1={s.c1} c2={s.c2} c3={s.c3} />
                  </ArtWell>
                  <div className="px-3 pt-2.5 text-[13px] font-medium truncate">{s.n}</div>
                  <div className="px-3 text-[11px] text-ink-muted">
                    {s.wl} · {s.ex}
                  </div>
                  <div className="flex items-center justify-between border-t border-border-soft px-3 py-2.5 mt-2">
                    <span className="font-display text-[12.5px]">{s.priceStr}</span>
                    <span className="text-[12.5px]" style={{ color: scoreColor(s.m) }}>
                      {s.m}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

function ComboCard({
  stepLabel,
  skin,
  metaEmpty,
}: {
  stepLabel: string;
  skin: ResolvedSkinView | null;
  metaEmpty: string;
}) {
  return (
    <div className="border border-border bg-surface">
      <ArtWell className="h-[112px]">
        {skin ? (
          <SkinArt weapon={skin.w} src={skin.img} alt={`${skin.wl} | ${skin.n}`} c1={skin.c1} c2={skin.c2} c3={skin.c3} />
        ) : (
          <SkinArt weapon="knife" c1="#26262C" c2="#1C1C21" c3="#33333B" />
        )}
      </ArtWell>
      <div className="px-4 py-3.5">
        <div className="text-[10px] uppercase tracking-[0.2em] text-ink-dim">{stepLabel}</div>
        <div className="mt-1 text-[13.5px]">{skin ? `${skin.wl} | ${skin.n}` : "Not picked yet"}</div>
        <div className="text-[11.5px] text-ink-muted">{skin ? `${skin.ex} · ${skin.priceStr}` : metaEmpty}</div>
      </div>
    </div>
  );
}
