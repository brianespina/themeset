"use client";

import Link from "next/link";
import { useState } from "react";
import { SkinArt, ArtWell } from "@/components/SkinArt";
import { scoreColor, setDetailSubScores } from "@/lib/scoring";
import type { SetDef } from "@/lib/seed-data";
import type { ResolvedSkinView } from "@/lib/view";

export interface DetailRow extends ResolvedSkinView {
  slot: string;
  m: number;
}

export function SetDetailScreen({
  set,
  rows,
  alts,
  totalStr,
}: {
  set: SetDef;
  rows: DetailRow[];
  alts: DetailRow[];
  totalStr: string;
}) {
  const [liked, setLiked] = useState(false);
  const sub = setDetailSubScores(set.score);

  return (
    <main>
      <div className="mx-auto max-w-[1480px] px-12 pt-6.5 text-[11px] uppercase tracking-[0.16em]">
        <Link href="/explore" className="text-ink-muted hover:text-ink">
          Explore
        </Link>{" "}
        <span className="text-ink-dim">/ themeset.online/themeset/{set.slug}</span>
      </div>

      <div className="mx-auto flex max-w-[1480px] items-start justify-between gap-8 border-b border-border px-12 py-[30px] pb-[34px]">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-[11px] w-[11px]" style={{ background: "var(--acc)" }} />
            <span className="text-[11px] uppercase tracking-[0.16em] text-ink-muted">
              {set.theme} theme
            </span>
          </div>
          <h1 className="font-display text-[60px] font-medium leading-none tracking-[-0.03em]">
            {set.name}
          </h1>
          <p className="mt-3 text-[13px] text-ink-muted">
            {set.creator} · {rows.length} items · {totalStr} estimated · prices updated 6 min ago
          </p>
        </div>
        <div className="flex flex-none items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLiked((v) => !v)}
            className="border border-border px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted hover:border-border-hover hover:text-ink"
            style={{ color: liked ? "var(--acc)" : undefined }}
          >
            ♥ {(liked ? set.likes + 1 : set.likes).toLocaleString("en-US")}
          </button>
          <button className="border border-border px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted hover:border-border-hover hover:text-ink">
            Save
          </button>
          <button className="border border-border px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted hover:border-border-hover hover:text-ink">
            Share
          </button>
          <Link
            href="/build"
            className="bg-ink px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white"
          >
            Customize this set
          </Link>
        </div>
      </div>

      <div className="border-b border-border bg-surface-sunken">
        <div
          className="mx-auto grid max-w-[1480px] px-12"
          style={{ gridTemplateColumns: "minmax(0,300px) minmax(0,1fr)" }}
        >
          <div className="border-r border-border py-11 pr-10">
            <div className="font-display text-[132px] leading-[0.86] tracking-[-0.05em]" style={{ color: "var(--acc)" }}>
              {set.score}
            </div>
            <div className="text-[13px] text-ink-muted">Theme match / 100</div>
            <p className="mt-4 text-[13px] leading-[1.5] text-ink-muted">{set.blurb}</p>
          </div>
          <div className="grid grid-cols-5 gap-6.5 py-11 pl-10">
            {sub.map((s) => (
              <div key={s.key}>
                <div className="font-display text-[34px]">{s.value}</div>
                <div className="mt-2 h-0.5 bg-track">
                  <div className="h-full" style={{ width: `${s.value}%`, background: "var(--acc)" }} />
                </div>
                <div className="mt-2 text-[11.5px]">{s.label}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-ink-dim">Weight {s.weight}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1480px] grid-cols-4 gap-2.5 px-12 py-11">
        {rows.slice(0, 4).map((r, i) => (
          <ArtWell
            key={r.id}
            className={
              i === 0
                ? "col-span-2 row-span-2 min-h-[300px] p-10"
                : i === 1
                  ? "col-span-2 min-h-[145px] p-8"
                  : "min-h-[145px] p-6"
            }
          >
            <SkinArt weapon={r.w} src={r.img} alt={`${r.wl} | ${r.n}`} c1={r.c1} c2={r.c2} c3={r.c3} />
          </ArtWell>
        ))}
      </div>

      <div className="mx-auto max-w-[1480px] px-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-[31px] font-medium tracking-[-0.02em]">The loadout</h2>
          <span className="text-[11px] text-ink-muted">{rows.length} slots filled</span>
        </div>
        <div className="border-t border-border">
          {rows.map((r) => (
            <div
              key={r.id}
              className="grid items-center gap-5 border-b border-border-soft px-3 py-3.5 hover:bg-surface"
              style={{ gridTemplateColumns: "120px minmax(0,1fr) 110px 110px 120px 92px" }}
            >
              <ArtWell className="h-[54px] p-2">
                <SkinArt weapon={r.w} src={r.img} alt={`${r.wl} | ${r.n}`} c1={r.c1} c2={r.c2} c3={r.c3} />
              </ArtWell>
              <div className="min-w-0">
                <div className="truncate text-[14.5px] font-medium">
                  {r.wl} <span className="text-ink-dim">|</span> {r.n}
                </div>
                <div className="truncate text-[11.5px] text-ink-muted">
                  {r.collection} Collection · {r.rarity}
                </div>
              </div>
              <div className="text-[12px] text-ink-muted">{r.ex}</div>
              <div className="text-[11px] uppercase tracking-[0.14em] text-ink-dim">{r.slot}</div>
              <div className="font-display text-[14.5px]">{r.priceStr}</div>
              <div className="text-right text-[13px]" style={{ color: scoreColor(r.m) }}>
                {r.m}%
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border py-4">
          <span className="text-[13px] text-ink-muted">Estimated total</span>
          <span className="font-display text-[28px]">{totalStr}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1480px] px-12 py-14 pb-[90px]">
        <h2 className="mb-6 font-display text-[31px] font-medium tracking-[-0.02em]">
          Swap ideas that keep the score
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {alts.map((a) => (
            <Link
              key={a.id}
              href={`/skins/${a.id}`}
              className="block border border-border bg-surface hover:border-acc"
            >
              <ArtWell className="h-24 p-4">
                <SkinArt weapon={a.w} src={a.img} alt={`${a.wl} | ${a.n}`} c1={a.c1} c2={a.c2} c3={a.c3} />
              </ArtWell>
              <div className="truncate px-3 pt-2.5 text-[13px]">
                {a.wl} | {a.n}
              </div>
              <div className="flex items-center justify-between px-3 pb-3 pt-1.5">
                <span className="font-display text-[12.5px]">{a.priceStr}</span>
                <span className="text-[12.5px]" style={{ color: scoreColor(a.m) }}>
                  {a.m}% match
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
