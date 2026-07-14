import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  hashPassword,
  createSession,
  sessionCookieValue,
  checkRateLimit,
  getRequestIp,
} from "@/lib/auth";
import { credentialsSchema } from "@/lib/validation";
import { withLogger } from "@/lib/api-handler";
import { logger } from "@/lib/logger";

export const POST = withLogger(async (req: NextRequest) => {
  const ip = await getRequestIp();
  if (!(await checkRateLimit(ip))) {
    logger.warn("rate_limit_hit", { ip, route: "signup" });
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

  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid input.";
    return NextResponse.json({ error: first }, { status: 422 });
  }

  const { email, password } = parsed.data;

  const existing = await db.execute({
    sql: "SELECT id FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });
  if (existing.rows[0]) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const hash = await hashPassword(password);
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: "INSERT INTO users (email, password_hash, created_at) VALUES (?,?,?) RETURNING id",
    args: [email, hash, now],
  });

  const userId = Number(result.rows[0].id);
  const token = await createSession(userId);
  logger.info("signup_success", { userId });

  const res = NextResponse.json({ ok: true }, { status: 201 });
  res.headers.set("Set-Cookie", sessionCookieValue(token));
  return res;
});
