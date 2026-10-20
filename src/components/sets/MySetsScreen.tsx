"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SkinArt, ArtWell } from "@/components/SkinArt";
import { scoreColor } from "@/lib/scoring";

export interface SavedSetRow {
  id: string;
  name: string;
  theme: string;
  matchScore: number | null;
  totalStr: string;
  savedAt: string;
  slotCount: number;
  art: { skinRef: string; weapon: string; img?: string; label: string; c1: string; c2: string; c3: string }[];
}

export function MySetsScreen({ sets }: { sets: SavedSetRow[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function remove(id: string) {
    setDeleting(id);
    setError(null);
    try {
      const response = await fetch(`/api/loadouts/${id}`, { method: "DELETE" });
      if (!response.ok && response.status !== 204) {
        setError("Could not delete that set. Try again.");
        setDeleting(null);
        return;
      }
      setConfirming(null);
      // The list is server-rendered, so re-fetch it rather than mutating local
      // state — keeps this screen honest about what's actually stored.
      router.refresh();
    } catch {
      setError("Network error — nothing was deleted.");
    } finally {
      setDeleting(null);
    }
  }

  if (sets.length === 0) {
    return (
      <main className="mx-auto max-w-[1480px] px-12 py-14">
        <h1 className="font-display text-[34px]">Your sets</h1>
        <div className="mt-8 border border-border bg-surface p-11 text-center">
          <p className="text-[13px] text-ink-muted">
            You haven&rsquo;t saved a set yet.
          </p>
          <Link
            href="/build"
            className="mt-6 inline-block bg-ink px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white"
          >
            Build your first set
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1480px] px-12 py-14">
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-[34px]">Your sets</h1>
        <span className="text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          {sets.length} saved
        </span>
      </div>

      {error && (
        <p className="mt-5 text-[11.5px]" style={{ color: "var(--acc)" }} role="alert">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
        {sets.map((set) => (
          <div key={set.id} className="border border-border bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-display text-[18px]">{set.name}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-ink-muted">
                  {set.theme} · {set.slotCount} {set.slotCount === 1 ? "slot" : "slots"}
                </div>
              </div>
              {set.matchScore !== null && (
                <div
                  className="flex-none font-display text-[26px] leading-none"
                  style={{ color: scoreColor(set.matchScore) }}
                >
                  {set.matchScore}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-6 gap-1.5">
              {set.art.map((item) => (
                <ArtWell key={item.skinRef} className="h-[46px] p-1">
                  <SkinArt
                    weapon={item.weapon}
                    src={item.img}
                    alt={item.label}
                    c1={item.c1}
                    c2={item.c2}
                    c3={item.c3}
                  />
                </ArtWell>
              ))}
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-display text-[15px]">{set.totalStr}</span>
              <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-dim">
                {set.savedAt}
              </span>
            </div>

            <div className="mt-4 flex gap-2">
              {confirming === set.id ? (
                <>
                  <button
                    type="button"
                    onClick={() => remove(set.id)}
                    disabled={deleting === set.id}
                    className="flex-1 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-bg disabled:opacity-40"
                    style={{ background: "var(--acc)" }}
                  >
                    {deleting === set.id ? "Deleting…" : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(null)}
                    className="border border-border px-4 py-2.5 text-[10.5px] uppercase tracking-[0.16em] text-ink-muted hover:border-border-hover hover:text-ink"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/build"
                    className="flex-1 border border-border-strong px-4 py-2.5 text-center text-[10.5px] font-semibold uppercase tracking-[0.16em] hover:border-ink"
                  >
                    Open builder
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirming(set.id)}
                    className="border border-border px-4 py-2.5 text-[10.5px] uppercase tracking-[0.16em] text-ink-muted hover:border-border-hover hover:text-ink"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
