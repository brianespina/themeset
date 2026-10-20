"use client";

import Link from "next/link";
import { useState } from "react";
import { SkinArt, ArtWell } from "./SkinArt";

export interface SetCardArt {
  weapon: string;
  img?: string;
  alt: string;
  c1: string;
  c2: string;
  c3: string;
}

export interface SetCardProps {
  slug: string;
  name: string;
  creator: string;
  score: number;
  scoreColor: string;
  totalStr: string;
  likes: number;
  art: SetCardArt[]; // first 4 items
}

export function SetCard({ slug, name, creator, score, scoreColor, totalStr, likes, art }: SetCardProps) {
  const [liked, setLiked] = useState(false);

  return (
    <Link
      href={`/themeset/${slug}`}
      className="group block border border-border bg-surface hover:border-border-hover"
    >
      <div className="grid grid-cols-2 gap-1.5 border-b border-border-soft bg-surface-sunken p-3.5">
        {art.map((a, i) => (
          <ArtWell key={i} className={i < 2 ? "h-[86px] p-3" : "h-[70px] p-2.5"}>
            <SkinArt weapon={a.weapon} src={a.img} alt={a.alt} c1={a.c1} c2={a.c2} c3={a.c3} />
          </ArtWell>
        ))}
      </div>
      <div className="flex items-start justify-between px-4 pb-3.5 pt-4">
        <div>
          <div className="font-display text-lg">{name}</div>
          <div className="text-xs text-ink-muted">by {creator}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-xl" style={{ color: scoreColor }}>
            {score}
          </div>
          <div className="text-[9.5px] uppercase tracking-[0.18em] text-ink-muted">Match</div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border-soft px-4 py-3">
        <span className="font-display text-xs">{totalStr}</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setLiked((v) => !v);
          }}
          className="text-[11.5px]"
          style={{ color: liked ? "var(--acc)" : "#96969F" }}
        >
          ♥ {(liked ? likes + 1 : likes).toLocaleString("en-US")}
        </button>
      </div>
    </Link>
  );
}
