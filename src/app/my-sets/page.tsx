import { loadCatalog } from "@/lib/catalog";
import { formatPrice } from "@/lib/scoring";
import { resolveAllSkins, sumPrices } from "@/lib/view";
import { requireUser } from "@/lib/auth/dal";
import { listLoadouts } from "@/lib/loadouts";
import { MySetsScreen, type SavedSetRow } from "@/components/sets/MySetsScreen";

export const metadata = { title: "Your sets — ThemeSet" };

// Strictly per-user: never prerender or cache it. Session reads already force
// dynamic rendering when Supabase is configured, but stating it here means an
// unconfigured build can't bake in a redirect to /signin either.
export const dynamic = "force-dynamic";

const savedAtFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function MySetsPage() {
  // Signed-out visitors bounce to /signin and come back here afterwards.
  const user = await requireUser("/my-sets");

  const [catalog, loadouts] = await Promise.all([loadCatalog(), listLoadouts(user.id)]);
  const byId = new Map(resolveAllSkins(catalog).map((s) => [s.id, s]));

  const sets: SavedSetRow[] = loadouts.map((loadout) => {
    // A saved skinRef can go stale if a skin is ever removed from the seed
    // catalogue, so resolve defensively rather than assuming a hit.
    const resolved = loadout.items
      .map((item) => byId.get(item.skinRef))
      .filter((s): s is NonNullable<typeof s> => !!s);

    // Priced from today's catalogue, not the budget stored at save time, so the
    // figure tracks the daily price refresh instead of going stale.
    const total = sumPrices(resolved);

    return {
      id: loadout.id,
      name: loadout.name,
      theme: loadout.theme,
      matchScore: loadout.matchScore,
      totalStr: resolved.length ? formatPrice(total) : "—",
      savedAt: savedAtFormat.format(new Date(loadout.updatedAt)),
      slotCount: loadout.items.length,
      art: resolved.slice(0, 6).map((s) => ({
        skinRef: s.id,
        weapon: s.w,
        img: s.img,
        label: `${s.wl} | ${s.n}`,
        c1: s.c1,
        c2: s.c2,
        c3: s.c3,
      })),
    };
  });

  return <MySetsScreen sets={sets} />;
}
