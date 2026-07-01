"use client";

import { useRef, useState } from "react";

interface OcrPanelProps {
  onExtracted: (text: string) => void;
}

export default function OcrPanel({ onExtracted }: OcrPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Please choose an image file.");
      return;
    }
    setStatus("working");
    setProgress(0);
    setMessage(null);
    setExtracted("");

    const url = URL.createObjectURL(file);
    setPreview(url);

    try {
      const processed = await preprocess(url);
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      const { PSM } = await import("tesseract.js");
      await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
      const {
        data: { text },
      } = await worker.recognize(processed);
      await worker.terminate();

      const cleaned = cleanOcrText(text);
      setExtracted(cleaned);
      setStatus("done");
      if (!cleaned) {
        setMessage(
          "Couldn't read any text. Try a sharper, well-lit photo of just the ingredients.",
        );
      }
    } catch {
      setStatus("error");
      setMessage("OCR failed. Please try another image or paste the list.");
    }
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
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border-dark bg-bg-section/50 px-4 py-10 text-center text-sm text-text-muted transition-colors hover:border-green-mid"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          <span className="font-medium text-text-body">
            Take or upload a photo of the label
          </span>
          <span className="text-xs">Processed privately in your browser</span>
        </button>
      )}

      {preview && status !== "idle" && (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Label preview"
            className="max-h-48 w-full rounded-xl border border-border object-contain"
          />

          {status === "working" && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bg-section">
                <div
                  className="h-full rounded-full bg-green-primary transition-all"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-text-muted">
                Reading label… {progress}%
              </p>
            </div>
          )}

          {status === "done" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-dark">
                Extracted text — edit to fix any misreads
              </label>
              <textarea
                value={extracted}
                onChange={(e) => setExtracted(e.target.value)}
                rows={5}
                className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none focus:border-green-primary"
              />
              <div className="mt-2 flex gap-2">
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
                  onClick={() => {
                    setStatus("idle");
                    setPreview(null);
                    setExtracted("");
                    setMessage(null);
                  }}
                  className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-body hover:border-green-mid"
                >
                  Try another photo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm text-risk-moderate">{message}</p>
      )}
    </div>
  );
}

async function preprocess(url: string): Promise<string> {
  const img = await loadImage(url);

  // Upscale to at least 1800px on the long edge — Tesseract accuracy
  // improves significantly at higher DPI.
  const scale = Math.max(1, Math.min(3, 1800 / Math.max(img.width, img.height)));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return url;

  ctx.drawImage(img, 0, 0, w, h);
  const imageData = ctx.getImageData(0, 0, w, h);
  const src = imageData.data;

  const gray = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    const p = i * 4;
    gray[i] = Math.round(0.299 * src[p] + 0.587 * src[p + 1] + 0.114 * src[p + 2]);
  }

  const radius = Math.round(Math.min(w, h) * 0.04);
  const integral = new Float64Array((w + 1) * (h + 1));
  for (let y = 1; y <= h; y++) {
    for (let x = 1; x <= w; x++) {
      integral[y * (w + 1) + x] =
        gray[(y - 1) * w + (x - 1)] +
        integral[(y - 1) * (w + 1) + x] +
        integral[y * (w + 1) + (x - 1)] -
        integral[(y - 1) * (w + 1) + (x - 1)];
    }
  }

  const T = 0.15;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x1 = Math.max(0, x - radius);
      const y1 = Math.max(0, y - radius);
      const x2 = Math.min(w - 1, x + radius);
      const y2 = Math.min(h - 1, y + radius);
      const count = (x2 - x1 + 1) * (y2 - y1 + 1);
      const sum =
        integral[(y2 + 1) * (w + 1) + (x2 + 1)] -
        integral[y1 * (w + 1) + (x2 + 1)] -
        integral[(y2 + 1) * (w + 1) + x1] +
        integral[y1 * (w + 1) + x1];
      const mean = sum / count;
      const val = gray[y * w + x] < mean * (1 - T) ? 0 : 255;
      const p = (y * w + x) * 4;
      src[p] = src[p + 1] = src[p + 2] = val;
      src[p + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function cleanOcrText(text: string): string {
  return text
    .replace(/ingredients?\s*[:：]/i, "")
    .replace(/[|]/g, "I")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}
