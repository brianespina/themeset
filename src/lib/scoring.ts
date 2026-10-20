// Scoring engine — ported verbatim from the design prototype (product-critical
// logic per the handoff: "reimplement verbatim; it's the product logic").
// The only change from the original is priceOf(): it now prefers a live
// SteamAnalyst price (USD, refreshed daily into Postgres) over the
// hand-curated placeholder (also USD).

import type { Catalog } from "@/lib/catalog";
import { themeByName, type Skin, type Theme } from "@/lib/seed-data";

export function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997;
  return h;
}

/** skin-to-theme fit, 58–99 */
export function match(skin: Skin, themeName: string): number {
  const t = themeByName(themeName);
  let v = 79 + (hash(skin.id) % 9);
  if (skin.tags.includes(t.tag)) v += 12;
  if (skin.tags.includes("minimal") && t.tag === "white") v += 4;
  if (skin.tags.includes("luxury") && t.tag === "gold") v += 5;
  return clamp(v, 58, 99);
}

function hex2rgb(hex: string): [number, number, number] {
  const h = (hex || "#000000").replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function colorDistance(x: string, y: string): number {
  const [pr, pg, pb] = hex2rgb(x);
  const [qr, qg, qb] = hex2rgb(y);
  return Math.sqrt((pr - qr) ** 2 + (pg - qg) ** 2 + (pb - qb) ** 2);
}

/** skin-to-skin fit, 52–99 — used by Complete the Set and "Pairs well with" */
export function pairMatch(a: Skin, b: Skin): number {
  let v = 100 - (colorDistance(a.c1, b.c1) * 0.62 + colorDistance(a.c3, b.c3) * 0.38) / 3.5;
  const overlap = a.tags.filter((t) => b.tags.includes(t)).length;
  v += overlap * 7;
  return clamp(Math.round(v), 52, 99);
}

export function clamp(v: number, min = 58, max = 99): number {
  return Math.max(min, Math.min(max, v));
}

const SLOT_NAME: Record<string, string> = { knife: "Knife", gloves: "Gloves", ak: "Rifle", m4: "Rifle", awp: "Sniper", pistol: "Pistol" };

export function slotName(weaponGroup: string): string {
  return SLOT_NAME[weaponGroup] ?? "Weapon";
}

export function scoreColor(v: number): string {
  return v >= 90 ? "var(--acc, #E0453C)" : v >= 85 ? "#F5F5F5" : "#96969F";
}

export interface ResolvedPrice {
  amount: number;
  currency: string;
  live: boolean;
}

/** Live SteamAnalyst price when it resolves, else the seed placeholder (USD). */
export function priceOf(skin: Skin, catalog?: Catalog | null): ResolvedPrice {
  const live = catalog?.price(skin.wl, skin.n, skin.ex);
  if (live) return { amount: live.amount, currency: live.currency, live: true };
  return { amount: skin.p, currency: "USD", live: false };
}

export function formatPrice({ amount, currency }: ResolvedPrice): string {
  const symbol = currency === "EUR" ? "€" : "$";
  if (amount >= 1000) return symbol + Math.round(amount).toLocaleString("en-US");
  return symbol + amount.toFixed(2);
}

export interface SubScore {
  key: string;
  value: number;
  weight: number;
}

export interface SetDetailSubScore {
  key: string;
  label: string;
  value: number;
  weight: string;
}

/**
 * Published-set sub-scores shown on the set detail screen: fixed offsets
 * around the set's stored score, matching ThemeSet.dc.html's setObj(). Real
 * per-item sub-scoring (buildScore) only runs in the builder, where a live
 * set of items exists to score.
 */
export function setDetailSubScores(score: number): SetDetailSubScore[] {
  return [
    { key: "color", label: "Color harmony", value: Math.min(99, score + 1), weight: "35%" },
    { key: "style", label: "Style consistency", value: Math.min(99, score - 1), weight: "25%" },
    { key: "knifeGloves", label: "Knife + gloves", value: Math.min(99, score + 2), weight: "20%" },
    { key: "weapon", label: "Weapon consistency", value: Math.max(60, score - 3), weight: "10%" },
    { key: "budget", label: "Budget efficiency", value: Math.max(60, score - 6), weight: "10%" },
  ];
}

/** Weighted mean set score from the five sub-scores (handoff section: Scoring Logic). */
export function setScoreFromSubs(sub: SubScore[]): number {
  const weighted = sub.reduce((acc, s) => acc + s.value * s.weight, 0);
  return clamp(Math.round(weighted));
}

export interface BuildScoreInput {
  items: Skin[];
  themeName: string;
  knife: Skin | null;
  gloves: Skin | null;
  /** Pre-resolved total (see lib/view.ts) — keeps this function catalog-free so it can run client-side. */
  total: ResolvedPrice;
}

export interface BuildScoreResult {
  score: number;
  totalStr: string;
  sub: { key: string; label: string; value: number }[];
}

const SUB_LABELS: Record<string, string> = {
  color: "Color harmony",
  style: "Style consistency",
  knifeGloves: "Knife + gloves",
  weapon: "Weapon consistency",
  budget: "Budget efficiency",
};

/** Builder-screen set score: matches ThemeSet.dc.html's buildVals() exactly. */
export function buildScore({ items, themeName, knife, gloves, total }: BuildScoreInput): BuildScoreResult {
  const avg = items.length ? items.reduce((acc, s) => acc + match(s, themeName), 0) / items.length : 70;
  const kg = knife && gloves ? (match(knife, themeName) + match(gloves, themeName)) / 2 + 3 : 62;
  const budget = total.amount <= 500 ? 92 : total.amount <= 1500 ? 86 : 78;

  const sub = [
    { key: "color", value: clamp(avg + 1) },
    { key: "style", value: clamp(avg - 2) },
    { key: "knifeGloves", value: clamp(kg) },
    { key: "weapon", value: clamp(avg - 3) },
    { key: "budget", value: clamp(budget) },
  ];
  const score = clamp(
    Math.round(sub[0].value * 0.35 + sub[1].value * 0.25 + sub[2].value * 0.2 + sub[3].value * 0.1 + sub[4].value * 0.1)
  );

  return {
    score,
    totalStr: formatPrice(total),
    sub: sub.map((s) => ({ key: s.key, label: SUB_LABELS[s.key], value: s.value })),
  };
}

/** Ranks candidates by mean pairMatch() against the given anchors (Complete the Set). */
export function rankByAnchors<T extends Skin>(list: T[], anchors: Skin[]): (T & { m: number })[] {
  return list
    .map((s) => {
      const ms = anchors.map((a) => pairMatch(s, a));
      const m = ms.length ? Math.round(ms.reduce((x, y) => x + y, 0) / ms.length) : 80;
      return { ...s, m };
    })
    .sort((a, b) => b.m - a.m);
}

export interface RollResult {
  theme: string;
  picks: string[];
}

/** Random generator — matches ThemeSet.dc.html's rollSet(). */
export function rollSet(
  skins: Skin[],
  themes: Theme[],
  gTheme: string,
  gBudget: string
): RollResult {
  const themeName =
    gTheme === "Surprise me" ? themes[Math.floor(Math.random() * themes.length)].name : gTheme;
  const caps: Record<string, number> = { $250: 250, $500: 500, "$1,500": 1500, "No limit": 1e9 };
  let left = caps[gBudget] ?? 1e9;
  const picks: string[] = [];

  for (const group of ["knife", "gloves", "ak", "m4", "awp", "pistol"]) {
    let pool = skins.filter((s) => s.w === group && s.p <= left * 0.72);
    if (!pool.length) {
      pool = skins
        .filter((s) => s.w === group)
        .sort((a, b) => a.p - b.p)
        .slice(0, 3);
    }
    const ranked = pool
      .map((s) => ({ ...s, m: match(s, themeName) }))
      .sort((a, b) => b.m - a.m)
      .slice(0, 4);
    const pick = ranked[Math.floor(Math.random() * ranked.length)];
    if (pick) {
      picks.push(pick.id);
      left -= pick.p;
    }
  }

  return { theme: themeName, picks };
}
