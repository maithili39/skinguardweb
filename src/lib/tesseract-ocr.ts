import "server-only";
import Tesseract from "tesseract.js";

export async function extractWithTesseract(
  imageBase64: string,
): Promise<string | null> {
  try {
    // Convert base64 to data URL
    const dataUrl = `data:image/jpeg;base64,${imageBase64}`;

    const result = await Tesseract.recognize(dataUrl, "eng", {
      logger: (m) => {
        if (m.status === "recognizing") {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const text = result.data.text;
    if (!text || text.trim().length === 0) {
      return null;
    }

    return text;
  } catch (err) {
    console.error("Tesseract OCR failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
