import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, checkRateLimit, getRequestIp } from "@/lib/auth";
import { withLogger } from "@/lib/api-handler";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

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
    const first = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: first }, { status: 422 });
  }

  const { token, password } = parsed.data;
  const now = new Date().toISOString();

  const reset = await db.execute({
    sql: `SELECT user_id FROM password_resets
          WHERE token = ? AND expires_at > ? AND used_at IS NULL
          LIMIT 1`,
    args: [token, now],
  });

  if (!reset.rows[0]) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const userId = Number(reset.rows[0].user_id);
  const hash = await hashPassword(password);

  await db.batch([
    {
      sql: "UPDATE users SET password_hash = ? WHERE id = ?",
      args: [hash, userId],
    },
    {
      sql: "UPDATE password_resets SET used_at = ? WHERE token = ?",
      args: [now, token],
    },
    {
      sql: "DELETE FROM sessions WHERE user_id = ?",
      args: [userId],
    },
  ]);

  return NextResponse.json({ ok: true });
});
