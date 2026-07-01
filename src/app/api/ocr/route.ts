import { NextResponse, type NextRequest } from "next/server";
import { withLogger } from "@/lib/api-handler";
import { z } from "zod";

const schema = z.object({
  imageBase64: z.string().min(100),
});

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
    // Dynamically import tesseract so it only loads when this route is hit
    const Tesseract = await import("tesseract.js");
    const { data } = await Tesseract.recognize(
      Buffer.from(parsed.data.imageBase64, "base64"),
      "eng",
      { logger: () => {} },
    );
    return NextResponse.json({ text: data.text });
  } catch (err) {
    return NextResponse.json(
      { error: "OCR processing failed." },
      { status: 500 },
    );
  }
});
