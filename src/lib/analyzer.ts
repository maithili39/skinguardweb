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
  Verdict,
  ScoreBreakdown,
} from "./types";
import type { SkinProfile } from "./profile";

interface RawToken {
  raw: string;
  isMayContain: boolean;
  concentration?: string;
}

// Extract percentage concentration from a token like "Niacinamide 10%" or "Niacinamide (10%)"
function extractConcentration(token: string): { name: string; concentration?: string } {
  const m = token.match(/^(.*?)\s*\(?\s*(\d+(?:\.\d+)?%)\s*\)?$/);
  if (m) return { name: m[1].trim(), concentration: m[2] };
  return { name: token };
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
    ...main.map((raw) => {
      const { name, concentration } = extractConcentration(raw);
      return { raw: name, isMayContain: false, concentration };
    }),
    ...mayContain.map((raw) => {
      const { name, concentration } = extractConcentration(raw);
      return { raw: name, isMayContain: true, concentration };
    }),
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
    concentration: r.token.concentration,
  }));

  const matchedCount = analyzed.filter((a) => a.ingredient).length;
  const flags = buildFlags(analyzed, profile);
  const { verdict, verdictReason } = buildVerdict(flags, profile);
  const { score, scoreBreakdown, recommendation } = buildScore(analyzed, flags, profile);

  return {
    ingredients: analyzed,
    matchedCount,
    totalCount: analyzed.length,
    flags,
    highlights: buildHighlights(analyzed),
    verdict,
    verdictReason,
    score,
    scoreBreakdown,
    recommendation,
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
  const isSensitive = concerns.has("sensitive") || concerns.has("rosacea");
  const isAcneProne = concerns.has("acne") || concerns.has("fungal-acne");
  const isDry = profile.skinType === "dry";
  const isPregnant = concerns.has("pregnancy");

  // ── Pregnancy — only flag if concern is set, and only ingredients rated avoid ──
  if (isPregnant) {
    const unsafe = namesWhere((i) => i.pregnancySafe === "avoid");
    const cautionList = namesWhere((i) => i.pregnancySafe === "caution");
    if (unsafe.length) {
      flags.push({
        level: "bad",
        title: "Avoid during pregnancy",
        detail:
          "These ingredients have evidence-backed advisories against use in pregnancy. Retinoids (vitamin A derivatives) are linked to birth defects at high doses; salicylic acid penetrates the skin and is advised against in the third trimester. Consult your OB/GYN before use.",
        ingredientNames: unsafe,
      });
    }
    if (cautionList.length) {
      flags.push({
        level: "moderate",
        title: "Mixed guidance during pregnancy",
        detail:
          "Low topical doses of these ingredients are generally considered low-risk by most dermatologists, but guidance varies. If you're pregnant or breastfeeding, discuss with your healthcare provider.",
        ingredientNames: cautionList,
      });
    }
  }

  // ── EU-declarable contact allergens — only a real concern for sensitised skin ──
  const allergens = namesWithTag("allergen");
  if (allergens.length && isSensitive) {
    flags.push({
      level: "bad",
      title: "EU-declarable contact allergens",
      detail:
        "The EU requires these fragrance chemicals to be listed by name above 0.01% (rinse-off) / 0.001% (leave-on) because they are established contact sensitisers. For sensitive or rosacea-prone skin the risk of a reaction is meaningfully elevated — a fragrance-free formula is a safer choice.",
      ingredientNames: allergens,
    });
  } else if (allergens.length) {
    // Inform without alarming
    flags.push({
      level: "moderate",
      title: "Contains EU-declarable fragrance allergens",
      detail:
        `${allergens.length} ingredient${allergens.length > 1 ? "s are" : " is"} on the EU's list of 26 declarable fragrance allergens. The vast majority of people tolerate these well at cosmetic concentrations. They are only a concern if you have a known fragrance allergy or have reacted to a product before.`,
      ingredientNames: allergens,
    });
  }

  // ── Fragrance (undisclosed blend) — context-dependent ──
  const fragranceBlend = namesWithTag("fragrance").filter(
    (n) => !allergens.includes(n),
  );
  if (fragranceBlend.length && isSensitive) {
    flags.push({
      level: "moderate",
      title: "Contains fragrance (undisclosed blend)",
      detail:
        "\"Parfum\" / \"Fragrance\" on a label is a single entry for potentially dozens of chemicals, none of which are disclosed. For sensitive or reactive skin, undisclosed fragrance is a common trigger — look for the same product in a fragrance-free version if you react.",
      ingredientNames: fragranceBlend,
    });
  }

  // ── Comedogenicity — only flag ingredients rated 4–5, and contextualise ──
  const highlyComedogenic = namesWhere(
    (i) => (i.comedogenicity ?? 0) >= 4 || hasTag(i, "comedogenic"),
  );
  const mildlyComedogenic = namesWhere(
    (i) => (i.comedogenicity ?? 0) === 3,
  );
  if (highlyComedogenic.length && isAcneProne) {
    flags.push({
      level: "bad",
      title: "Highly comedogenic ingredients",
      detail:
        "These ingredients score 4–5 on the standard 0–5 comedogenicity scale, meaning they have a documented tendency to block follicles in controlled studies. For acne-prone skin this is a meaningful risk, not just a theoretical one. Concentration matters — if they appear near the end of the list they may be fine, but monitor your skin.",
      ingredientNames: highlyComedogenic,
    });
  } else if (highlyComedogenic.length) {
    flags.push({
      level: "moderate",
      title: "Some ingredients rate high on comedogenicity scales",
      detail:
        "These ingredients score 4–5 on comedogenicity scales. For most skin types at typical cosmetic concentrations this causes no issue. Only relevant if you are acne-prone.",
      ingredientNames: highlyComedogenic,
    });
  }
  if (mildlyComedogenic.length && isAcneProne) {
    flags.push({
      level: "moderate",
      title: "Mildly comedogenic ingredients",
      detail:
        "These score 3/5 on comedogenicity scales — borderline territory. Many people with acne-prone skin use products containing these without issue, as final concentration in the formula is usually low. Worth monitoring if you break out.",
      ingredientNames: mildlyComedogenic,
    });
  }

  // ── Drying alcohols — only flag for dry/sensitive, inform others ──
  const dryingAlcohol = namesWithTag("drying-alcohol");
  if (dryingAlcohol.length) {
    if (isDry || isSensitive) {
      flags.push({
        level: "moderate",
        title: "Contains drying / volatile alcohol",
        detail:
          "Volatile alcohols (denatured alcohol, ethanol) evaporate quickly and give a fast-absorbing, matte finish. Clinical evidence shows repeated use can impair barrier function in dry or sensitive skin. For oily or normal skin types, low concentrations are typically well tolerated.",
        ingredientNames: dryingAlcohol,
      });
    }
    // For oily/normal skin: not flagged — it's actually beneficial (matte finish, penetration enhancer)
  }

  // ── Actives — informative, not alarming ──
  const retinoids = namesWhere((i) => hasTag(i, "retinoid"));
  const exfoliants = namesWhere((i) => hasTag(i, "exfoliant"));
  if (retinoids.length) {
    flags.push({
      level: "moderate",
      title: "Contains retinoid (vitamin A derivative)",
      detail:
        "Retinoids are among the most evidence-backed anti-ageing and acne actives in dermatology. They increase cell turnover, which can cause dryness and peeling in the first 4–8 weeks (the \"retinization\" period). Use at night, buffer with moisturiser if needed, and apply SPF daily. Do not combine with other strong exfoliants.",
      ingredientNames: retinoids,
    });
  }
  if (exfoliants.length) {
    flags.push({
      level: "moderate",
      title: "Contains chemical exfoliant (AHA / BHA / PHA)",
      detail:
        "Chemical exfoliants dissolve the bonds between dead skin cells rather than scrubbing them off. AHAs (glycolic, lactic) target the surface; BHAs (salicylic acid) penetrate into pores — ideal for blackheads. PHAs are gentler and suitable for sensitive skin. All increase photosensitivity — daily SPF is non-negotiable.",
      ingredientNames: exfoliants,
    });
  }

  // ── Fungal acne triggers — only if concern is set ──
  if (concerns.has("fungal-acne")) {
    const fungalTriggers = namesWhere(
      (i) => hasTag(i, "fungal-acne-trigger") || hasTag(i, "oil"),
    );
    if (fungalTriggers.length) {
      flags.push({
        level: "moderate",
        title: "Potential malassezia triggers",
        detail:
          "Malassezia (pityrosporum) folliculitis feeds on certain fatty acids and oils. Note: comedogenicity scales and malassezia sensitivity are separate concerns — an ingredient can be non-comedogenic but still feed the yeast. These are worth avoiding if you have confirmed fungal acne, but they are harmless for everyone else.",
        ingredientNames: Array.from(new Set(fungalTriggers)),
      });
    }
  }

  // ── Positive signals ──
  const superstars = namesWhere((i) => i.rating === "superstar");
  const barrierIngredients = namesWhere(
    (i) => hasTag(i, "barrier-repair") || hasTag(i, "soothing"),
  );
  const allGoodies = Array.from(new Set([...superstars, ...barrierIngredients]));
  if (allGoodies.length) {
    flags.push({
      level: "good",
      title: "Evidence-backed actives & skin-identical ingredients",
      detail:
        "This formula contains ingredients with strong peer-reviewed evidence for efficacy — hydrators, barrier lipids, or well-studied actives. These are the ingredients dermatologists and cosmetic scientists consistently recommend.",
      ingredientNames: allGoodies,
    });
  }

  return flags;
}

