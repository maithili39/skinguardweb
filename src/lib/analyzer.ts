import "server-only";
import { db } from "./db";
import { getIngredientsByIds } from "./ingredients";
import { tokenizeInci, candidateForms, cleanToken } from "./inci";
import { normalizeName } from "./text";
import type {
  Ingredient,
  AnalyzedIngredient,
  AnalysisReport,
  AnalysisFlag,
  MatchKind,
} from "./types";
import type { SkinProfile } from "./profile";

interface RawToken {
  raw: string;
  isMayContain: boolean;
}

function buildFtsQuery(token: string): string | null {
  const words = cleanToken(token)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3)
    .slice(0, 4);
  if (words.length === 0) return null;
  // Each significant word must prefix-match — conservative, avoids noise.
  return words.map((w) => `"${w}"*`).join(" AND ");
}

export async function analyzeInci(
  rawText: string,
  profile: SkinProfile,
): Promise<AnalysisReport> {
  const { main, mayContain } = tokenizeInci(rawText);
  const tokens: RawToken[] = [
    ...main.map((raw) => ({ raw, isMayContain: false })),
    ...mayContain.map((raw) => ({ raw, isMayContain: true })),
  ];

  const allForms = new Set<string>();
  const tokenForms = tokens.map((t) => {
    const forms = candidateForms(t.raw);
    forms.forEach((f) => allForms.add(f));
    return forms;
  });

  const exactMap = await lookupExact([...allForms]);
  const synonymMap = await lookupSynonyms([...allForms]);

  const resolved: {
    token: RawToken;
    id: number | null;
    kind: MatchKind;
  }[] = [];
  const idsToLoad = new Set<number>();

  for (let i = 0; i < tokens.length; i++) {
    const forms = tokenForms[i];
    let id: number | null = null;
    let kind: MatchKind = "unmatched";

    for (const form of forms) {
      if (exactMap.has(form)) {
        id = exactMap.get(form)!;
        kind = "exact";
        break;
      }
      if (synonymMap.has(form)) {
        id = synonymMap.get(form)!;
        kind = "synonym";
        break;
      }
    }

    if (id === null) {
      const fuzzyId = await fuzzyMatch(tokens[i].raw);
      if (fuzzyId !== null) {
        id = fuzzyId;
        kind = "fuzzy";
      }
    }

    if (id === null) {
      const typoId = await typoMatch(tokens[i].raw);
      if (typoId !== null) {
        id = typoId;
        kind = "fuzzy";
      }
    }

    if (id !== null) idsToLoad.add(id);
    resolved.push({ token: tokens[i], id, kind });
  }

  const ingMap = await getIngredientsByIds([...idsToLoad]);

  const analyzed: AnalyzedIngredient[] = resolved.map((r) => ({
    rawName: r.token.raw,
    matchKind: r.kind,
    ingredient: r.id !== null ? (ingMap.get(r.id) ?? null) : null,
    isMayContain: r.token.isMayContain,
  }));

  const matchedCount = analyzed.filter((a) => a.ingredient).length;

  return {
    ingredients: analyzed,
    matchedCount,
    totalCount: analyzed.length,
    flags: buildFlags(analyzed, profile),
    highlights: buildHighlights(analyzed),
  };
}

