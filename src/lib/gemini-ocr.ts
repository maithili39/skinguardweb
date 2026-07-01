import "server-only";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export interface GeminiExpiry {
  label: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  source: "explicit" | "mfg+pao" | "mfg_only";
  mfgDate?: string;
  paoMonths?: number;
}

export interface GeminiOcrResult {
  ingredients: string;          // clean comma-separated INCI list
  expiry: GeminiExpiry | null;
}

/**
 * Take raw OCR text from a product photo (which may contain marketing copy,
 * usage directions, warnings, weights, dates, etc.) and use Gemini to return
 * ONLY the ingredient list — correctly split, OCR typos fixed, normalised to
 * standard INCI names — plus any expiry / manufacturing date info.
 *
 * Returns null if GEMINI_API_KEY is not configured or the call fails, so the
 * caller can fall back to the regex-based extractor.
 */
export async function cleanWithGemini(rawText: string): Promise<GeminiOcrResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !rawText.trim()) return null;

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `You are an expert cosmetic-label parser. Below is raw OCR text scanned from a skincare/cosmetic product photo. It may contain marketing claims, "how to use" directions, warnings, storage info, weights, barcodes, prices, and dates mixed in with the actual ingredient list.

Your job:
1. Extract ONLY the ingredient list (the INCI list). Ignore everything else — instructions, warnings, marketing, "safety information", weights, URLs.
2. Correct obvious OCR errors in ingredient names to their proper INCI spelling (e.g. "Edhylhexylglycerin" -> "Ethylhexylglycerin", "Vitamin-812" -> "Niacinamide only if clearly B3, else keep chemical name", "Glycrhiza Glabra" -> "Glycyrrhiza Glabra"). Do NOT invent ingredients that aren't there.
3. Split ingredients correctly even if the OCR used periods instead of commas, or ran two ingredients together with only a space (e.g. "Carbomer Polysorbate-20" is TWO ingredients: "Carbomer" and "Polysorbate-20").
4. Keep any concentration/percentage that is explicitly printed next to an ingredient (e.g. "Niacinamide 10%").
5. Detect expiry / manufacturing info if present. Today's date is ${today}.

Return STRICT JSON only (no markdown, no commentary) in exactly this shape:
{
  "ingredients": ["Ingredient One", "Ingredient Two", ...],
  "expiry": {
    "label": "MM/YYYY or the printed date string",
    "isExpired": true/false,
    "isNearExpiry": true/false,     // expires within 3 months of today
    "source": "explicit" | "mfg+pao" | "mfg_only",
    "mfgDate": "printed mfg date if any",
    "paoMonths": number of months after opening/manufacture if stated
  } | null
}

If no ingredients are found, return {"ingredients": [], "expiry": null}.
If no expiry/mfg info is found, set "expiry" to null.

RAW OCR TEXT:
"""
${rawText}
"""`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      console.error("Gemini cleanup error:", res.status, await res.text());
      return null;
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text) as {
      ingredients?: string[];
      expiry?: GeminiExpiry | null;
    };

    const ingredients = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.map((s) => String(s).trim()).filter(Boolean)
      : [];

    if (ingredients.length === 0) return null;

    return {
      ingredients: ingredients.join(", "),
      expiry: parsed.expiry ?? null,
    };
  } catch (err) {
    console.error("Gemini cleanup failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
