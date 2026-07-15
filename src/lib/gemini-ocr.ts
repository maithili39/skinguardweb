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
  ingredients: string; // clean comma-separated INCI list
  expiry: GeminiExpiry | null;
}

const SHARED_JSON_SCHEMA = `Return STRICT JSON only (no markdown, no commentary) in exactly this shape:
{
  "ingredients": ["Ingredient One", "Ingredient Two", ...],
  "expiry": {
    "label": "MM/YYYY or the printed date string",
    "isExpired": true/false,
    "isNearExpiry": true/false,
    "source": "explicit" | "mfg+pao" | "mfg_only",
    "mfgDate": "printed mfg date if any",
    "paoMonths": number of months after opening/manufacture if stated
  } | null
}
If no ingredients are found, return {"ingredients": [], "expiry": null}.
If no expiry/mfg info is found, set "expiry" to null.`;

/**
 * Send a product-label image directly to Gemini Vision and extract the
 * ingredient list + expiry info in one call. No Google Cloud Vision needed.
 *
 * Returns null if GEMINI_API_KEY is not configured or the call fails.
 */
export async function extractWithGeminiVision(
  imageBase64: string,
  mimeType: string = "image/jpeg",
): Promise<GeminiOcrResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `You are an expert cosmetic-label parser. Look at this product photo carefully.

Your job:
1. Extract ONLY the ingredient list (the INCI list). Ignore everything else — instructions, warnings, marketing, "safety information", weights, URLs, barcodes, prices.
2. Correct obvious OCR/photo errors in ingredient names to their proper INCI spelling (e.g. "Edhylhexylglycerin" -> "Ethylhexylglycerin"). Do NOT invent ingredients.
3. Split ingredients correctly even if separated by periods instead of commas, or if two names run together.
4. Keep any concentration/percentage explicitly printed next to an ingredient (e.g. "Niacinamide 10%").
5. Detect expiry / manufacturing info if present. Today's date is ${today}.

${SHARED_JSON_SCHEMA}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: imageBase64 } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini vision error:", res.status, errText);
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
    console.error(
      "Gemini vision failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Take raw OCR text (from any source) and use Gemini to clean it up:
 * fix typos, extract only the ingredient list, detect expiry info.
 *
 * Returns null if GEMINI_API_KEY is not configured or the call fails.
 */
export async function cleanWithGemini(
  rawText: string,
): Promise<GeminiOcrResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !rawText.trim()) return null;

  const today = new Date().toISOString().slice(0, 10);

  const prompt = `You are an expert cosmetic-label parser. Below is raw OCR text scanned from a skincare/cosmetic product photo. It may contain marketing claims, "how to use" directions, warnings, storage info, weights, barcodes, prices, and dates mixed in with the actual ingredient list.

Your job:
1. Extract ONLY the ingredient list (the INCI list). Ignore everything else.
2. Correct obvious OCR errors in ingredient names to their proper INCI spelling. Do NOT invent ingredients.
3. Split ingredients correctly even if the OCR used periods instead of commas, or ran two ingredients together.
4. Keep any concentration/percentage explicitly printed next to an ingredient (e.g. "Niacinamide 10%").
5. Detect expiry / manufacturing info if present. Today's date is ${today}.

${SHARED_JSON_SCHEMA}

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
    console.error(
      "Gemini cleanup failed:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