async function lookupExact(forms: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (forms.length === 0) return map;
  const placeholders = forms.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT norm_name, id FROM ingredients WHERE norm_name IN (${placeholders})`,
    args: forms,
  });
  for (const row of res.rows) {
    map.set(row.norm_name as string, Number(row.id));
  }
  return map;
}

async function lookupSynonyms(forms: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (forms.length === 0) return map;
  const placeholders = forms.map(() => "?").join(",");
  const res = await db.execute({
    sql: `SELECT norm_synonym, ingredient_id FROM ingredient_synonyms WHERE norm_synonym IN (${placeholders})`,
    args: forms,
  });
  for (const row of res.rows) {
    const key = row.norm_synonym as string;
    if (!map.has(key)) map.set(key, Number(row.ingredient_id));
  }
  return map;
}

async function fuzzyMatch(rawToken: string): Promise<number | null> {
  const query = buildFtsQuery(rawToken);
  if (!query) return null;
  try {
    const res = await db.execute({
      sql: `SELECT rowid FROM ingredients_fts WHERE ingredients_fts MATCH ? ORDER BY rank LIMIT 1`,
      args: [query],
    });
    if (res.rows[0]) return Number(res.rows[0].rowid);
  } catch {
    // Malformed FTS query — treat as no match.
  }
  return null;
}

interface TypoCandidate {
  norm: string;
  id: number;
}
let typoIndexPromise: Promise<TypoCandidate[]> | null = null;

async function getTypoIndex(): Promise<TypoCandidate[]> {
  if (!typoIndexPromise) {
    typoIndexPromise = (async () => {
      const out: TypoCandidate[] = [];
      const names = await db.execute(
        "SELECT id, norm_name FROM ingredients ORDER BY is_curated DESC",
      );
      for (const r of names.rows) {
        out.push({ norm: r.norm_name as string, id: Number(r.id) });
      }
      const syns = await db.execute(
        "SELECT norm_synonym AS n, ingredient_id AS id FROM ingredient_synonyms",
      );
      for (const r of syns.rows) {
        out.push({ norm: r.n as string, id: Number(r.id) });
      }
      return out;
    })();
  }
  return typoIndexPromise;
}

function boundedLevenshtein(a: string, b: string, max: number): number {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;
  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j++) prev[j] = j;
  for (let i = 1; i <= la; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= lb; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

async function typoMatch(rawToken: string): Promise<number | null> {
  const norm = normalizeName(cleanToken(rawToken));
  if (norm.length < 4) return null; // too short to disambiguate safely
  const threshold = Math.max(1, Math.floor(norm.length * 0.2));
  const first = norm.charCodeAt(0);

  const index = await getTypoIndex();
  let bestDist = threshold + 1;
  let bestId: number | null = null;
  let ambiguous = false;

  for (const cand of index) {
    // Cheap guards: OCR/typos rarely corrupt the first char or the length much.
    if (cand.norm.charCodeAt(0) !== first) continue;
    if (Math.abs(cand.norm.length - norm.length) > threshold) continue;
    const d = boundedLevenshtein(norm, cand.norm, threshold);
    if (d < bestDist) {
      bestDist = d;
      bestId = cand.id;
      ambiguous = false;
    } else if (d === bestDist && cand.id !== bestId) {
      ambiguous = true;
    }
  }

  if (bestId === null || bestDist > threshold || ambiguous) return null;
  return bestId;
}

function hasTag(ing: Ingredient, tag: string): boolean {
  return ing.tags.includes(tag);
}

function buildFlags(
  analyzed: AnalyzedIngredient[],
  profile: SkinProfile,
): AnalysisFlag[] {
  const flags: AnalysisFlag[] = [];
  const ings = analyzed
    .map((a) => a.ingredient)
    .filter((x): x is Ingredient => Boolean(x));

  const namesWithTag = (tag: string) =>
    ings.filter((i) => hasTag(i, tag)).map((i) => i.displayName);
  const namesWhere = (pred: (i: Ingredient) => boolean) =>
    ings.filter(pred).map((i) => i.displayName);

  const concerns = new Set(profile.concerns);

  // Fragrance / allergens
  const fragrance = Array.from(
    new Set([...namesWithTag("fragrance"), ...namesWithTag("allergen")]),
  );
  if (fragrance.length) {
    flags.push({
      level: "bad",
      title: "Contains fragrance / known allergens",
      detail:
        concerns.has("sensitive") || concerns.has("rosacea")
          ? "You flagged sensitive skin. Fragrance and declarable allergens are a leading cause of irritation and contact reactions — approach with caution."
          : "Fragrance and EU-declarable allergens can trigger irritation or contact allergy in reactive skin.",
      ingredientNames: fragrance,
    });
  }

  // Comedogenic (acne / fungal concerns)
  const comedogenic = namesWhere(
    (i) => (i.comedogenicity ?? 0) >= 3 || hasTag(i, "comedogenic"),
  );
  if (comedogenic.length) {
    flags.push({
      level: concerns.has("acne") || concerns.has("fungal-acne") ? "bad" : "moderate",
      title: "Potentially pore-clogging ingredients",
      detail:
        concerns.has("acne") || concerns.has("fungal-acne")
          ? "Because you flagged acne-prone skin, these higher-comedogenic ingredients are worth watching — they may contribute to breakouts."
          : "These ingredients rate higher on the comedogenicity scale and may clog pores for breakout-prone skin.",
      ingredientNames: comedogenic,
    });
  }

  // Drying alcohol
  const dryingAlcohol = namesWithTag("drying-alcohol");
  if (dryingAlcohol.length) {
    flags.push({
      level:
        profile.skinType === "dry" || concerns.has("sensitive") ? "bad" : "moderate",
      title: "Contains drying alcohol",
      detail:
        "Volatile alcohols give a fast-absorbing finish but can compromise the moisture barrier with frequent use, especially on dry or sensitive skin.",
      ingredientNames: dryingAlcohol,
    });
  }

  // Strong exfoliating / retinoid actives
  const actives = namesWhere(
    (i) =>
      hasTag(i, "exfoliant") || hasTag(i, "retinoid") || hasTag(i, "active"),
  );
  if (actives.length) {
    flags.push({
      level: "moderate",
      title: "Contains active ingredients",
      detail:
        "Actives (acids, retinoids, vitamin C) are effective but can over-exfoliate if layered. Introduce gradually, don't combine too many at once, and use sunscreen.",
      ingredientNames: Array.from(new Set(actives)),
    });
  }

  // Pregnancy
  if (concerns.has("pregnancy")) {
    const unsafe = namesWhere((i) => i.pregnancySafe === "avoid");
    const caution = namesWhere((i) => i.pregnancySafe === "caution");
    if (unsafe.length) {
      flags.push({
        level: "bad",
        title: "Best avoided during pregnancy",
        detail:
          "You flagged pregnant / nursing. These ingredients are commonly advised against in pregnancy — check with your doctor before use.",
        ingredientNames: unsafe,
      });
    }
    if (caution.length) {
      flags.push({
        level: "moderate",
        title: "Use with caution during pregnancy",
        detail:
          "Guidance on these is mixed during pregnancy. Discuss with your healthcare provider.",
        ingredientNames: caution,
      });
    }
  }

  // Fungal acne triggers
  if (concerns.has("fungal-acne")) {
    const fungalTriggers = namesWhere(
      (i) => hasTag(i, "fungal-acne-trigger") || hasTag(i, "oil"),
    );
    if (fungalTriggers.length) {
      flags.push({
        level: "moderate",
        title: "Possible fungal acne (malassezia) triggers",
        detail:
          "Certain oils, fatty acids, and esters can feed malassezia yeast. If you're prone to fungal acne, patch test and monitor.",
        ingredientNames: Array.from(new Set(fungalTriggers)),
      });
    }
  }

  // Positive signal: barrier / soothing / superstar
  const goodies = namesWhere(
    (i) =>
      i.rating === "superstar" ||
      hasTag(i, "barrier-repair") ||
      hasTag(i, "soothing"),
  );
  if (goodies.length) {
    flags.push({
      level: "good",
      title: "Skin-loving ingredients found",
      detail:
        "This formula includes well-regarded hydrators, barrier-repair lipids, or soothing agents.",
      ingredientNames: Array.from(new Set(goodies)),
    });
  }

  return flags;
}

function buildHighlights(analyzed: AnalyzedIngredient[]) {
  const ings = analyzed
    .map((a) => a.ingredient)
    .filter((x): x is Ingredient => Boolean(x));
  const uniq = (arr: string[]) => Array.from(new Set(arr));

  return {
    superstars: uniq(
      ings.filter((i) => i.rating === "superstar").map((i) => i.displayName),
    ),
    actives: uniq(
      ings
        .filter(
          (i) =>
            i.tags.includes("active") ||
            i.tags.includes("exfoliant") ||
            i.tags.includes("retinoid"),
        )
        .map((i) => i.displayName),
    ),
    fragranceAllergens: uniq(
      ings
        .filter((i) => i.tags.includes("fragrance") || i.tags.includes("allergen"))
        .map((i) => i.displayName),
    ),
    comedogenic: uniq(
      ings
        .filter((i) => (i.comedogenicity ?? 0) >= 3 || i.tags.includes("comedogenic"))
        .map((i) => i.displayName),
    ),
  };
}

