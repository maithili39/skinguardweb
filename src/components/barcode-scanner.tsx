"use client";

import { useEffect, useRef, useState } from "react";

interface BarcodeScannerProps {
  onIngredients: (inci: string, productName: string) => void;
}

interface OBFProduct {
  product_name?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
}

interface OBFResponse {
  status: number;
  product?: OBFProduct;
}

type Phase = "idle" | "scanning" | "looking-up" | "found" | "not-found" | "error" | "no-camera";

export default function BarcodeScanner({ onIngredients }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  function stopCamera() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function startScanning() {
    setPhase("scanning");
    setMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();

      if (!videoRef.current) return;

      const controls = await reader.decodeFromVideoElement(videoRef.current, async (result, err) => {
        if (result) {
          controls.stop();
          stopCamera();
          await lookupBarcode(result.getText());
        } else if (err) {
          // NotFoundException fires on every frame with no barcode — that is normal
          if (!err.message?.includes("No MultiFormat")) {
            console.error(err);
          }
        }
      });

      controlsRef.current = controls;
    } catch (e: unknown) {
      stopCamera();
      if (e instanceof Error && e.name === "NotAllowedError") {
        setPhase("no-camera");
        setMessage("Camera access denied. Please allow camera access in your browser settings.");
      } else {
        setPhase("error");
        setMessage("Could not start the camera. Try uploading an image with Photo / OCR instead.");
      }
    }
  }

  async function lookupBarcode(barcode: string) {
    setPhase("looking-up");
    setMessage(`Barcode detected: ${barcode}`);

    try {
      const res = await fetch(
        `https://world.openbeautyfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) throw new Error("API error");
      const data = (await res.json()) as OBFResponse;

      if (data.status !== 1 || !data.product) {
        setPhase("not-found");
        setMessage(`No product found for barcode ${barcode}. Try scanning another product or use Photo / OCR.`);
        return;
      }

      const p = data.product;
      const inci = (p.ingredients_text_en ?? p.ingredients_text ?? "").trim();
      const name = (p.product_name ?? "").trim();

      if (!inci) {
        setPhase("not-found");
        setMessage("Product found but ingredient list is not available in the database. Try Photo / OCR.");
        return;
      }

      setProductName(name);
      setIngredients(inci);
      setPhase("found");
    } catch {
      setPhase("error");
      setMessage("Could not reach the product database. Check your connection and try again.");
    }
  }

  function reset() {
    stopCamera();
    setPhase("idle");
    setMessage(null);
    setProductName("");
    setIngredients("");
  }

  return (
    <div>
      {phase === "idle" && (
        <button
          type="button"
          onClick={startScanning}
          className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border-dark bg-bg-section/50 px-4 py-10 text-center text-sm text-text-muted transition-colors hover:border-green-mid"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 5a2 2 0 0 1 2-2h1v2H5v1H3V5Z" /><path d="M21 5a2 2 0 0 0-2-2h-1v2h1v1h2V5Z" />
            <path d="M3 19a2 2 0 0 0 2 2h1v-2H5v-1H3v1Z" /><path d="M21 19a2 2 0 0 1-2 2h-1v-2h1v-1h2v1Z" />
            <line x1="7" y1="7" x2="7" y2="17" /><line x1="10" y1="7" x2="10" y2="17" />
            <line x1="13" y1="7" x2="13" y2="17" /><line x1="17" y1="7" x2="17" y2="17" />
          </svg>
          <span className="font-medium text-text-body">Scan product barcode</span>
          <span className="text-xs">Point your camera at the barcode — we look up ingredients automatically</span>
        </button>
      )}

      {phase === "scanning" && (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-border bg-black">
              <video ref={videoRef} className="w-full" playsInline muted />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-56 rounded border-2 border-green-primary opacity-70" />
            </div>
          </div>
          <p className="text-center text-sm text-text-muted">Hold the barcode inside the green frame</p>
          <button type="button" onClick={reset} className="w-full rounded-full border border-border px-4 py-2 text-sm font-medium text-text-body hover:border-green-mid">
            Cancel
          </button>
        </div>
      )}

      {phase === "looking-up" && (
        <div className="rounded-xl border border-border bg-bg-section p-6 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-green-primary border-t-transparent" />
          <p className="text-sm text-text-body">{message}</p>
          <p className="mt-1 text-xs text-text-muted">Looking up ingredients…</p>
        </div>
      )}

      {phase === "found" && (
        <div className="space-y-3">
          {productName && (
            <p className="text-sm font-semibold text-text-dark">{productName}</p>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-text-dark">
              Ingredients — edit to fix any errors
            </label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={5}
              className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none focus:border-green-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onIngredients(ingredients, productName)}
              disabled={!ingredients.trim()}
              className="rounded-full bg-green-btn px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover disabled:opacity-60"
            >
              Analyze these ingredients
            </button>
            <button type="button" onClick={reset} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-body hover:border-green-mid">
              Scan another
            </button>
          </div>
        </div>
      )}

      {(phase === "not-found" || phase === "error" || phase === "no-camera") && (
        <div className="space-y-3">
          <p className="rounded-xl bg-risk-moderate-bg px-4 py-3 text-sm text-risk-moderate">
            {message}
          </p>
          <button type="button" onClick={reset} className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text-body hover:border-green-mid">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
