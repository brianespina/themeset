"use client";

import { useState } from "react";
import { SetCard, type SetCardArt } from "@/components/SetCard";
import type { CreatorDef, SetDef } from "@/lib/seed-data";

export interface CommunitySetCard {
  slug: string;
  name: string;
  creator: string;
  score: number;
  scoreColor: string;
  totalStr: string;
  likes: number;
  art: SetCardArt[];
}

export function CommunityScreen({
  sets,
  setDefs,
  creators,
}: {
  sets: CommunitySetCard[];
  setDefs: SetDef[];
  creators: CreatorDef[];
}) {
  const [handle, setHandle] = useState(creators[0].handle);

  const own = setDefs.filter((s) => s.creator === handle);
  const list = own.length ? own : setDefs.slice(0, 3);
  const avg = Math.round(list.reduce((a, r) => a + r.score, 0) / list.length);
  const totalLikes = list.reduce((a, r) => a + r.likes, 0);
  const meta = creators.find((c) => c.handle === handle) ?? { handle, setCount: list.length, avgScore: String(avg) };

  const shownSlugs = [...new Set(list.map((s) => s.slug).concat(setDefs.slice(0, 3).map((s) => s.slug)))].slice(
    0,
    3
  );

  const setsBySlug = new Map(sets.map((s) => [s.slug, s]));

  return (
    <main className="mx-auto max-w-[1480px] px-12">
      <div className="flex items-start justify-between border-b border-border py-14 pb-10">
        <div className="flex items-start gap-6">
          <div className="flex h-[84px] w-[84px] flex-none items-center justify-center border border-border bg-surface font-display text-[30px]">
            {handle.charAt(1).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-[42px] font-medium">{handle}</h1>
            <p className="mt-2 max-w-[460px] text-[14px] text-ink-muted">
              Builds red. Mostly. Occasionally black. {meta.setCount} published sets since 2023.
            </p>
          </div>
        </div>
        <div className="flex flex-none gap-2.5">
          <button className="border border-border-strong px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] hover:border-ink">
            Follow
          </button>
          <button className="bg-ink px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white">
            See all sets
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 border-b border-border">
        {[
          ["Published sets", meta.setCount],
          ["Avg. match", avg],
          ["Total likes", totalLikes.toLocaleString("en-US")],
          ["Followers", "4,182"],
        ].map(([label, value]) => (
          <div key={label as string} className="py-7.5">
            <div className="font-display text-[32px]">{value}</div>
            <div className="text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-11 py-11 pb-[90px]" style={{ gridTemplateColumns: "minmax(0,1fr) 300px" }}>
        <div>
          <h2 className="mb-5 font-display text-[31px] font-medium tracking-[-0.02em]">Published sets</h2>
          <div className="grid grid-cols-3 gap-3.5">
            {shownSlugs.map((slug) => {
              const card = setsBySlug.get(slug);
              return card ? <SetCard key={slug} {...card} /> : null;
            })}
          </div>
        </div>

        <div style={{ position: "sticky", top: 100, alignSelf: "start" }}>
          <div className="border-t border-border">
            <div className="pt-4 text-[13px] font-medium">Top creators</div>
            {creators.map((c, i) => {
              const on = c.handle === handle;
              return (
                <button
                  key={c.handle}
                  type="button"
                  onClick={() => setHandle(c.handle)}
                  className="flex w-full items-center gap-3 border-b py-3.5 text-left hover:bg-surface"
                  style={{ borderColor: on ? "var(--acc)" : "#22222A" }}
                >
                  <span className="text-[12px] text-ink-dim">0{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px]" style={{ color: on ? "#F5F5F5" : "#96969F" }}>
                      {c.handle}
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      {c.setCount} sets · avg {c.avgScore}
                    </div>
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
