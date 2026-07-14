import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getRequestIp } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  barcode: z.string().trim().min(6).max(32).regex(/^[0-9]+$/, "Barcode must be numeric."),
});

interface OBFProduct {
  product_name?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
}

interface OBFResponse {
  status: number;
  product?: OBFProduct;
}

export async function POST(req: NextRequest) {
  const ip = await getRequestIp();
  if (!(await checkRateLimit(ip))) {
    logger.warn("rate_limit_hit", { ip, route: "barcode" });
    return NextResponse.json(
      { error: "Too many attempts — try again in 15 minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "A numeric barcode is required." }, { status: 422 });
  }
  const { barcode } = parsed.data;

  try {
    const cached = await db.execute({
      sql: "SELECT product_name, ingredients_text, source FROM barcode_products WHERE barcode = ?",
      args: [barcode],
    });

    if (cached.rows[0]) {
      const row = cached.rows[0];
      return NextResponse.json({
        found: true,
        productName: (row.product_name as string) ?? "",
        ingredients: row.ingredients_text as string,
        source: row.source as string,
      });
    }

    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`OBF error ${res.status}`);
    const data = (await res.json()) as OBFResponse;

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false, reason: "not_found" });
    }

    const ingredients = (data.product.ingredients_text_en ?? data.product.ingredients_text ?? "").trim();
    const productName = (data.product.product_name ?? "").trim();

    if (!ingredients) {
      return NextResponse.json({ found: false, reason: "no_ingredients" });
    }

    const now = new Date().toISOString();
    await db.execute({
      sql: `INSERT INTO barcode_products (barcode, product_name, ingredients_text, source, fetched_at, updated_at)
            VALUES (?, ?, ?, 'obf', ?, ?)
            ON CONFLICT(barcode) DO UPDATE SET
              product_name = excluded.product_name,
              ingredients_text = excluded.ingredients_text,
              updated_at = excluded.updated_at
            WHERE barcode_products.source != 'manual'`,
      args: [barcode, productName, ingredients, now, now],
    });

    return NextResponse.json({ found: true, productName, ingredients, source: "obf" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("barcode_lookup_failed", { error: msg, barcode });
    return NextResponse.json({ error: "Could not reach the product database." }, { status: 502 });
  }
}
