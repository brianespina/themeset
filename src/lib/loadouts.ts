import "server-only";

import { prisma } from "@/lib/prisma";
import { SKINS, SLOTS, THEMES } from "@/lib/seed-data";

// Saved-loadout persistence. This is the first module in the app that writes
// user-owned rows, so it also owns the validation: every field below arrives
// from a browser request and none of it is trustworthy.

const SKIN_IDS = new Set(SKINS.map((s) => s.id));
const SLOT_IDS = new Set(SLOTS.map((s) => s.id));
const SLOT_GROUP = new Map(SLOTS.map((s) => [s.id, s.group]));
const SKIN_GROUP = new Map(SKINS.map((s) => [s.id, s.w]));
const THEME_NAMES = new Set(THEMES.map((t) => t.name));

export const MAX_NAME_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 500;

export interface LoadoutItemInput {
  weaponSlot: string;
  skinRef: string;
}

export interface SaveLoadoutInput {
  name: string;
  theme: string;
  description?: string | null;
  items: LoadoutItemInput[];
  isPublic?: boolean;
  matchScore?: number | null;
  budget?: number | null;
}

export class ValidationError extends Error {}

/**
 * Normalises and validates a save request.
 *
 * Throws ValidationError with a message meant for the user. Rejecting unknown
 * skin ids and slot ids matters beyond tidiness: `skinRef` has no foreign key
 * (the seed catalogue lives in code, not a table), so this function is the
 * only thing standing between a crafted request and rows that every screen
 * would then fail to render.
 */
export function parseSaveInput(raw: unknown): SaveLoadoutInput {
  if (typeof raw !== "object" || raw === null) {
    throw new ValidationError("Expected a JSON object.");
  }
  const body = raw as Record<string, unknown>;

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) throw new ValidationError("Give your set a name.");
  if (name.length > MAX_NAME_LENGTH) {
    throw new ValidationError(`Names are limited to ${MAX_NAME_LENGTH} characters.`);
  }

  const theme = typeof body.theme === "string" ? body.theme : "";
  if (!THEME_NAMES.has(theme)) throw new ValidationError("Unknown theme.");

  let description: string | null = null;
  if (typeof body.description === "string" && body.description.trim()) {
    description = body.description.trim();
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new ValidationError(
        `Descriptions are limited to ${MAX_DESCRIPTION_LENGTH} characters.`,
      );
    }
  }

  if (!Array.isArray(body.items)) throw new ValidationError("`items` must be an array.");
  if (body.items.length === 0) throw new ValidationError("Add at least one skin before saving.");
  if (body.items.length > SLOTS.length) {
    throw new ValidationError(`A loadout has at most ${SLOTS.length} slots.`);
  }

  const seenSlots = new Set<string>();
  const items: LoadoutItemInput[] = body.items.map((entry) => {
    if (typeof entry !== "object" || entry === null) {
      throw new ValidationError("Each item must be an object.");
    }
    const item = entry as Record<string, unknown>;
    const weaponSlot = typeof item.weaponSlot === "string" ? item.weaponSlot : "";
    const skinRef = typeof item.skinRef === "string" ? item.skinRef : "";

    if (!SLOT_IDS.has(weaponSlot)) throw new ValidationError(`Unknown slot "${weaponSlot}".`);
    if (!SKIN_IDS.has(skinRef)) throw new ValidationError(`Unknown skin "${skinRef}".`);
    if (seenSlots.has(weaponSlot)) {
      throw new ValidationError(`Slot "${weaponSlot}" appears twice.`);
    }
    // A Karambit can't go in the AWP slot — the UI never offers it, but the
    // API is reachable directly, and a mismatch would render as a broken row.
    if (SLOT_GROUP.get(weaponSlot) !== SKIN_GROUP.get(skinRef)) {
      throw new ValidationError(`"${skinRef}" doesn't fit the ${weaponSlot} slot.`);
    }
    seenSlots.add(weaponSlot);
    return { weaponSlot, skinRef };
  });

  const isPublic = body.isPublic === true;

  let matchScore: number | null = null;
  if (typeof body.matchScore === "number" && Number.isFinite(body.matchScore)) {
    matchScore = Math.min(100, Math.max(0, Math.round(body.matchScore)));
  }

  let budget: number | null = null;
  if (typeof body.budget === "number" && Number.isFinite(body.budget) && body.budget >= 0) {
    budget = body.budget;
  }

  return { name, theme, description, items, isPublic, matchScore, budget };
}

/** Shape returned to the client — flat and serialisable. */
export interface LoadoutSummary {
  id: string;
  name: string;
  theme: string;
  description: string | null;
  matchScore: number | null;
  budget: number | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  items: { weaponSlot: string; skinRef: string; position: number }[];
}

const loadoutSelect = {
  id: true,
  name: true,
  theme: true,
  description: true,
  matchScore: true,
  budget: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: { weaponSlot: true, skinRef: true, position: true },
    orderBy: { position: "asc" },
  },
} as const;

type LoadoutRow = {
  id: string;
  name: string;
  theme: string;
  description: string | null;
  matchScore: number | null;
  budget: number | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  items: { weaponSlot: string; skinRef: string; position: number }[];
};

function toSummary(row: LoadoutRow): LoadoutSummary {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Every loadout owned by this user, newest first. */
export async function listLoadouts(userId: string): Promise<LoadoutSummary[]> {
  const rows = await prisma.loadout.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: loadoutSelect,
  });
  return rows.map(toSummary);
}

/** Creates a loadout and its items in one transaction. */
export async function createLoadout(
  userId: string,
  input: SaveLoadoutInput,
): Promise<LoadoutSummary> {
  const row = await prisma.loadout.create({
    data: {
      userId,
      name: input.name,
      theme: input.theme,
      description: input.description ?? null,
      matchScore: input.matchScore ?? null,
      budget: input.budget ?? null,
      isPublic: input.isPublic ?? false,
      items: {
        create: input.items.map((item, index) => ({
          weaponSlot: item.weaponSlot,
          skinRef: item.skinRef,
          position: index,
        })),
      },
    },
    select: loadoutSelect,
  });
  return toSummary(row);
}

/**
 * Replaces a loadout's contents.
 *
 * The `userId` in the where clause is the authorisation check — scoping the
 * update to the owner means another user's id simply matches no row, rather
 * than relying on a separate "is this yours?" query that could drift.
 */
export async function updateLoadout(
  userId: string,
  loadoutId: string,
  input: SaveLoadoutInput,
): Promise<LoadoutSummary | null> {
  const owned = await prisma.loadout.findFirst({
    where: { id: loadoutId, userId },
    select: { id: true },
  });
  if (!owned) return null;

  const [, row] = await prisma.$transaction([
    prisma.loadoutItem.deleteMany({ where: { loadoutId } }),
    prisma.loadout.update({
      where: { id: loadoutId },
      data: {
        name: input.name,
        theme: input.theme,
        description: input.description ?? null,
        matchScore: input.matchScore ?? null,
        budget: input.budget ?? null,
        isPublic: input.isPublic ?? false,
        items: {
          create: input.items.map((item, index) => ({
            weaponSlot: item.weaponSlot,
            skinRef: item.skinRef,
            position: index,
          })),
        },
      },
      select: loadoutSelect,
    }),
  ]);

  return toSummary(row);
}

/** Returns false when the loadout doesn't exist or isn't this user's. */
export async function deleteLoadout(userId: string, loadoutId: string): Promise<boolean> {
  const result = await prisma.loadout.deleteMany({ where: { id: loadoutId, userId } });
  return result.count > 0;
}
