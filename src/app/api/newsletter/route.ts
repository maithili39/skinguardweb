import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(new URL("/?sub=invalid", req.url));
  }

  await db.execute({
    sql: `INSERT OR IGNORE INTO newsletter_subscribers (email, created_at)
          VALUES (?, datetime('now'))`,
    args: [email],
  });

  return NextResponse.redirect(new URL("/?sub=ok", req.url));
}
