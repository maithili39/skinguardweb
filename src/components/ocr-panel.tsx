"use client";

import { useRef, useState } from "react";

interface ExpiryInfo {
  label: string;
  isExpired: boolean;
  isNearExpiry: boolean;
  source: "explicit" | "mfg+pao" | "mfg_only";
  mfgDate?: string;
  paoMonths?: number;
}

interface OcrPanelProps {
  onExtracted: (text: string) => void;
}

export default function OcrPanel({ onExtracted }: OcrPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<ExpiryInfo | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Please choose an image file.");
      return;
    }
    setStatus("working");
    setMessage(null);
    setExtracted("");
    setExpiry(null);

    const url = URL.createObjectURL(file);
    setPreview(url);

    try {
      const { base64, mimeType } = await fileToBase64(file);

      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });

      const data = await res.json() as { text?: string; expiry?: ExpiryInfo; error?: string };

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "OCR failed");
      }

      const text = (data.text ?? "").trim();
      setExtracted(text);
      setExpiry(data.expiry ?? null);
      setStatus("done");

      if (!text) {
        setMessage("No text found. Try a clearer, well-lit photo of just the ingredient list.");
      }
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "OCR failed. Try another image or paste the list manually.");
    }
  }

  function reset() {
    setStatus("idle");
    setPreview(null);
    setExtracted("");
    setMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {status === "idle" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border-dark bg-bg-section/50 px-4 py-8 text-center text-sm text-text-muted transition-colors hover:border-green-mid"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <span className="font-medium text-text-body">Take or upload a photo</span>
            <span className="text-xs">Powered by Gemini AI Vision</span>
          </button>

          {/* Tips */}
          <div className="rounded-xl border border-border bg-bg-section px-4 py-3">
            <p className="mb-2 text-xs font-semibold text-text-dark">For best results:</p>
            <ul className="space-y-1 text-xs text-text-muted">
              <li>📸 Photograph <strong>only the ingredient list</strong>, not the whole bottle</li>
              <li>💡 Good lighting, flat surface, text in focus</li>
              <li>✂️ Crop out logos, brand names, and marketing text</li>
              <li>📝 You can edit the result before analyzing</li>
            </ul>
          </div>
        </div>
      )}

      {status === "working" && (
        <div className="rounded-xl border border-border bg-bg-section p-6 text-center">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Label preview" className="mb-4 max-h-40 w-full rounded-lg object-contain" />
          )}
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-green-primary border-t-transparent" />
          <p className="text-sm text-text-body">Reading ingredient list…</p>
          <p className="mt-1 text-xs text-text-muted">Gemini AI Vision is processing your image</p>
        </div>
      )}

      {status === "done" && (
        <div className="space-y-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Label preview" className="max-h-36 w-full rounded-xl border border-border object-contain" />
          )}
          {expiry && <ExpiryBanner expiry={expiry} />}
          {message && (
            <p className="rounded-xl bg-risk-moderate-bg px-4 py-2 text-sm text-risk-moderate">{message}</p>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-dark">
              Extracted text — edit to fix any misreads
            </label>
            <textarea
              value={extracted}
              onChange={(e) => setExtracted(e.target.value)}
              rows={6}
              className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none focus:border-green-primary"
              placeholder="Ingredient list will appear here…"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onExtracted(extracted)}
              disabled={!extracted.trim()}
              className="rounded-full bg-green-btn px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover disabled:opacity-60"
            >
              Use this text
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-body hover:border-green-mid"
            >
              Try another photo
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-3">
          <p className="rounded-xl bg-risk-bad-bg px-4 py-3 text-sm text-risk-bad">{message}</p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-body hover:border-green-mid"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function ExpiryBanner({ expiry }: { expiry: ExpiryInfo }) {
  if (expiry.source === "mfg_only") {
    return (
      <div className="rounded-xl bg-bg-section px-4 py-2.5 text-sm text-text-muted">
        Manufactured: {expiry.mfgDate} — no expiry date found on label.
      </div>
    );
  }

  const sourceNote = expiry.source === "mfg+pao"
    ? ` (manufactured ${expiry.mfgDate}, best within ${expiry.paoMonths} months)`
    : "";

  if (expiry.isExpired) {
    return (
      <div className="rounded-xl bg-risk-bad-bg px-4 py-2.5 text-sm font-medium text-risk-bad">
        Expired — best before {expiry.label}{sourceNote}. Do not use this product.
      </div>
    );
  }
  if (expiry.isNearExpiry) {
    return (
      <div className="rounded-xl bg-risk-moderate-bg px-4 py-2.5 text-sm font-medium text-risk-moderate">
        Expiring soon — best before {expiry.label}{sourceNote}. Use it up soon.
      </div>
    );
  }
  return (
    <div className="rounded-xl bg-risk-good-bg px-4 py-2.5 text-sm font-medium text-risk-good">
      Not expired — best before {expiry.label}{sourceNote}.
    </div>
  );
}

function fileToBase64(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 2048;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      resolve({ base64: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    img.onerror = reject;
    img.src = url;
  });
}
