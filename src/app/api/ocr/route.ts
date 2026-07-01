import { NextResponse, type NextRequest } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { z } from "zod";

const schema = z.object({
  imageBase64: z.string().min(100),
});

async function getAccessToken(): Promise<string> {
  const raw = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!raw) throw new Error("GOOGLE_CREDENTIALS_JSON not set");

  const creds = JSON.parse(raw) as {
    client_email: string;
    private_key: string;
  };

  // Build a JWT to exchange for an access token
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: creds.client_email,
      scope: "https://www.googleapis.com/auth/cloud-vision",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  ).toString("base64url");

  const { createSign } = await import("node:crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(creds.private_key, "base64url");
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`Token error: ${data.error}`);
  return data.access_token;
}

/**
 * Try to extract just the ingredient list from raw OCR output.
 * Product packaging has lots of noise (brand names, marketing copy, legal text).
 * We look for common ingredient-list headers and extract from there.
 */
function extractIngredientSection(raw: string): string {
  if (!raw) return raw;

  // Common ingredient list header patterns (multilingual)
  const headers = [
    /ingr[eé]dients?\s*[:：]/i,
    /inci\s*[:：]/i,
    /composition\s*[:：]/i,
    /contains?\s*[:：]/i,
    /inhalts?stoffe\s*[:：]/i,   // German
    /ingredientes\s*[:：]/i,     // Spanish/Portuguese
    /ingrédients\s*[:：]/i,      // French
    /составdisabled\s*[:：]/i,
  ];

  for (const pattern of headers) {
    const match = raw.search(pattern);
    if (match !== -1) {
      // Find where the header word starts, grab from the colon onward
      const colonAt = raw.indexOf(":", match);
      if (colonAt !== -1) {
        const section = raw.slice(colonAt + 1).trim();
        // Stop at common end-markers: warnings, claims, net weight, legal text, certifications
        const endPattern = /\b(warning|caution|keep out|for external use|avoid contact|discontinue|net weight|net wt|manufactured|distributed|batch|lot no|exp\b|best before|made in|cruelty.free|paraben.free|vegan|dermatologist|allergy.tested|hypoallergenic|fragrance.free|sulfate.free|www\.|©|\d{2}\/\d{4}|\d{2}\/\d{2}\/\d{4}|\d{3}g|\d+\s*ml\b|\d+\s*oz\b)/i;
        const endMatch = section.search(endPattern);
        const extracted = endMatch !== -1 ? section.slice(0, endMatch).trim() : section;
        if (extracted.length > 20) return normalizeIngredientLines(extracted);
      }
    }
  }

  // No header found — return the raw text so the user can edit it
  return normalizeIngredientLines(raw);
}

/**
 * Normalize OCR ingredient text: join wrapped lines, clean up spacing.
 * Ingredient labels always use commas as delimiters — newlines are just
 * OCR wrapping artifacts from curved/small packaging surfaces.
 */
function normalizeIngredientLines(text: string): string {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ")                        // flatten all lines into one string
    .replace(/\s*,\s*/g, ", ")        // normalise comma spacing
    .replace(/\s{2,}/g, " ")          // collapse double spaces
    .trim();
}

export const POST = withLogger(async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "imageBase64 required." }, { status: 422 });
  }

  try {
    if (!process.env.GOOGLE_CREDENTIALS_JSON) {
      return NextResponse.json({ error: "OCR is not configured. GOOGLE_CREDENTIALS_JSON is missing." }, { status: 503 });
    }
    const token = await getAccessToken();

    const res = await fetch(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: parsed.data.imageBase64 },
              features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
            },
          ],
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Vision API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      responses: Array<{ fullTextAnnotation?: { text: string }; error?: { message: string } }>;
    };

    const response = data.responses[0];
    if (response?.error) throw new Error(response.error.message);

    const raw = response?.fullTextAnnotation?.text ?? "";
    const text = extractIngredientSection(raw);
    return NextResponse.json({ text, raw: text !== raw ? raw : undefined });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("OCR error:", msg);
    return NextResponse.json({ error: `OCR failed: ${msg}` }, { status: 500 });
  }
});
