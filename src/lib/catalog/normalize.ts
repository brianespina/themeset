// Shared name-matching helpers, ported from the design prototype's
// themeset-data.js so resolution behaves identically to the original design.

export const norm = (s: string | undefined | null): string =>
  (s || "")
    .toLowerCase()
    .replace(/^★\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const WEAR_NAME: Record<string, string> = {
  FN: "Factory New",
  MW: "Minimal Wear",
  FT: "Field-Tested",
  WW: "Well-Worn",
  BS: "Battle-Scarred",
};

export const WEAR_MULTIPLIER: Record<string, number> = {
  FN: 1.34,
  MW: 1.0,
  FT: 0.63,
  WW: 0.49,
  BS: 0.38,
};

/** Splits a "Weapon | Paint" market name into its two halves. */
export function splitMarketName(name: string): [weapon: string, paint: string] {
  const idx = name.indexOf(" | ");
  if (idx === -1) return [name, ""];
  return [name.slice(0, idx), name.slice(idx + 3)];
}

/**
 * Best record for a weapon + paint name, tolerating phase suffixes
 * ("Doppler Phase 2" resolves against a "Doppler" record). Identical scoring
 * to the original design's makeResolver().
 */
export function bestMatch<T extends { pattern: string }>(
  pool: T[],
  paintName: string
): T | null {
  const want = norm(paintName);
  let best: T | null = null;
  let bestScore = -1;
  for (const r of pool) {
    const have = norm(r.pattern);
    let score = -1;
    if (have === want) score = 100;
    else if (want.startsWith(have) && have.length > 0) score = 60 + have.length;
    else if (have.startsWith(want) && want.length > 0) score = 40 + want.length;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return bestScore >= 0 ? best : null;
}
