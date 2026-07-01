import "server-only";
import { db } from "./db";
import { rowToIngredient } from "./ingredients";
import type { Product, ProductSummary, ProductIngredientRef } from "./types";

const SUMMARY_COLS = "id, brand, name, slug, category, description";

function rowToSummary(r: Record<string, unknown>): ProductSummary {
  return {
    id: Number(r.id),
    brand: r.brand as string,
    name: r.name as string,
    slug: r.slug as string,
    category: (r.category as string) ?? null,
    description: (r.description as string) ?? null,
  };
}

export async function listProducts(opts?: {
  category?: string;
  brand?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductSummary[]> {
  const limit = opts?.limit ?? 48;
  const offset = opts?.offset ?? 0;
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (opts?.category) {
    conditions.push("category = ?");
    args.push(opts.category);
  }
  if (opts?.brand) {
    conditions.push("brand = ?");
    args.push(opts.brand);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  args.push(limit, offset);

  const res = await db.execute({
    sql: `SELECT ${SUMMARY_COLS} FROM products ${where} ORDER BY brand, name LIMIT ? OFFSET ?`,
    args,
  });
  return res.rows.map(rowToSummary);
}

export async function countProducts(opts?: {
  category?: string;
  brand?: string;
}): Promise<number> {
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (opts?.category) {
    conditions.push("category = ?");
    args.push(opts.category);
  }
  if (opts?.brand) {
    conditions.push("brand = ?");
    args.push(opts.brand);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const res = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM products ${where}`,
    args,
  });
  return Number(res.rows[0].n);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const prodRes = await db.execute({
    sql: `SELECT ${SUMMARY_COLS}, raw_inci FROM products WHERE slug = ? LIMIT 1`,
    args: [slug],
  });
  if (!prodRes.rows[0]) return null;
  const pr = prodRes.rows[0];

  const piRes = await db.execute({
    sql: `SELECT pi.position, pi.raw_name, pi.ingredient_id,
                 i.id, i.cosing_ref, i.inci_name, i.display_name, i.slug AS ing_slug,
                 i.cas_no, i.einecs_no, i.description, i.functions, i.restriction,
                 i.update_date, i.what_it_does, i.rating, i.irritancy, i.comedogenicity,
                 i.pregnancy_safe, i.pregnancy_notes, i.also_known_as, i.tags, i.is_curated
          FROM product_ingredients pi
          LEFT JOIN ingredients i ON i.id = pi.ingredient_id
          WHERE pi.product_id = ?
          ORDER BY pi.position`,
    args: [Number(pr.id)],
  });

  const ingredients: ProductIngredientRef[] = piRes.rows.map((r) => {
    const hasIng = r.ingredient_id !== null;
    const ingRow = hasIng
      ? {
          id: r.id,
          cosing_ref: r.cosing_ref,
          inci_name: r.inci_name,
          display_name: r.display_name,
          slug: r.ing_slug,
          cas_no: r.cas_no,
          einecs_no: r.einecs_no,
          description: r.description,
          functions: r.functions,
          restriction: r.restriction,
          update_date: r.update_date,
          what_it_does: r.what_it_does,
          rating: r.rating,
          irritancy: r.irritancy,
          comedogenicity: r.comedogenicity,
          pregnancy_safe: r.pregnancy_safe,
          pregnancy_notes: r.pregnancy_notes,
          also_known_as: r.also_known_as,
          tags: r.tags,
          is_curated: r.is_curated,
        }
      : null;

    return {
      position: Number(r.position),
      rawName: r.raw_name as string,
      ingredient: ingRow ? rowToIngredient(ingRow as never) : null,
    };
  });

  return {
    id: Number(pr.id),
    brand: pr.brand as string,
    name: pr.name as string,
    slug: pr.slug as string,
    category: (pr.category as string) ?? null,
    description: (pr.description as string) ?? null,
    rawInci: pr.raw_inci as string,
    ingredients,
  };
}

export async function listBrands(): Promise<string[]> {
  const res = await db.execute(
    "SELECT DISTINCT brand FROM products ORDER BY brand",
  );
  return res.rows.map((r) => r.brand as string);
}

export async function listCategories(): Promise<string[]> {
  const res = await db.execute(
    "SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category",
  );
  return res.rows.map((r) => r.category as string);
}