function buildVerdict(
  flags: AnalysisFlag[],
  profile: SkinProfile,
): { verdict: Verdict; verdictReason: string } {
  const badFlags = flags.filter((f) => f.level === "bad");
  const moderateFlags = flags.filter((f) => f.level === "moderate");
  const concerns = new Set(profile.concerns);

  // Hard avoids: only things with real clinical evidence of harm for THIS person
  if (badFlags.length > 0) {
    const isPregnancyFlag = badFlags.some((f) => f.title.toLowerCase().includes("pregnancy"));
    const isAllergenFlag = badFlags.some((f) => f.title.toLowerCase().includes("allergen"));
    const isComedogenicFlag = badFlags.some((f) => f.title.toLowerCase().includes("comedogenic"));

    if (isPregnancyFlag) {
      return {
        verdict: "avoid",
        verdictReason:
          "Contains ingredients with evidence-based advisories against use in pregnancy (e.g. retinoids, high-dose salicylic acid). The risk is not cosmetic — it is pharmacological. Consult your doctor.",
      };
    }

    if (isAllergenFlag) {
      return {
        verdict: "avoid",
        verdictReason:
          "Contains EU-declarable contact allergens and you have sensitive / reactive skin. This is a meaningful mismatch — not a theoretical risk. A fragrance-free alternative will give the same benefits without the irritant load.",
      };
    }

    if (isComedogenicFlag && (concerns.has("acne") || concerns.has("fungal-acne"))) {
      return {
        verdict: "caution",
        verdictReason:
          "Contains highly comedogenic ingredients (4–5/5 scale) and you flagged acne-prone skin. These ingredients have a documented tendency to block follicles. Concentration in the formula matters — if they appear near the end of the ingredient list the risk is lower, but monitor your skin after 2–4 weeks.",
      };
    }
  }

  // Caution: real but manageable concerns
  if (moderateFlags.length > 0) {
    const hasExfoliant = moderateFlags.some((f) => f.title.toLowerCase().includes("exfoliant"));
    const hasRetinoid = moderateFlags.some((f) => f.title.toLowerCase().includes("retinoid"));
    const hasMildComedo = moderateFlags.some((f) => f.title.toLowerCase().includes("mildly comedogenic"));
    const hasFungal = moderateFlags.some((f) => f.title.toLowerCase().includes("malassezia"));

    if (hasRetinoid && hasExfoliant) {
      return {
        verdict: "caution",
        verdictReason:
          "Contains both a retinoid and a chemical exfoliant. Either alone is excellent — combined in the same routine they can over-exfoliate, causing barrier damage. Use on alternate nights rather than together.",
      };
    }
    if (hasRetinoid) {
      return {
        verdict: "safe",
        verdictReason:
          "Contains a retinoid — one of the most clinically validated skincare ingredients available. Expect a 4–8 week adjustment period (dryness, peeling). This is normal and not a reason to stop. Apply SPF daily when using retinoids.",
      };
    }
    if (hasExfoliant) {
      return {
        verdict: "safe",
        verdictReason:
          "Contains a chemical exfoliant (AHA/BHA/PHA). These are well-studied and effective at the concentrations used in leave-on products. Daily SPF is essential — exfoliants increase UV sensitivity.",
      };
    }
    if (hasMildComedo && (concerns.has("acne") || concerns.has("fungal-acne"))) {
      return {
        verdict: "caution",
        verdictReason:
          "A few ingredients score 3/5 on comedogenicity scales. This is borderline — many acne-prone people use these without issue at typical cosmetic concentrations. Patch test for 2 weeks and monitor.",
      };
    }
    if (hasFungal) {
      return {
        verdict: "caution",
        verdictReason:
          "Contains oils or fatty acids that can feed malassezia yeast. If your acne is fungal in origin, these may perpetuate breakouts. Switch to a malassezia-safe formula and reassess.",
      };
    }

    // Generic moderate — don't overstate
    return {
      verdict: "safe",
      verdictReason:
        "No significant concerns for your skin profile. A few ingredients are worth being aware of (see notes below) but none represent a meaningful risk at typical cosmetic use concentrations.",
    };
  }

  return {
    verdict: "safe",
    verdictReason:
      "Formula looks well-matched to your skin profile. No ingredients of concern were identified based on your skin type and flagged concerns.",
  };
}

