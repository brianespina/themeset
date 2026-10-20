"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { SkinArt, ArtWell } from "./SkinArt";
import { match, scoreColor } from "@/lib/scoring";
import type { Skin } from "@/lib/seed-data";

export interface DbItem {
  skin: Skin;
  img?: string;
  priceStr: string;
  rarity: string;
}

const TABS = [
  { label: "All", groups: null as string[] | null },
  { label: "Knives", groups: ["knife"] },
  { label: "Gloves", groups: ["gloves"] },
  { label: "Rifles", groups: ["ak", "m4"] },
  { label: "Snipers", groups: ["awp"] },
  { label: "Pistols", groups: ["pistol"] },
];

export function SkinDatabaseGrid({ items }: { items: DbItem[] }) {
  const { themeName } = useTheme();
  const [tab, setTab] = useState("Knives");

  const active = TABS.find((t) => t.label === tab)!;

  const ranked = useMemo(() => {
    const filtered = active.groups ? items.filter((it) => active.groups!.includes(it.skin.w)) : items;
    return filtered
      .map((it) => ({ ...it, m: match(it.skin, themeName) }))
      .sort((a, b) => b.m - a.m);
  }, [items, active, themeName]);

  return (
    <div>
      <div className="mb-8 flex gap-7 border-b border-border">
        {TABS.map((t) => {
          const isActive = t.label === tab;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => setTab(t.label)}
              className={`-mb-px border-b-2 pb-3 text-[11.5px] uppercase tracking-[0.2em] ${
                isActive ? "text-ink" : "border-transparent text-ink-muted hover:text-ink"
              }`}
              style={{ borderColor: isActive ? "var(--acc)" : "transparent" }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-5 gap-3 pb-[90px]">
        {ranked.map(({ skin, img, priceStr, rarity, m }) => (
          <Link
            key={skin.id}
            href={`/skins/${skin.id}`}
            className="block border border-border bg-surface hover:border-border-hover"
          >
            <ArtWell className="h-[112px] p-5">
              <SkinArt weapon={skin.w} src={img} alt={`${skin.wl} | ${skin.n}`} c1={skin.c1} c2={skin.c2} c3={skin.c3} />
            </ArtWell>
            <div className="px-3.5 pt-3 pb-1">
              <div className="truncate text-[13px] font-medium">
                {skin.wl} | {skin.n}
              </div>
              <div className="text-[11px] text-ink-muted">
                {skin.wl} · {rarity}
              </div>
            </div>
            <div className="flex items-center justify-between px-3.5 pb-3.5 pt-2">
              <span className="font-display text-[13px]">{priceStr}</span>
              <span className="text-[12px] font-medium" style={{ color: scoreColor(m) }}>
                {m}%
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
