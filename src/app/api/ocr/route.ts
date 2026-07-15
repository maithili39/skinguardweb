import { NextResponse, type NextRequest } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { extractWithGeminiVision, cleanWithGemini } from "@/lib/gemini-ocr";
import { checkRateLimit, getRequestIp } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { z } from "zod";

const schema = z.object({
  imageBase64: z.string().min(100),
  mimeType: z.string().optional(),
});

// ── Colon is optional — many labels write "Ingredients Sodium Palmate…" without a colon ──
const INGREDIENT_HEADERS = [
  /ingr[eé]dients?\s*[:：]?\s*/i,
  /inci\s*[:：]\s*/i,
  /composition\s*[:：]\s*/i,
  /contains?\s*[:：]\s*/i,
  /inhalts?stoffe\s*[:：]\s*/i,
  /ingredientes\s*[:：]?\s*/i,
  /ingrédients\s*[:：]?\s*/i,
];

// Patterns that signal the end of an ingredient list
const END_PATTERN =
  /\b(warning|caution|keep out|for external use|avoid contact|discontinue|net weight|net wt|how to use|directions|manufactured|distributed|batch|lot no|best before|made in|cruelty.free|paraben.free|vegan|dermatologist|allergy.tested|hypoallergenic|fragrance.free|sulfate.free|safety information|store in|storage|precautions?|for more information|www\.|©|\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{4}|\d{1,3}\s*g\b|\d+\s*ml\b|\d+\s*oz\b)/i;

const EXPIRY_DATE_PATTERNS = [
  /(?:exp(?:iry|iration)?|best before|use before|bb)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{2,4})/i,
  /(?:exp(?:iry|iration)?|best before|use before|bb)\s*[:\-]?\s*(\d{4}[\/\-]\d{1,2})/i,
];

const MFG_DATE_PATTERNS = [
  /(?:mfg|mfd|dom|date of (?:manufacture|mfg)|manufactured(?:\s+on)?|production date)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{2,4})/i,
  /(?:mfg|mfd|dom|date of (?:manufacture|mfg)|manufactured(?:\s+on)?)\s*[:\-]?\s*(\d{4}[\/\-]\d{1,2})/i,
];

const PAO_PATTERNS = [
  /use within\s+(\d+)\s*months?/i,
  /best (?:used|before)\s+within\s+(\d+)\s*months?/i,
  /(\d+)\s*m\s+(?:after (?:opening|manufacture)|period)/i,
  /shelf life[:\s]+(\d+)\s*months?/i,
];

function parseMonthYear(
  dateStr: string,
): { month: number; year: number } | null {
  const parts = dateStr.split(/[\/\-]/);
  let month: number, year: number;
  if (parts[0].length === 4) {
    year = parseInt(parts[0]);
    month = parseInt(parts[1]);
  } else {
    month = parseInt(parts[0]);
    year = parseInt(parts[1]);
    if (year < 100) year += 2000;
  }
  if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return null;
  return { month, year };
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0);
}

interface ExpiryResult {
  label: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  source: "explicit" | "mfg+pao" | "mfg_only";
  mfgDate?: string;
  paoMonths?: number;
}

