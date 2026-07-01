import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, checkOrigin } from "@/lib/auth";
import { savedItemSchema } from "@/lib/validation";
import { withLogger } from "@/lib/api-handler";

export const GET = withLogger(async (_req: NextRequest) => {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const res = await db.execute({
    sql: "SELECT item_type, item_id, created_at FROM saved_items WHERE user_id = ? ORDER BY created_at DESC",
    args: [user.id],
  });

  return NextResponse.json({
    items: res.rows.map((r) => ({
      itemType: r.item_type,
      itemId: Number(r.item_id),
      createdAt: r.created_at,
    })),
  });
});

export const POST = withLogger(async (req: NextRequest) => {
  if (!(await checkOrigin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = savedItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  }

  const { itemType, itemId } = parsed.data;
  const now = new Date().toISOString();

  await db.execute({
    sql: "INSERT OR IGNORE INTO saved_items (user_id, item_type, item_id, created_at) VALUES (?,?,?,?)",
    args: [user.id, itemType, itemId, now],
  });

  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = withLogger(async (req: NextRequest) => {
  if (!(await checkOrigin())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = savedItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 422 });
  }

  const { itemType, itemId } = parsed.data;

  await db.execute({
    sql: "DELETE FROM saved_items WHERE user_id = ? AND item_type = ? AND item_id = ?",
    args: [user.id, itemType, itemId],
  });

  return NextResponse.json({ ok: true });
});
