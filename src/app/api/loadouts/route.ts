import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { ValidationError, createLoadout, listLoadouts, parseSaveInput } from "@/lib/loadouts";

// GET /api/loadouts — the signed-in user's saved sets.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const loadouts = await listLoadouts(user.id);
  return NextResponse.json({ loadouts });
}

// POST /api/loadouts — save a new set.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  try {
    const input = parseSaveInput(body);
    const loadout = await createLoadout(user.id, input);
    return NextResponse.json({ loadout }, { status: 201 });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
