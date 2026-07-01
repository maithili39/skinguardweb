"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  SKIN_TYPES,
  CONCERNS,
  type SkinType,
  type Concern,
  type SkinProfile,
} from "@/lib/profile";
import { HANDOFF_KEY } from "@/components/home-analyzer-form";
import AnalysisResults from "@/components/analysis-results";
import OcrPanel from "@/components/ocr-panel";
import BarcodeScanner from "@/components/barcode-scanner";
import type { AnalysisReport } from "@/lib/types";

type Tab = "paste" | "photo" | "barcode";

const SAMPLE =
  "Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Dimethicone, Cetearyl Alcohol, Phenoxyethanol, Tocopherol, Parfum, Limonene";

export default function AnalyzeClient() {
  const searchParams = useSearchParams();
  const [skinType, setSkinType] = useState<SkinType>("normal");
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [tab, setTab] = useState<Tab>("paste");
  const [text, setText] = useState("");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pick up the profile/text handed off from the homepage form OR from the
  // ?inci= query param (used by product pages' "Customize analysis" link).
  useEffect(() => {
    const inciParam = searchParams.get("inci");
    if (inciParam) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setText(decodeURIComponent(inciParam));
      return;
    }
    try {
      const raw = sessionStorage.getItem(HANDOFF_KEY);
      if (!raw) return;
      sessionStorage.removeItem(HANDOFF_KEY);
      const data = JSON.parse(raw) as {
        skinType?: SkinType;
        concerns?: Concern[];
        text?: string;
        tab?: string;
      };
      if (data.skinType) setSkinType(data.skinType);
      if (Array.isArray(data.concerns)) setConcerns(data.concerns);
      if (data.text) setText(data.text);
      if (data.tab === "photo") setTab("photo");
    } catch {
      // ignore malformed handoff
    }
  }, [searchParams]);

  function toggleConcern(id: Concern) {
    setConcerns((prev) => {
      if (id === "none") return prev.includes("none") ? [] : ["none"];
      const withoutNone = prev.filter((c) => c !== "none");
      return withoutNone.includes(id)
        ? withoutNone.filter((c) => c !== id)
        : [...withoutNone, id];
    });
  }

  const runAnalysis = useCallback(
    async (inputText: string) => {
      const trimmed = inputText.trim();
      if (!trimmed) {
        setError("Paste or scan an ingredient list first.");
        return;
      }
      setLoading(true);
      setError(null);
      const profile: SkinProfile = { skinType, concerns };
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, profile }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong.");
          setReport(null);
        } else {
          setReport(data as AnalysisReport);
        }
      } catch {
        setError("Network error — please try again.");
      } finally {
        setLoading(false);
      }
    },
    [skinType, concerns],
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-dark">
          Ingredient Analyzer
        </h1>
        <p className="mt-2 text-text-body">
          Set your skin profile, then paste or scan a label. We check every
          token against the EU CosIng database and our curated safety flags.
        </p>
      </header>

      {/* Profile */}
      <section className="mb-6 rounded-2xl border border-border bg-card-bg p-5">
        <fieldset className="mb-4">
          <legend className="mb-2 text-sm font-semibold text-text-dark">
            Skin Type
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SKIN_TYPES.map((t) => (
              <label
                key={t.id}
                className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-medium transition-colors ${
                  skinType === t.id
                    ? "border-green-primary bg-green-light text-green-dark"
                    : "border-border bg-white text-text-body hover:border-green-mid"
                }`}
              >
                <input
                  type="radio"
                  name="skinType"
                  value={t.id}
                  checked={skinType === t.id}
                  onChange={() => setSkinType(t.id)}
                  className="sr-only"
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text-dark">
            Concerns
          </legend>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((c) => {
              const active = concerns.includes(c.id);
              return (
                <label
                  key={c.id}
                  className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-green-primary bg-green-light text-green-dark"
                      : "border-border bg-white text-text-body hover:border-green-mid"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleConcern(c.id)}
                    className="sr-only"
                  />
                  {c.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      </section>

      {/* Input */}
      <section className="mb-6 rounded-2xl border border-border bg-card-bg p-5">
        <div className="mb-4 flex gap-1 rounded-xl bg-bg-section p-1">
          {(
            [
              ["paste", "Paste List"],
              ["photo", "Photo / OCR"],
              ["barcode", "Barcode"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === id
                  ? "bg-white text-text-dark shadow-sm"
                  : "text-text-muted hover:text-text-body"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "paste" ? (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder="Paste the full ingredient list here…"
              className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none placeholder:text-text-light focus:border-green-primary"
            />
            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setText(SAMPLE)}
                className="text-xs font-medium text-green-primary hover:underline"
              >
                Try a sample list
              </button>
              <span className="text-xs text-text-light">
                {text.length.toLocaleString()} chars
              </span>
            </div>
          </>
        ) : tab === "photo" ? (
          <OcrPanel
            onExtracted={(extracted) => {
              setText(extracted);
              setTab("paste");
            }}
          />
        ) : (
          <BarcodeScanner
            onIngredients={(inci) => {
              setText(inci);
              setTab("paste");
            }}
          />
        )}
      </section>

      <button
        type="button"
        onClick={() => runAnalysis(text)}
        disabled={loading}
        className="w-full rounded-full bg-green-btn px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover disabled:opacity-60"
      >
        {loading ? "Analyzing…" : "Analyze Ingredients"}
      </button>

      {error && (
        <p className="mt-3 rounded-xl bg-risk-bad-bg px-4 py-3 text-sm text-risk-bad">
          {error}
        </p>
      )}

      {report && (
        <div className="mt-10">
          <AnalysisResults report={report} />
        </div>
      )}
    </div>
  );
}
