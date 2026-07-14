import "server-only";
import { db } from "./db";
import type { Ingredient, Rating, Substitution } from "./types";

const RATING_PRIORITY: Record<string, number> = {
  superstar: 0,
  goodie: 1,
  neutral: 2,
  caution: 3,
  avoid: 4,
};

// Generic secondary functions that nearly every ingredient carries — matching
// on these alone produces noisy, unrelated suggestions (e.g. an antioxidant
// "masking" an odor isn't a substitute for a comedogenic emollient oil).
const GENERIC_FUNCTIONS = new Set([
  "masking",
  "perfuming",
  "binding",
  "denaturant",
  "viscosity controlling",
  "oral care",
]);

interface SuggestOptions {
  excludeTags?: string[];
  maxComedogenicity?: number;
}

interface Candidate {
  id: number;
  displayName: string;
  slug: string;
  whatItDoes: string | null;
  rating: Rating | null;
  comedogenicity: number | null;
  tags: string[];
  functions: string[];
}

function parseTags(v: unknown): string[] {
  if (typeof v !== "string" || !v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Suggest alternative ingredients that serve the same cosmetic function(s)
 * as the flagged ones, but without the disqualifying trait (tag or
 * comedogenicity level) that got them flagged.
 */
export async function suggestAlternatives(
  flagged: Ingredient[],
  opts: SuggestOptions,
  limit = 3,
): Promise<Substitution[]> {
  const allFunctions = Array.from(new Set(flagged.flatMap((i) => i.functions)));
  const specificFunctions = allFunctions.filter((f) => !GENERIC_FUNCTIONS.has(f.toLowerCase()));
  const functions = (specificFunctions.length > 0 ? specificFunctions : allFunctions).slice(0, 8);
  if (functions.length === 0) return [];
  const functionSet = new Set(functions.map((f) => f.toLowerCase()));

  const excludeIds = new Set(flagged.map((i) => i.id));
  const placeholders = functions.map(() => "?").join(",");

  const res = await db.execute({
    sql: `
      SELECT DISTINCT i.id, i.display_name, i.slug, i.what_it_does, i.rating, i.comedogenicity, i.tags, i.functions
      FROM ingredients i, json_each(i.functions) jf
      WHERE jf.value IN (${placeholders})
        AND i.is_curated = 1
        AND i.rating IN ('superstar', 'goodie', 'neutral')
      LIMIT 50
    `,
    args: functions,
  });

  const excludeTags = new Set(opts.excludeTags ?? []);
  const overlapCount = (c: Candidate) =>
    c.functions.filter((f) => functionSet.has(f.toLowerCase())).length;

  const candidates: Candidate[] = res.rows
    .map((r) => ({
      id: Number(r.id),
      displayName: r.display_name as string,
      slug: r.slug as string,
      whatItDoes: (r.what_it_does as string) ?? null,
      rating: (r.rating as Rating) ?? null,
      comedogenicity: r.comedogenicity === null ? null : Number(r.comedogenicity),
      tags: parseTags(r.tags),
      functions: parseTags(r.functions),
    }))
    .filter((c) => !excludeIds.has(c.id))
    .filter((c) => !c.tags.some((t) => excludeTags.has(t)))
    .filter(
      (c) => opts.maxComedogenicity === undefined || (c.comedogenicity ?? 0) <= opts.maxComedogenicity,
    )
    .sort(
      (a, b) =>
        overlapCount(b) - overlapCount(a) ||
        RATING_PRIORITY[a.rating ?? "neutral"] - RATING_PRIORITY[b.rating ?? "neutral"] ||
        (a.comedogenicity ?? 0) - (b.comedogenicity ?? 0),
    );

  return candidates.slice(0, limit).map((c) => ({
    displayName: c.displayName,
    slug: c.slug,
    whatItDoes: c.whatItDoes,
    rating: c.rating,
  }));
}
