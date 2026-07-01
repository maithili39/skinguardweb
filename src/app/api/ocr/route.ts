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

    const text = response?.fullTextAnnotation?.text ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("OCR error:", err);
    return NextResponse.json({ error: "OCR processing failed." }, { status: 500 });
  }
});
