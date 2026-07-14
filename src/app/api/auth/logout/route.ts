import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { deleteSession, clearSessionCookieValue } from "@/lib/auth";
import { withLogger } from "@/lib/api-handler";

export const POST = withLogger(async (_req: NextRequest) => {
  const jar = await cookies();
  const token = jar.get("sg_session")?.value;
  if (token) await deleteSession(token);

  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", clearSessionCookieValue());
  return res;
});
