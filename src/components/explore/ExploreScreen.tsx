"use client";

import { useMemo, useState } from "react";
import { SetCard, type SetCardArt } from "@/components/SetCard";

export interface ExploreSetView {
  slug: string;
  name: string;
  creator: string;
  score: number;
  scoreColor: string;
  totalStr: string;
  totalAmount: number;
  likes: number;
  art: SetCardArt[];
  tags: string[];
}

const PALETTE = ["Red", "Black", "White", "Purple", "Green", "Blue", "Pink", "Gold", "Orange"];
const STYLE = ["Minimal", "Clean", "Luxury", "Tactical", "Futuristic", "Dark", "Colorful", "Aggressive"];
const BUDGET = ["Under $250", "Under $500", "Under $1,000", "$1,000+"];
const SORTS = ["Trending", "Most liked", "Highest match", "Lowest price"] as const;

const BUDGET_CAP: Record<string, number> = { "Under $250": 250, "Under $500": 500, "Under $1,000": 1000 };

export function ExploreScreen({ sets }: { sets: ExploreSetView[] }) {
  const [fTheme, setFTheme] = useState("");
  const [fStyle, setFStyle] = useState("");
  const [fBudget, setFBudget] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Trending");

  const filtered = useMemo(() => {
    let list = sets.slice();
    if (fTheme) {
      const tag = fTheme.toLowerCase();
      list = list.filter((s) => s.tags.includes(tag));
    }
    if (fStyle) {
      const tag = fStyle.toLowerCase();
      list = list.filter((s) => s.tags.includes(tag));
    }
    if (fBudget) {
      const cap = BUDGET_CAP[fBudget];
      list = list.filter((s) => (cap ? s.totalAmount <= cap : s.totalAmount > 1000));
    }
    list.sort((a, b) => {
      if (sort === "Most liked") return b.likes - a.likes;
      if (sort === "Highest match") return b.score - a.score;
      if (sort === "Lowest price") return a.totalAmount - b.totalAmount;
      return 0;
    });
    return list;
  }, [sets, fTheme, fStyle, fBudget, sort]);

  return (
    <main className="mx-auto max-w-[1480px] px-12">
      <div className="flex items-end justify-between border-b border-border py-14 pb-[34px]">
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-ink-muted">Explore</div>
          <h1 className="font-display text-[48px] font-medium tracking-[-0.025em]">
            Sets people are actually running
          </h1>
          <p className="mt-3 max-w-[560px] text-[15px] text-ink-muted">
            Filter by palette, style or wallet. Open anything, hit Customize, make it yours.
          </p>
        </div>
        <div className="flex flex-none gap-2">
          {SORTS.map((s) => {
            const on = sort === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className="border px-3.5 py-2.5 text-[10.5px] uppercase tracking-[0.16em]"
                style={{ borderColor: on ? "#F5F5F5" : "#29292F", color: on ? "#F5F5F5" : "#96969F" }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-11 py-9 pb-[90px]" style={{ gridTemplateColumns: "236px minmax(0,1fr)" }}>
        <div style={{ position: "sticky", top: 100, alignSelf: "start" }}>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13px] font-medium">Filters</span>
            <button
              type="button"
              onClick={() => {
                setFTheme("");
                setFStyle("");
                setFBudget("");
              }}
              className="text-[11px] text-ink-muted hover:text-ink"
            >
              Clear
            </button>
          </div>

          <FilterGroup label="Palette" opts={PALETTE} value={fTheme} onChange={setFTheme} />
          <FilterGroup label="Style" opts={STYLE} value={fStyle} onChange={setFStyle} />
          <FilterGroup label="Budget" opts={BUDGET} value={fBudget} onChange={setFBudget} last />

          <p className="text-[11px] text-ink-muted">
            {filtered.length} sets match. Prices refresh every 15 min from three marketplaces.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3.5">
          {filtered.map((s) => (
            <SetCard key={s.slug} {...s} />
          ))}
        </div>
      </div>
    </main>
  );
}

function FilterGroup({
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
    <div className={last ? "mb-6" : "mb-6.5 border-b border-border-soft pb-6"}>
      <div className="mb-2.5 text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const on = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(on ? "" : o)}
              className="border px-2.5 py-1.5 text-[11.5px]"
              style={{
                borderColor: on ? "var(--acc)" : "#29292F",
                background: on ? "#1A1A1F" : "transparent",
                color: on ? "#F5F5F5" : "#96969F",
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
