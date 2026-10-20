"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { SkinArt, ArtWell } from "@/components/SkinArt";
import { SLOTS, THEMES } from "@/lib/seed-data";
import { buildScore, hash, match, scoreColor } from "@/lib/scoring";
import { sumPrices, type ResolvedSkinView } from "@/lib/view";

const GROUPS: [string, string[]][] = [
  ["Equipment", ["knife", "gloves"]],
  ["Rifles", ["ak", "m4a4", "m4a1"]],
  ["Snipers", ["awp", "ssg"]],
  ["Pistols", ["usp", "glock", "deagle", "p2000", "tec9"]],
];

const DEFAULT_BUILD: Record<string, string> = {
  knife: "m9-crimson",
  gloves: "sport-scarlet",
  ak: "ak-empress",
  m4a1: "m4a1-lotus",
  awp: "awp-hyperbeast",
  usp: "usp-kill",
};

const SORTS = ["Match", "Price ↑", "Price ↓", "Popular"] as const;
type Sort = (typeof SORTS)[number];

const slotDef = new Map(SLOTS.map((s) => [s.id, s]));

type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; name: string }
  | { status: "error"; message: string };

export function BuildScreen({
  skins,
  signedIn,
}: {
  skins: ResolvedSkinView[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const { themeName, setThemeName } = useTheme();
  const byId = useMemo(() => new Map(skins.map((s) => [s.id, s])), [skins]);

  const [slot, setSlot] = useState("knife");
  const [build, setBuild] = useState<Record<string, string>>(DEFAULT_BUILD);
  const [bq, setBq] = useState("");
  const [pSort, setPSort] = useState<Sort>("Match");
  const [name, setName] = useState("");
  const [save, setSave] = useState<SaveState>({ status: "idle" });

  const cur = slotDef.has(slot) ? slot : "knife";
  const curDef = slotDef.get(cur)!;
  const curSkin = build[cur] ? byId.get(build[cur]) : undefined;

  const filledIds = SLOTS.map((s) => build[s.id]).filter(Boolean) as string[];
  const items = filledIds.map((id) => byId.get(id)).filter((s): s is ResolvedSkinView => !!s);
  const total = sumPrices(items);

  const knife = build.knife ? byId.get(build.knife) ?? null : null;
  const gloves = build.gloves ? byId.get(build.gloves) ?? null : null;
  const result = buildScore({ items, themeName, knife, gloves, total });

  const pool = useMemo(() => {
    const q = bq.toLowerCase();
    const filtered = skins
      .filter((s) => s.w === curDef.group)
      .filter((s) => !q || (s.n + " " + s.wl).toLowerCase().includes(q))
      .map((s) => ({ ...s, m: match(s, themeName) }));
    return filtered.sort((a, b) => {
      if (pSort === "Price ↑") return a.price.amount - b.price.amount;
      if (pSort === "Price ↓") return b.price.amount - a.price.amount;
      if (pSort === "Popular") return hash(b.id) - hash(a.id);
      return b.m - a.m;
    });
  }, [skins, curDef.group, bq, pSort, themeName]);

  const strip = SLOTS.filter((s) => build[s.id]).slice(0, 6);

  // Persist the current build. The server re-validates everything here —
  // slot ids, skin ids, and that each skin actually fits its slot — so this
  // only has to send the build, not police it.
  async function saveThemeSet() {
    const trimmed = name.trim();
    const items = SLOTS.filter((s) => build[s.id]).map((s) => ({
      weaponSlot: s.id,
      skinRef: build[s.id],
    }));

    if (items.length === 0) {
      setSave({ status: "error", message: "Add at least one skin before saving." });
      return;
    }

    setSave({ status: "saving" });

    try {
      const response = await fetch("/api/loadouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed || `Untitled ${themeName} set`,
          theme: themeName,
          items,
          matchScore: result.score,
          budget: total.amount,
        }),
      });

      if (response.status === 401) {
        // Session expired, or the user opened the builder before signing in.
        router.push(`/signin?next=${encodeURIComponent("/build")}`);
        return;
      }

      const payload = (await response.json().catch(() => null)) as
        | { loadout?: { name: string }; error?: string }
        | null;

      if (!response.ok) {
        setSave({
          status: "error",
          message: payload?.error ?? "Could not save your set. Try again.",
        });
        return;
      }

      setSave({ status: "saved", name: payload?.loadout?.name ?? trimmed });
      // Make the new set visible on /my-sets without a hard reload.
      router.refresh();
    } catch {
      setSave({ status: "error", message: "Network error — your set wasn't saved." });
    }
  }

  return (
    <main
      className="grid"
      style={{ gridTemplateColumns: "274px minmax(0,1fr) 384px", minHeight: "calc(100vh - 68px)" }}
    >
      {/* Left rail — loadout tree */}
      <div className="border-r border-border bg-surface-sunken px-5 pb-10 pt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-[13px] font-medium">Loadout</span>
          <span className="text-[11px] text-ink-muted">{filledIds.length}/12</span>
        </div>
        <div className="mb-6 truncate text-[11.5px] text-ink-dim">
          {name.trim() || "Untitled ThemeSet"} · {themeName}
        </div>

        {GROUPS.map(([label, ids]) => (
          <div key={label} className="mb-5">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-ink-dim">{label}</div>
            {ids.map((id) => {
              const d = slotDef.get(id)!;
              const skinId = build[id];
              const sk = skinId ? byId.get(skinId) : undefined;
              const on = cur === id;
              const m = sk ? match(sk, themeName) : 0;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSlot(id)}
                  className="mb-1.5 flex w-full items-center gap-2.5 border px-2.5 py-2.5"
                  style={{
                    borderColor: on ? "var(--acc)" : "#22222A",
                    background: on ? "#17171C" : "transparent",
                  }}
                >
                  <ArtWell className="h-[30px] w-[46px] flex-none p-1">
                    {sk ? (
                      <SkinArt weapon={sk.w} src={sk.img} alt={`${sk.wl} | ${sk.n}`} c1={sk.c1} c2={sk.c2} c3={sk.c3} />
                    ) : null}
                  </ArtWell>
                  <div className="min-w-0 flex-1 text-left">
                    <div
                      className="text-[11.5px] uppercase tracking-[0.06em]"
                      style={{ color: on ? "#F5F5F5" : "#96969F" }}
                    >
                      {d.label}
                    </div>
                    <div
                      className="truncate text-[11.5px]"
                      style={{ color: sk ? "#96969F" : "#4A4A54" }}
                    >
                      {sk ? `${sk.wl} | ${sk.n}` : "Empty"}
                    </div>
                  </div>
                  <span
                    className="flex-none text-[11px]"
                    style={{ color: sk ? scoreColor(m) : "#3A3A42" }}
                  >
                    {sk ? `${m}%` : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Centre column */}
      <div className="flex flex-col gap-6 px-9 py-7.5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">
              Now editing · {curDef.label}
            </div>
            <div className="mt-1 font-display text-[34px]">
              {curSkin ? `${curSkin.wl} | ${curSkin.n}` : curDef.label}
            </div>
            <div className="mt-1 text-[13px] text-ink-muted">
              {curSkin
                ? `${curSkin.ex} · ${curSkin.collection} Collection · ${curSkin.priceStr} · ${match(curSkin, themeName)}% match to ${themeName}`
                : "Pick a skin from the panel on the right"}
            </div>
          </div>
          <div className="flex flex-none gap-1.5">
            {THEMES.slice(0, 7).map((t) => (
              <button
                key={t.name}
                type="button"
                title={t.name}
                onClick={() => setThemeName(t.name)}
                className="h-[22px] w-[22px]"
                style={{
                  background: t.accent,
                  outline: `1px solid ${themeName === t.name ? "#F5F5F5" : "transparent"}`,
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[290px] flex-1 items-center justify-center border border-border bg-surface-sunken p-11">
          <div className="absolute inset-x-0 top-0 h-px opacity-50" style={{ background: "var(--acc)" }} />
          {curSkin ? (
            <SkinArt weapon={curSkin.w} src={curSkin.img} alt={`${curSkin.wl} | ${curSkin.n}`} c1={curSkin.c1} c2={curSkin.c2} c3={curSkin.c3} />
          ) : (
            <SkinArt weapon={curDef.group} c1="#1F1F25" c2="#191920" c3="#26262C" />
          )}
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: "minmax(0,1fr) 268px" }}>
          <div>
            <div className="mb-2 text-[10.5px] uppercase tracking-[0.2em] text-ink-muted">Set so far</div>
            <div className="mb-4 grid grid-cols-6 gap-1.5">
              {strip.map((s) => {
                const sk = byId.get(build[s.id])!;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlot(s.id)}
                    className="h-[62px] border p-1.5"
                    style={{ borderColor: cur === s.id ? "var(--acc)" : "#22222A" }}
                  >
                    <SkinArt weapon={sk.w} src={sk.img} alt={`${sk.wl} | ${sk.n}`} c1={sk.c1} c2={sk.c2} c3={sk.c3} />
                  </button>
                );
              })}
            </div>
            {signedIn && (
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (save.status !== "idle") setSave({ status: "idle" });
                }}
                maxLength={80}
                placeholder={`Name this set — e.g. "${themeName} carry"`}
                aria-label="Set name"
                className="mb-2.5 w-full border border-border bg-surface px-3 py-2.5 text-[12.5px] outline-none placeholder:text-ink-dim focus:border-border-strong"
              />
            )}
            <div className="flex flex-wrap gap-2.5">
              {signedIn ? (
                <button
                  type="button"
                  onClick={saveThemeSet}
                  disabled={save.status === "saving"}
                  className="bg-ink px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white disabled:opacity-40"
                >
                  {save.status === "saving" ? "Saving…" : "Save ThemeSet"}
                </button>
              ) : (
                <Link
                  href={`/signin?next=${encodeURIComponent("/build")}`}
                  className="bg-ink px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-bg hover:bg-white"
                >
                  Sign in to save
                </Link>
              )}
              <Link
                href="/generate"
                className="border border-border-strong px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em] hover:border-ink"
              >
                Roll a set
              </Link>
              <Link
                href="/combos"
                className="border border-border px-5 py-3.5 text-[11px] uppercase tracking-[0.14em] text-ink-muted hover:border-border-hover hover:text-ink"
              >
                Complete the Set
              </Link>
            </div>
            {save.status === "saved" && (
              <p className="mt-2 text-[11px] text-ink-muted">
                Saved{save.name ? ` “${save.name}”` : ""} ·{" "}
                <Link href="/my-sets" className="underline hover:text-ink">
                  View your sets
                </Link>
              </p>
            )}
            {save.status === "error" && (
              <p className="mt-2 text-[11px]" style={{ color: "var(--acc)" }} role="alert">
                {save.message}
              </p>
            )}
          </div>

          <div className="border border-border bg-surface p-5">
            <div className="flex items-baseline justify-between">
              <div className="font-display text-[56px] leading-[0.9]" style={{ color: "var(--acc)" }}>
                {result.score}
              </div>
              <div className="text-right">
                <div className="font-display text-[19px]">{result.totalStr}</div>
                <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-muted">Est. total</div>
              </div>
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.18em] text-ink-muted">Theme match</div>
            <div className="mt-4 flex flex-col gap-2.5">
              {result.sub.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between text-[11.5px]">
                    <span className="text-ink-muted">{s.label}</span>
                    <span className="font-display">{s.value}</span>
                  </div>
                  <div className="mt-1 h-0.5 bg-track">
                    <div className="h-full" style={{ width: `${s.value}%`, background: "var(--acc)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — pick list */}
      <div className="border-l border-border bg-surface-sunken px-5 pb-10 pt-6">
        <div className="mb-4 text-[15px] font-medium">Pick a {curDef.label}</div>
        <input
          type="text"
          value={bq}
          onChange={(e) => setBq(e.target.value)}
          placeholder="Search this slot"
          className="mb-3 w-full border border-border bg-surface px-3 py-2.5 text-[12.5px] outline-none placeholder:text-ink-dim focus:border-border-strong"
        />
        <div className="mb-4 flex gap-1.5">
          {SORTS.map((s) => {
            const on = pSort === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setPSort(s)}
                className="border px-3 py-2 text-[10.5px] uppercase tracking-[0.16em]"
                style={{ borderColor: on ? "#F5F5F5" : "#29292F", color: on ? "#F5F5F5" : "#96969F" }}
              >
                {s}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {pool.map((s) => {
            const assigned = build[cur] === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setBuild((b) => ({ ...b, [cur]: s.id }))}
                className="flex items-center gap-3 border p-2.5 text-left"
                style={{ borderColor: assigned ? "var(--acc)" : "#29292F" }}
              >
                <ArtWell className="h-12 w-[82px] flex-none p-1.5">
                  <SkinArt weapon={s.w} src={s.img} alt={`${s.wl} | ${s.n}`} c1={s.c1} c2={s.c2} c3={s.c3} />
                </ArtWell>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px]">{s.n}</div>
                  <div className="text-[11px] text-ink-muted">
                    {s.wl} · {s.ex}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-display text-[11.5px]">{s.priceStr}</span>
                    <span className="text-[11.5px]" style={{ color: scoreColor(s.m) }}>
                      {s.m}%
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
