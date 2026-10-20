import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/dal";
import { ValidationError, deleteLoadout, parseSaveInput, updateLoadout } from "@/lib/loadouts";

// Dynamic route params are a Promise in this Next.js version — the same
// convention the existing /themeset/[slug] page follows.
type Context = { params: Promise<{ id: string }> };

// PUT /api/loadouts/:id — replace a saved set's name, theme and contents.
export async function PUT(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  try {
    const input = parseSaveInput(body);
    const loadout = await updateLoadout(user.id, id, input);
    // Null covers both "no such set" and "not yours" — deliberately
    // indistinguishable, so this can't be used to probe other users' ids.
    if (!loadout) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ loadout });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}

// DELETE /api/loadouts/:id
export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteLoadout(user.id, id);
  if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
