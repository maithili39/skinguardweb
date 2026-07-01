import { NextResponse, type NextRequest } from "next/server";
import { analyzeInci } from "@/lib/analyzer";
import { analyzeSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/http";
import { withLogger } from "@/lib/api-handler";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { SkinProfile } from "@/lib/profile";

export const POST = withLogger(async (request: NextRequest) => {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to analyze ingredients.", authRequired: true }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = analyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const report = await analyzeInci(
    parsed.data.text,
    parsed.data.profile as SkinProfile,
  );

  // Derive a label from the first line of the input
  const label = parsed.data.text.split(/[\n,]/)[0].trim().slice(0, 80) || "Unnamed analysis";

  await db.execute({
    sql: "INSERT INTO analysis_history (user_id, created_at, label, verdict) VALUES (?,?,?,?)",
    args: [user.id, new Date().toISOString(), label, report.verdict],
  });

  return NextResponse.json(report);
});