function extractExpiryInfo(raw: string): ExpiryResult | null {
  const now = new Date();
  const threeMonthsFromNow = new Date(
    now.getFullYear(),
    now.getMonth() + 3,
    now.getDate(),
  );

  for (const pattern of EXPIRY_DATE_PATTERNS) {
    const m = raw.match(pattern);
    if (m) {
      const parsed = parseMonthYear(m[1]);
      if (parsed) {
        const expiry = lastDayOfMonth(parsed.year, parsed.month);
        return {
          label: `${String(parsed.month).padStart(2, "0")}/${parsed.year}`,
          isExpired: now > expiry,
          isNearExpiry: !(now > expiry) && expiry <= threeMonthsFromNow,
          source: "explicit",
        };
      }
    }
  }

  let mfgParsed: { month: number; year: number } | null = null;
  let mfgRaw = "";
  for (const pattern of MFG_DATE_PATTERNS) {
    const m = raw.match(pattern);
    if (m) {
      mfgParsed = parseMonthYear(m[1]);
      if (mfgParsed) {
        mfgRaw = m[1];
        break;
      }
    }
  }

  let paoMonths: number | null = null;
  for (const pattern of PAO_PATTERNS) {
    const m = raw.match(pattern);
    if (m) {
      paoMonths = parseInt(m[1]);
      break;
    }
  }

  if (mfgParsed && paoMonths) {
    const expiryMonth = mfgParsed.month + paoMonths;
    const expiryYear =
      mfgParsed.year + Math.floor((expiryMonth - 1) / 12);
    const expiryMonthNorm = ((expiryMonth - 1) % 12) + 1;
    const expiry = lastDayOfMonth(expiryYear, expiryMonthNorm);
    return {
      label: `${String(expiryMonthNorm).padStart(2, "0")}/${expiryYear}`,
      isExpired: now > expiry,
      isNearExpiry: !(now > expiry) && expiry <= threeMonthsFromNow,
      source: "mfg+pao",
      mfgDate: mfgRaw,
      paoMonths,
    };
  }

  if (mfgParsed) {
    return {
      label: mfgRaw,
      isExpired: false,
      isNearExpiry: false,
      source: "mfg_only",
      mfgDate: mfgRaw,
    };
  }

  return null;
}

function extractIngredientSection(raw: string): {
  ingredients: string;
  expiry: ExpiryResult | null;
} {
  const expiry = extractExpiryInfo(raw);

  for (const pattern of INGREDIENT_HEADERS) {
    const headerMatch = raw.match(pattern);
    if (headerMatch && headerMatch.index !== undefined) {
      const contentStart = headerMatch.index + headerMatch[0].length;
      const section = raw.slice(contentStart).trim();
      const endMatch = section.search(END_PATTERN);
      const extracted =
        endMatch !== -1 ? section.slice(0, endMatch).trim() : section;
      if (extracted.length > 10) {
        return { ingredients: normalizeIngredientLines(extracted), expiry };
      }
    }
  }

  return { ingredients: normalizeIngredientLines(raw), expiry };
}

function normalizeIngredientLines(text: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const joined = lines.join(" ").replace(/\s{2,}/g, " ").trim();

  if (joined.includes(",")) {
    return joined.replace(/\s*,\s*/g, ", ");
  }

  if (/[a-zA-Z0-9\)]\.\s+[A-Z]/.test(joined)) {
    return joined
      .split(/\.\s+(?=[A-Z])/)
      .map((s) => s.replace(/\.$/, "").trim())
      .filter(Boolean)
      .join(", ");
  }

  return lines.join(", ");
}

export const POST = withLogger(async (req: NextRequest) => {
  const ip = await getRequestIp();
  if (!(await checkRateLimit(ip))) {
    logger.warn("rate_limit_hit", { ip, route: "ocr" });
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
    return NextResponse.json(
      { error: "imageBase64 required." },
      { status: 422 },
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "OCR is not configured. GEMINI_API_KEY is missing." },
      { status: 503 },
    );
  }

  try {
    const mimeType = parsed.data.mimeType ?? "image/jpeg";

    // ── Primary path: Gemini Vision reads the image directly ──────────────────
    // No Google Cloud Vision needed — Gemini multimodal handles both OCR and
    // ingredient extraction in a single free API call.
    const geminiResult = await extractWithGeminiVision(
      parsed.data.imageBase64,
      mimeType,
    );

    if (geminiResult) {
      logger.info("ocr_success", { method: "gemini_vision" });
      return NextResponse.json({
        text: geminiResult.ingredients,
        expiry: geminiResult.expiry,
      });
    }

    // ── Fallback: regex-based extraction if Gemini is unavailable ─────────────
    // This branch should rarely be reached since Gemini Vision is the primary.
    logger.warn("ocr_gemini_unavailable", { fallback: "regex" });
    const { ingredients, expiry } = extractIngredientSection("");
    return NextResponse.json({ text: ingredients, expiry });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("ocr_failed", { error: msg });
    return NextResponse.json(
      { error: "OCR failed. Please try again." },
      { status: 500 },
    );
  }
});
