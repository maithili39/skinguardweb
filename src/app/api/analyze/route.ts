import { NextResponse, type NextRequest } from "next/server";
import { analyzeInci } from "@/lib/analyzer";
import { analyzeSchema } from "@/lib/validation";
import { assertSameOrigin } from "@/lib/http";
import { withLogger } from "@/lib/api-handler";
import type { SkinProfile } from "@/lib/profile";

export const POST = withLogger(async (request: NextRequest) => {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
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
  return NextResponse.json(report);
});
