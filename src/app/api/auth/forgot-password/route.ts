import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { sendPasswordReset } from "@/lib/email";
import { checkRateLimit, getRequestIp } from "@/lib/auth";
import { withLogger } from "@/lib/api-handler";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

const EXPIRES_HOURS = 1;

export const POST = withLogger(async (req: NextRequest) => {
  const ip = await getRequestIp();
  if (!(await checkRateLimit(ip))) {
    return NextResponse.json(
      { error: "Too many attempts — try again in 15 minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email required." }, { status: 422 });
  }

  const email = parsed.data.email.toLowerCase();

  // Always return the same response to avoid user enumeration
  const ok = NextResponse.json({
    ok: true,
    message: "If an account exists, a reset link has been sent.",
  });

  const user = await db.execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  if (!user.rows[0]) return ok;

  const userId = Number(user.rows[0].id);
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + EXPIRES_HOURS * 60 * 60 * 1000);

  await db.execute({
    sql: `INSERT INTO password_resets (token, user_id, created_at, expires_at)
          VALUES (?, ?, ?, ?)`,
    args: [token, userId, now.toISOString(), expiresAt.toISOString()],
  });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    req.headers.get("origin") ??
    "https://skinguard.app";

  await sendPasswordReset(email, `${origin}/reset-password?token=${token}`);

  return ok;
});
