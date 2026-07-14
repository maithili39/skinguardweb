import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  verifyPassword,
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
    logger.warn("rate_limit_hit", { ip, route: "login" });
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

  const res = await db.execute({
    sql: "SELECT id, password_hash FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  const row = res.rows[0];
  const hash = (row?.password_hash as string) ?? "x:x";
  const valid = row ? await verifyPassword(password, hash) : false;

  if (!row || !valid) {
    logger.warn("login_failed", { ip });
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const userId = Number(row.id);
  const token = await createSession(userId);
  logger.info("login_success", { userId });

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", sessionCookieValue(token));
  return response;
});
