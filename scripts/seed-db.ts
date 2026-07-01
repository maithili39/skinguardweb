/**
 * Seed script: builds data/app.db from the real EU CosIng CSV plus the curated
 * overlay and product datasets.
 *
 *   npm run db:seed
 *
 * Idempotent: drops and rebuilds the content tables on every run, while leaving
 * user/session/saved_items tables untouched.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { createClient, type Client, type InStatement } from "@libsql/client";
import { slugify, normalizeName, parseFunctions, smartTitleCase } from "../src/lib/text.ts";
import { tokenizeInci, candidateForms } from "../src/lib/inci.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");
const DB_PATH = join(DATA_DIR, "app.db");
const CSV_PATH = join(DATA_DIR, "raw", "cosing.csv");
const OVERLAY_PATH = join(DATA_DIR, "curated", "ingredients-overlay.json");
const PRODUCTS_PATH = join(DATA_DIR, "curated", "products.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IngredientRow {
  id: number;
  cosing_ref: string | null;
  inci_name: string;
  display_name: string;
  norm_name: string;
  slug: string;
  cas_no: string | null;
  einecs_no: string | null;
  description: string | null;
  functions: string[];
  restriction: string | null;
  update_date: string | null;
  // curated
  what_it_does: string | null;
  rating: string | null;
  irritancy: number | null;
  comedogenicity: number | null;
  pregnancy_safe: string | null;
  pregnancy_notes: string | null;
  also_known_as: string[];
  tags: string[];
  is_curated: boolean;
}

interface OverlayEntry {
  inci_name: string;
  what_it_does?: string;
  rating?: string;
  irritancy?: number | null;
  comedogenicity?: number | null;
  pregnancy_safe?: string | null;
  pregnancy_notes?: string;
  also_known_as?: string[];
  tags?: string[];
  functions?: string[];
  description?: string;
}

interface ProductEntry {
  brand: string;
  name: string;
  category?: string;
  description?: string;
  inci: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanField(v: string | undefined | null): string | null {
  if (v == null) return null;
  const t = v.replace(/\s+/g, " ").trim();
  if (!t || t === "-") return null;
  return t;
}

function uniqueSlug(base: string, used: Set<string>): string {
  let slug = base;
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n++}`;
  }
  used.add(slug);
  return slug;
}

async function runBatched(db: Client, statements: InStatement[], size = 500) {
  for (let i = 0; i < statements.length; i += size) {
    await db.batch(statements.slice(i, i + size), "write");
  }
}

// ---------------------------------------------------------------------------
// 1. Parse CosIng CSV -> deduped ingredient rows
// ---------------------------------------------------------------------------

function loadCosing(): Map<string, IngredientRow> {
  const raw = readFileSync(CSV_PATH, "utf8");
  // The export has a 6-line preamble; the real header is the 7th line.
  const lines = raw.split(/\r\n|\n/);
  const headerIdx = lines.findIndex((l) => l.startsWith("COSING Ref No"));
  if (headerIdx === -1) throw new Error("Could not find CosIng header row");
  const body = lines.slice(headerIdx).join("\n");

  const records = parse(body, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  // Merge duplicate INCI names (CosIng lists some names under multiple CAS
  // numbers). Keyed by normalized name.
  const byNorm = new Map<string, IngredientRow>();

  for (const r of records) {
    const inci = cleanField(r["INCI name"]);
    if (!inci) continue;
    const norm = normalizeName(inci);
    if (!norm) continue;

    const desc = cleanField(r["Chem/IUPAC Name / Description"]);
    const funcs = parseFunctions(r["Function"]);
    const cas = cleanField(r["CAS No"]);
    const einecs = cleanField(r["EINECS/ELINCS No"]);
    const restriction = cleanField(r["Restriction"]);
    const cosingRef = cleanField(r["COSING Ref No"]);
    const updateDate = cleanField(r["Update Date"]);

    const existing = byNorm.get(norm);
    if (!existing) {
      byNorm.set(norm, {
        id: 0,
        cosing_ref: cosingRef,
        inci_name: inci,
        display_name: smartTitleCase(inci),
        norm_name: norm,
        slug: "",
        cas_no: cas,
        einecs_no: einecs,
        description: desc,
        functions: funcs,
        restriction,
        update_date: updateDate,
        what_it_does: null,
        rating: null,
        irritancy: null,
        comedogenicity: null,
        pregnancy_safe: null,
        pregnancy_notes: null,
        also_known_as: [],
        tags: [],
        is_curated: false,
      });
    } else {
      // Merge: prefer longest description, union functions, fill blanks.
      if (desc && (!existing.description || desc.length > existing.description.length)) {
        existing.description = desc;
      }
      existing.functions = Array.from(new Set([...existing.functions, ...funcs]));
      existing.cas_no ??= cas;
      existing.einecs_no ??= einecs;
      existing.restriction ??= restriction;
    }
  }

  return byNorm;
}

// ---------------------------------------------------------------------------
// 2. Apply curated overlay
// ---------------------------------------------------------------------------

function applyOverlay(byNorm: Map<string, IngredientRow>): number {
  if (!existsSync(OVERLAY_PATH)) return 0;
  const entries = JSON.parse(readFileSync(OVERLAY_PATH, "utf8")) as OverlayEntry[];
  let applied = 0;

  for (const e of entries) {
    if (!e.inci_name) continue;
    const norm = normalizeName(e.inci_name);
    let row = byNorm.get(norm);

    // A curated entry may be filed under a common/trade name while the real
    // CosIng backbone uses a different INCI string (e.g. curated "Water" vs
    // CosIng "Aqua", "Coconut Oil" vs "Cocos Nucifera Oil"). Fall back to the
    // curated also_known_as list so we attach to the real row instead of
    // creating an orphan duplicate that real printed labels never match.
    let matchedViaAka = false;
    if (!row && e.also_known_as) {
      for (const aka of e.also_known_as) {
        const akaRow = byNorm.get(normalizeName(aka));
        if (akaRow) {
          row = akaRow;
          matchedViaAka = true;
          break;
        }
      }
    }

    if (!row) {
      // Curated ingredient not present in CosIng (e.g. trade names) — create it.
      row = {
        id: 0,
        cosing_ref: null,
        inci_name: e.inci_name,
        display_name: e.inci_name,
        norm_name: norm,
        slug: "",
        cas_no: null,
        einecs_no: null,
        description: e.description ?? null,
        functions: e.functions ?? [],
        restriction: null,
        update_date: null,
        what_it_does: null,
        rating: null,
        irritancy: null,
        comedogenicity: null,
        pregnancy_safe: null,
        pregnancy_notes: null,
        also_known_as: [],
        tags: [],
        is_curated: false,
      };
      byNorm.set(norm, row);
    }

    row.is_curated = true;
    // Prefer the curated name's casing for display — but only on a direct
    // match. If we matched via an aka, the row's real INCI name is the one
    // printed on labels, so keep it and file the curated name as a synonym.
    if (matchedViaAka) {
      row.also_known_as = Array.from(new Set([...row.also_known_as, e.inci_name]));
    } else if (e.inci_name) {
      row.display_name = e.inci_name;
    }
    if (e.what_it_does !== undefined) row.what_it_does = e.what_it_does;
    if (e.rating !== undefined) row.rating = e.rating;
    if (e.irritancy !== undefined) row.irritancy = e.irritancy ?? null;
    if (e.comedogenicity !== undefined) row.comedogenicity = e.comedogenicity ?? null;
    if (e.pregnancy_safe !== undefined) row.pregnancy_safe = e.pregnancy_safe ?? null;
    if (e.pregnancy_notes !== undefined) row.pregnancy_notes = e.pregnancy_notes ?? null;
    if (e.also_known_as) {
      row.also_known_as = Array.from(new Set([...row.also_known_as, ...e.also_known_as]));
    }
    if (e.tags) row.tags = e.tags;
    if (e.functions && e.functions.length) {
      // Curated functions go first so the display label is consumer-friendly
      row.functions = Array.from(new Set([...e.functions, ...row.functions]));
    }
    if (e.description && !row.description) row.description = e.description;
    applied++;
  }

  return applied;
}

// ---------------------------------------------------------------------------
// 3. Write to DB
// ---------------------------------------------------------------------------

async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  console.log("Loading CosIng CSV…");
  const byNorm = loadCosing();
  console.log(`  ${byNorm.size.toLocaleString()} unique ingredients`);

  console.log("Applying curated overlay…");
  const curatedCount = applyOverlay(byNorm);
  console.log(`  ${curatedCount} curated entries applied`);

  // Assign ids + slugs.
  const rows = Array.from(byNorm.values());
  const usedSlugs = new Set<string>();
  rows.forEach((row, i) => {
    row.id = i + 1;
    row.slug = uniqueSlug(slugify(row.inci_name), usedSlugs);
  });

  // Index by norm for product matching.
  const normToId = new Map<string, number>();
  rows.forEach((r) => normToId.set(r.norm_name, r.id));

  // Synonym -> id map (exact normalized synonym), for product matching.
  const synToId = new Map<string, number>();
  rows.forEach((r) => {
    for (const syn of r.also_known_as) {
      const ns = normalizeName(syn);
      if (ns && !normToId.has(ns) && !synToId.has(ns)) synToId.set(ns, r.id);
    }
  });

  // Resolve a printed token to an ingredient id using the shared candidate
  // cascade (exact name → synonym), mirroring runtime analysis.
  const matchToken = (tok: string): number | null => {
    for (const form of candidateForms(tok)) {
      const id = normToId.get(form) ?? synToId.get(form);
      if (id) return id;
    }
    return null;
  };

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const db =
    tursoUrl && tursoToken
      ? createClient({ url: tursoUrl, authToken: tursoToken })
      : createClient({ url: `file:${DB_PATH}` });

  console.log("Building schema…");
  const migrationsDir = join(__dirname, "migrations");
  const migrationFiles = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
  for (const file of migrationFiles) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
      await db.execute(stmt);
    }
  }

  console.log("Resetting content tables…");
  for (const t of [
    "DROP TABLE IF EXISTS ingredients_fts",
    "DELETE FROM ingredients",
    "DELETE FROM ingredient_synonyms",
    "DELETE FROM product_ingredients",
    "DELETE FROM products",
  ]) {
    await db.execute(t);
  }
  await db.execute(
    "CREATE VIRTUAL TABLE ingredients_fts USING fts5(inci_name, also_known_as, content='')",
  );

  console.log("Inserting ingredients…");
  const ingStmts: InStatement[] = rows.map((r) => ({
    sql: `INSERT INTO ingredients
      (id, cosing_ref, inci_name, display_name, norm_name, slug, cas_no, einecs_no, description,
       functions, restriction, update_date, what_it_does, rating, irritancy,
       comedogenicity, pregnancy_safe, pregnancy_notes, also_known_as, tags, is_curated)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      r.id,
      r.cosing_ref,
      r.inci_name,
      r.display_name,
      r.norm_name,
      r.slug,
      r.cas_no,
      r.einecs_no,
      r.description,
      JSON.stringify(r.functions),
      r.restriction,
      r.update_date,
      r.what_it_does,
      r.rating,
      r.irritancy,
      r.comedogenicity,
      r.pregnancy_safe,
      r.pregnancy_notes,
      JSON.stringify(r.also_known_as),
      JSON.stringify(r.tags),
      r.is_curated ? 1 : 0,
    ],
  }));
  await runBatched(db, ingStmts);

  console.log("Building FTS index…");
  const ftsStmts: InStatement[] = rows.map((r) => ({
    sql: "INSERT INTO ingredients_fts (rowid, inci_name, also_known_as) VALUES (?,?,?)",
    args: [r.id, r.inci_name, r.also_known_as.join(" ")],
  }));
  await runBatched(db, ftsStmts);

  console.log("Building synonym index…");
  const synStmts: InStatement[] = [];
  for (const r of rows) {
    for (const syn of r.also_known_as) {
      const ns = normalizeName(syn);
      if (!ns) continue;
      synStmts.push({
        sql: "INSERT OR IGNORE INTO ingredient_synonyms (norm_synonym, ingredient_id) VALUES (?,?)",
        args: [ns, r.id],
      });
    }
  }
  await runBatched(db, synStmts);
  console.log(`  ${synStmts.length} synonyms`);

  // Products
  if (existsSync(PRODUCTS_PATH)) {
    console.log("Inserting products…");
    const products = JSON.parse(readFileSync(PRODUCTS_PATH, "utf8")) as ProductEntry[];
    const usedProductSlugs = new Set<string>();
    const prodStmts: InStatement[] = [];
    const piStmts: InStatement[] = [];

    products.forEach((p, idx) => {
      const id = idx + 1;
      const slug = uniqueSlug(slugify(`${p.brand} ${p.name}`), usedProductSlugs);
      prodStmts.push({
        sql: `INSERT INTO products (id, brand, name, slug, category, description, raw_inci)
              VALUES (?,?,?,?,?,?,?)`,
        args: [id, p.brand, p.name, slug, p.category ?? null, p.description ?? null, p.inci],
      });

      // Split printed list into tokens (handles internal commas, paren/slash
      // variants), match each to an ingredient via the shared cascade.
      const { main, mayContain } = tokenizeInci(p.inci);
      const tokens = [...main, ...mayContain];
      tokens.forEach((tok, pos) => {
        const matchId = matchToken(tok);
        piStmts.push({
          sql: `INSERT OR IGNORE INTO product_ingredients (product_id, position, raw_name, ingredient_id)
                VALUES (?,?,?,?)`,
          args: [id, pos, tok, matchId],
        });
      });
    });

    await runBatched(db, prodStmts);
    await runBatched(db, piStmts);
    console.log(`  ${products.length} products`);
  } else {
    console.log("No products file yet — skipping.");
  }

  // Report.
  const total = await db.execute("SELECT COUNT(*) AS n FROM ingredients");
  const curated = await db.execute("SELECT COUNT(*) AS n FROM ingredients WHERE is_curated = 1");
  console.log(
    `\nDone. ${(total.rows[0].n as number).toLocaleString()} ingredients ` +
      `(${curated.rows[0].n} curated) in ${DB_PATH}`,
  );
  db.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
