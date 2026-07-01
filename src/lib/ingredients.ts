import "server-only";
import type { Row } from "@libsql/client";
import { db } from "./db";
import type { Ingredient, Rating, PregnancySafety } from "./types";

function parseJsonArray(v: unknown): string[] {
  if (typeof v !== "string" || !v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function rowToIngredient(r: Row): Ingredient {
  return {
    id: Number(r.id),
    cosingRef: (r.cosing_ref as string) ?? null,
    inciName: r.inci_name as string,
    displayName: r.display_name as string,
    slug: r.slug as string,
    casNo: (r.cas_no as string) ?? null,
    einecsNo: (r.einecs_no as string) ?? null,
    description: (r.description as string) ?? null,
    functions: parseJsonArray(r.functions),
    restriction: (r.restriction as string) ?? null,
    updateDate: (r.update_date as string) ?? null,
    whatItDoes: (r.what_it_does as string) ?? null,
    rating: (r.rating as Rating) ?? null,
    irritancy: r.irritancy === null ? null : Number(r.irritancy),
    comedogenicity: r.comedogenicity === null ? null : Number(r.comedogenicity),
    pregnancySafe: (r.pregnancy_safe as PregnancySafety) ?? null,
    pregnancyNotes: (r.pregnancy_notes as string) ?? null,
    alsoKnownAs: parseJsonArray(r.also_known_as),
    tags: parseJsonArray(r.tags),
    isCurated: Number(r.is_curated) === 1,
  };
}

const INGREDIENT_COLUMNS =
  "id, cosing_ref, inci_name, display_name, slug, cas_no, einecs_no, description, functions, restriction, update_date, what_it_does, rating, irritancy, comedogenicity, pregnancy_safe, pregnancy_notes, also_known_as, tags, is_curated";

export async function getIngredientBySlug(
  slug: string,
): Promise<Ingredient | null> {
  const res = await db.execute({
    sql: `SELECT ${INGREDIENT_COLUMNS} FROM ingredients WHERE slug = ? LIMIT 1`,
    args: [slug],
  });
  return res.rows[0] ? rowToIngredient(res.rows[0]) : null;
}

export async function getIngredientsByIds(
  ids: number[],
): Promise<Map<number, Ingredient>> {
  const map = new Map<number, Ingredient>();
  if (ids.length === 0) return map;
  const placeholders = ids.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT ${INGREDIENT_COLUMNS} FROM ingredients WHERE id IN (${placeholders})`,
    args: ids,
  });
  for (const row of res.rows) {
    const ing = rowToIngredient(row);
    map.set(ing.id, ing);
  }
  return map;
}

export interface IngredientListItem {
  inciName: string;
  displayName: string;
  slug: string;
  rating: Rating | null;
  whatItDoes: string | null;
  isCurated: boolean;
}

/** Browse curated ingredients alphabetically (paginated), optionally filtered by rating. */
export async function listCuratedIngredients(
  limit = 60,
  offset = 0,
  rating?: string,
): Promise<IngredientListItem[]> {
  const ratingClause = rating ? " AND rating = ?" : "";
  const args: (number | string)[] = rating
    ? [rating, limit, offset]
    : [limit, offset];
  const res = await db.execute({
    sql: `SELECT inci_name, display_name, slug, rating, what_it_does, is_curated
          FROM ingredients
          WHERE is_curated = 1${ratingClause}
          ORDER BY display_name COLLATE NOCASE
          LIMIT ? OFFSET ?`,
    args,
  });
  return res.rows.map((r) => ({
    inciName: r.inci_name as string,
    displayName: r.display_name as string,
    slug: r.slug as string,
    rating: (r.rating as Rating) ?? null,
    whatItDoes: (r.what_it_does as string) ?? null,
    isCurated: Number(r.is_curated) === 1,
  }));
}

export async function countCuratedIngredients(rating?: string): Promise<number> {
  const ratingClause = rating ? " AND rating = ?" : "";
  const args: string[] = rating ? [rating] : [];
  const res = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM ingredients WHERE is_curated = 1${ratingClause}`,
    args,
  });
  return Number(res.rows[0].n);
}

/** Search curated ingredients by name (paginated), optionally filtered by rating. */
export async function searchCuratedIngredients(
  query: string,
  limit = 60,
  offset = 0,
  rating?: string,
): Promise<IngredientListItem[]> {
  const like = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
  const startLike = `${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
  const ratingClause = rating ? " AND rating = ?" : "";
  const args: (string | number)[] = rating
    ? [like, like, rating, startLike, limit, offset]
    : [like, like, startLike, limit, offset];
  const res = await db.execute({
    sql: `SELECT inci_name, display_name, slug, rating, what_it_does, is_curated
          FROM ingredients
          WHERE is_curated = 1
            AND (display_name LIKE ? ESCAPE '\\' OR inci_name LIKE ? ESCAPE '\\')${ratingClause}
          ORDER BY
            CASE WHEN display_name LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END,
            display_name COLLATE NOCASE
          LIMIT ? OFFSET ?`,
    args,
  });
  return res.rows.map((r) => ({
    inciName: r.inci_name as string,
    displayName: r.display_name as string,
    slug: r.slug as string,
    rating: (r.rating as Rating) ?? null,
    whatItDoes: (r.what_it_does as string) ?? null,
    isCurated: Number(r.is_curated) === 1,
  }));
}

export async function countSearchedIngredients(
  query: string,
  rating?: string,
): Promise<number> {
  const like = `%${query.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
  const ratingClause = rating ? " AND rating = ?" : "";
  const args: string[] = rating ? [like, like, rating] : [like, like];
  const res = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM ingredients
          WHERE is_curated = 1
            AND (display_name LIKE ? ESCAPE '\\' OR inci_name LIKE ? ESCAPE '\\')${ratingClause}`,
    args,
  });
  return Number(res.rows[0].n);
}
