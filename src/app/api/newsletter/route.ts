import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNewsletterWelcome } from "@/lib/email";

export async function POST(req: NextRequest) {
  let email = "";
  const ct = req.headers.get("content-type") ?? "";

  if (ct.includes("application/json")) {
    const body = await req.json() as { email?: string };
    email = String(body.email ?? "").trim().toLowerCase();
  } else {
    const formData = await req.formData();
    email = String(formData.get("email") ?? "").trim().toLowerCase();
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 422 });
  }

  const result = await db.execute({
    sql: `INSERT OR IGNORE INTO newsletter_subscribers (email, created_at)
          VALUES (?, datetime('now'))`,
    args: [email],
  });

  if (result.rowsAffected > 0) {
    try {
      await sendNewsletterWelcome(email);
    } catch {
      // Don't fail if email send fails
    }
  }

  return NextResponse.json({ ok: true });
}
