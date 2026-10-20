import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Prisma, type User } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Supabase owns identity (auth.users); ThemeSet owns the profile row. This
// module keeps the two in step.
//
// Supabase can't write our `users` table on sign-up without a Postgres
// trigger, and a trigger would put profile logic outside the codebase where
// it's invisible to review. Instead we upsert lazily: the first authenticated
// request after sign-in creates the row.

/** Longest username we'll store, so the dedupe suffix always fits. */
const MAX_USERNAME = 24;

function slugifyUsername(raw: string): string {
  const cleaned = raw
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^[_.-]+|[_.-]+$/g, "")
    .slice(0, MAX_USERNAME);
  return cleaned.length >= 2 ? cleaned : "";
}

/**
 * Best display name the provider gave us. Discord sends `user_name`, Google
 * sends `full_name`/`name`, and our Steam flow writes `user_name` itself
 * (see src/app/auth/steam/callback/route.ts).
 */
function preferredUsername(authUser: SupabaseUser): string {
  const meta = authUser.user_metadata ?? {};
  const candidates = [
    meta.user_name,
    meta.preferred_username,
    meta.full_name,
    meta.name,
    authUser.email?.split("@")[0],
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const slug = slugifyUsername(candidate);
    if (slug) return slug;
  }
  // Nothing usable — fall back to the auth id so the row can still be created.
  return `player_${authUser.id.slice(0, 8)}`;
}

function avatarOf(authUser: SupabaseUser): string | null {
  const meta = authUser.user_metadata ?? {};
  const url = meta.avatar_url ?? meta.picture;
  return typeof url === "string" && url ? url : null;
}

function steamIdOf(authUser: SupabaseUser): string | null {
  const id = authUser.user_metadata?.steam_id;
  return typeof id === "string" && id ? id : null;
}

/**
 * Ensures a `users` row exists for this Supabase auth user and returns it.
 *
 * Username collisions are real — two Discord accounts can share a display
 * name — so on a unique-constraint hit we retry with a numeric suffix rather
 * than failing the user's sign-in.
 */
export async function syncUser(authUser: SupabaseUser): Promise<User> {
  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });

  const email = authUser.email ?? null;
  const avatarUrl = avatarOf(authUser);
  const steamId = steamIdOf(authUser);

  if (existing) {
    // Refresh the fields the provider owns, but never the username: the user
    // may have changed it on ThemeSet and we'd be stomping their choice.
    if (existing.email === email && existing.avatarUrl === avatarUrl && existing.steamId === steamId) {
      return existing;
    }
    return prisma.user.update({
      where: { id: authUser.id },
      data: { email, avatarUrl, steamId },
    });
  }

  const base = preferredUsername(authUser);

  for (let attempt = 0; attempt < 6; attempt++) {
    const suffix = attempt === 0 ? "" : `_${attempt + 1}`;
    const username = base.slice(0, MAX_USERNAME - suffix.length) + suffix;
    try {
      return await prisma.user.create({
        data: { id: authUser.id, username, email, avatarUrl, steamId },
      });
    } catch (e) {
      const isUniqueViolation =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!isUniqueViolation) throw e;

      // The clash may be on `id` rather than `username` — i.e. a concurrent
      // request already created this profile. Take theirs and stop.
      const raced = await prisma.user.findUnique({ where: { id: authUser.id } });
      if (raced) return raced;
    }
  }

  // Six taken variants in a row: fall back to something guaranteed unique.
  return prisma.user.create({
    data: {
      id: authUser.id,
      username: `player_${authUser.id.slice(0, 12)}`,
      email,
      avatarUrl,
      steamId,
    },
  });
}