function buildScore(
  analyzed: AnalyzedIngredient[],
  flags: AnalysisFlag[],
  profile: SkinProfile,
): { score: number; scoreBreakdown: ScoreBreakdown[]; recommendation: string } {
  const ings = analyzed.map((a) => a.ingredient).filter((x): x is Ingredient => Boolean(x));
  const concerns = new Set(profile.concerns);
  const isSensitive = concerns.has("sensitive") || concerns.has("rosacea");
  const isAcneProne = concerns.has("acne") || concerns.has("fungal-acne");
  const isDry = profile.skinType === "dry";
  const isPregnant = concerns.has("pregnancy");
  const breakdown: ScoreBreakdown[] = [];

  let score = 65; // neutral baseline — most products are decent

  // ── Positive signals ──
  const superstars = ings.filter((i) => i.rating === "superstar");
  if (superstars.length > 0) {
    const pts = Math.min(superstars.length * 4, 16);
    breakdown.push({ label: "Evidence-backed actives", points: pts, reason: `${superstars.length} superstar ingredient${superstars.length > 1 ? "s" : ""} (${superstars.map((i) => i.displayName).slice(0, 3).join(", ")}) with strong clinical evidence.` });
    score += pts;
  }

  const barrierIngredients = ings.filter((i) => i.tags.includes("barrier-repair") || i.tags.includes("soothing"));
  if (barrierIngredients.length > 0) {
    const pts = Math.min(barrierIngredients.length * 2, 8);
    breakdown.push({ label: "Barrier & soothing agents", points: pts, reason: `Contains ${barrierIngredients.length} barrier-repair or soothing ingredient${barrierIngredients.length > 1 ? "s" : ""}.` });
    score += pts;
  }

  const goodieCount = ings.filter((i) => i.rating === "goodie").length;
  if (goodieCount > 0) {
    const pts = Math.min(goodieCount * 2, 6);
    breakdown.push({ label: "Well-tolerated ingredients", points: pts, reason: `${goodieCount} goodie-rated ingredient${goodieCount > 1 ? "s" : ""} — safe and effective for most skin types.` });
    score += pts;
  }

  // ── Negative signals (contextual to skin profile) ──

  // Pregnancy conflicts — hard deduction
  if (isPregnant) {
    const unsafeCount = ings.filter((i) => i.pregnancySafe === "avoid").length;
    if (unsafeCount > 0) {
      const pts = -(unsafeCount * 25);
      breakdown.push({ label: "Pregnancy-unsafe ingredients", points: pts, reason: `${unsafeCount} ingredient${unsafeCount > 1 ? "s" : ""} (e.g. retinoids, high-dose BHA) are clinically advised against in pregnancy.` });
      score += pts;
    }
  }

  // Contact allergens for sensitive skin
  const allergens = ings.filter((i) => i.tags.includes("allergen"));
  if (allergens.length > 0 && isSensitive) {
    const pts = -(allergens.length * 8);
    breakdown.push({ label: "Allergens (sensitive skin conflict)", points: pts, reason: `${allergens.length} EU-declarable contact allergen${allergens.length > 1 ? "s" : ""} — elevated risk for sensitive or rosacea-prone skin.` });
    score += pts;
  } else if (allergens.length > 0) {
    breakdown.push({ label: "EU-declarable allergens (informational)", points: -2, reason: `${allergens.length} fragrance allergen${allergens.length > 1 ? "s" : ""} present — low risk for non-sensitive skin at cosmetic concentrations.` });
    score -= 2;
  }

  // High comedogenicity for acne-prone
  const highComedo = ings.filter((i) => (i.comedogenicity ?? 0) >= 4 || i.tags.includes("comedogenic"));
  if (highComedo.length > 0 && isAcneProne) {
    const pts = -(highComedo.length * 10);
    breakdown.push({ label: "Highly comedogenic (acne conflict)", points: pts, reason: `${highComedo.length} ingredient${highComedo.length > 1 ? "s" : ""} score 4–5/5 on the comedogenicity scale — a meaningful risk for acne-prone skin.` });
    score += pts;
  } else if (highComedo.length > 0) {
    const pts = -(highComedo.length * 3);
    breakdown.push({ label: "Comedogenic ingredients", points: pts, reason: `${highComedo.length} high-comedogenicity ingredient${highComedo.length > 1 ? "s" : ""} — only relevant if you are acne-prone.` });
    score += pts;
  }

  // Mild comedogenicity (3/5) for acne-prone
  const mildComedo = ings.filter((i) => (i.comedogenicity ?? 0) === 3);
  if (mildComedo.length > 0 && isAcneProne) {
    const pts = -(mildComedo.length * 4);
    breakdown.push({ label: "Borderline comedogenic", points: pts, reason: `${mildComedo.length} ingredient${mildComedo.length > 1 ? "s" : ""} score 3/5 — borderline for acne-prone skin; monitor your skin.` });
    score += pts;
  }

  // Drying alcohol for dry/sensitive skin
  const dryingAlcohol = ings.filter((i) => i.tags.includes("drying-alcohol"));
  if (dryingAlcohol.length > 0 && (isDry || isSensitive)) {
    breakdown.push({ label: "Drying alcohol (barrier concern)", points: -8, reason: "Volatile alcohol can impair the skin barrier with repeated use on dry or sensitive skin." });
    score -= 8;
  }

  // Fungal acne triggers
  if (concerns.has("fungal-acne")) {
    const fungal = ings.filter((i) => i.tags.includes("fungal-acne-trigger") || i.tags.includes("oil"));
    if (fungal.length > 0) {
      const pts = -(fungal.length * 5);
      breakdown.push({ label: "Malassezia triggers (fungal acne)", points: pts, reason: `${fungal.length} oil or fatty acid ingredient${fungal.length > 1 ? "s" : ""} that can feed malassezia yeast.` });
      score += pts;
    }
  }

  // Avoid-rated ingredients in formula
  const avoidRated = ings.filter((i) => i.rating === "avoid");
  if (avoidRated.length > 0) {
    const pts = -(avoidRated.length * 6);
    breakdown.push({ label: "Avoid-rated ingredients", points: pts, reason: `${avoidRated.length} ingredient${avoidRated.length > 1 ? "s" : ""} in our database rated Avoid based on safety data.` });
    score += pts;
  }

  // Clamp score
  score = Math.max(0, Math.min(100, Math.round(score)));

  // ── Personalised recommendation ──
  const skinTypeLabel = {
    normal: "normal skin",
    dry: "dry skin",
    oily: "oily skin",
    combination: "combination skin",
    sensitive: "sensitive skin",
  }[profile.skinType] ?? profile.skinType;

  let recommendation: string;

  if (score >= 80) {
    if (isAcneProne && highComedo.length === 0) {
      recommendation = `For your ${skinTypeLabel}, this formula is a strong match — no high-comedogenicity ingredients and solid hydrating agents. Use it as part of your routine without concern.`;
    } else if (isDry && barrierIngredients.length > 0) {
      recommendation = `For your ${skinTypeLabel}, this formula is well-suited — it contains barrier-repair and hydrating ingredients that directly address dryness. Use morning or evening.`;
    } else {
      recommendation = `For your ${skinTypeLabel}, this formula scores well. The ingredient profile is clean and appropriate. No significant red flags for your skin type.`;
    }
  } else if (score >= 60) {
    if (isAcneProne && highComedo.length > 0) {
      recommendation = `For your ${skinTypeLabel}, this formula is usable but worth monitoring. Introduce it slowly — apply to a small area first and check for new breakouts after 2–3 weeks before committing to daily use.`;
    } else if (isSensitive && allergens.length > 0) {
      recommendation = `For your ${skinTypeLabel}, patch test on the inner arm for 48 hours before applying to the face. The fragrance allergens present are a potential trigger — if you have reacted to fragrance before, consider a fragrance-free alternative.`;
    } else if (isDry && dryingAlcohol.length > 0) {
      recommendation = `For your ${skinTypeLabel}, this formula is acceptable but the drying alcohol may cause tightness. Follow with a heavier moisturiser and limit to once daily. If you notice increased flakiness, switch to an alcohol-free version.`;
    } else {
      recommendation = `For your ${skinTypeLabel}, this formula is generally suitable. The moderate score reflects a few minor ingredient concerns — nothing that should stop you using it, but worth patch testing first.`;
    }
  } else {
    if (isPregnant) {
      recommendation = `For your ${skinTypeLabel} during pregnancy, we recommend avoiding this formula until you have spoken with your OB/GYN. There are excellent pregnancy-safe alternatives available for most product categories.`;
    } else if (isAcneProne) {
      recommendation = `For your ${skinTypeLabel}, this formula has too many high-comedogenicity ingredients to recommend without significant caveats. Look for products labelled "non-comedogenic" or with a simpler oil-free base. Products with niacinamide, salicylic acid, or azelaic acid would be better alternatives.`;
    } else if (isSensitive) {
      recommendation = `For your ${skinTypeLabel}, this formula is likely to cause irritation due to the allergen and/or fragrance load. A fragrance-free, minimal-ingredient formula (fewer than 15 ingredients) will give the same function with far less irritant risk.`;
    } else {
      recommendation = `For your ${skinTypeLabel}, this formula scores low due to multiple ingredients that conflict with your skin profile. We recommend looking for an alternative better matched to your concerns.`;
    }
  }

  return { score, scoreBreakdown: breakdown, recommendation };
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

