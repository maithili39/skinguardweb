import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNewsletterWelcome } from "@/lib/email";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.redirect(new URL("/?sub=invalid", req.url));
  }

  const result = await db.execute({
    sql: `INSERT OR IGNORE INTO newsletter_subscribers (email, created_at)
          VALUES (?, datetime('now'))`,
    args: [email],
  });

  // Only send welcome email on first subscribe (not duplicate)
  if (result.rowsAffected > 0) {
    try {
      await sendNewsletterWelcome(email);
    } catch {
      // Don't fail the redirect if email send fails
    }
  }

  return NextResponse.redirect(new URL("/?sub=ok", req.url));
}
