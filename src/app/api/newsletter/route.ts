import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNewsletterWelcome } from "@/lib/email";
import { checkRateLimit, getRequestIp } from "@/lib/auth";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = await getRequestIp();
  if (!(await checkRateLimit(ip))) {
    logger.warn("rate_limit_hit", { ip, route: "newsletter" });
    return NextResponse.json(
      { error: "Too many attempts — try again in 15 minutes." },
      { status: 429 },
    );
  }

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

  let result;
  try {
    result = await db.execute({
      sql: `INSERT OR IGNORE INTO newsletter_subscribers (email, created_at)
            VALUES (?, datetime('now'))`,
      args: [email],
    });
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }

  if (result.rowsAffected > 0) {
    try {
      await sendNewsletterWelcome(email);
    } catch {
      // Don't fail if email send fails
    }
  }

  return NextResponse.json({ ok: true });
}
