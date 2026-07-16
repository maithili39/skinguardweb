"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  SKIN_TYPES,
  CONCERNS,
  type SkinType,
  type Concern,
  type SkinProfile,
} from "@/lib/profile";
import { HANDOFF_KEY, AUTH_PENDING_KEY } from "@/components/home-analyzer-form";
import AnalysisResults from "@/components/analysis-results";
import OcrPanel from "@/components/ocr-panel";
import BarcodeScanner from "@/components/barcode-scanner";
import type { AnalysisReport } from "@/lib/types";

type Tab = "paste" | "photo" | "barcode";

type InitialState = {
  skinType: SkinType;
  concerns: Concern[];
  text: string;
  tab: Tab;
  // Set when returning from a login redirect — triggers an auto-run.
  pendingRun: { text: string; profile: SkinProfile } | null;
};

// Read the ?inci= param, post-login pending state, or homepage handoff once,
// at first render, so state can be initialised directly instead of via effects.
function readInitialState(inciParam: string | null): InitialState {
  const init: InitialState = {
    skinType: "normal",
    concerns: [],
    text: "",
    tab: "paste",
    pendingRun: null,
  };

  if (inciParam) {
    init.text = decodeURIComponent(inciParam);
    return init;
  }
  if (typeof window === "undefined") return init;

  // Restore pending state saved before auth redirect
  const pendingRaw = sessionStorage.getItem(AUTH_PENDING_KEY);
  if (pendingRaw) {
    sessionStorage.removeItem(AUTH_PENDING_KEY);
    try {
      const data = JSON.parse(pendingRaw) as {
        skinType?: SkinType;
        concerns?: Concern[];
        text?: string;
      };
      if (data.skinType) init.skinType = data.skinType;
      if (Array.isArray(data.concerns)) init.concerns = data.concerns;
      if (data.text) {
        init.text = data.text;
        init.pendingRun = {
          text: data.text,
          profile: { skinType: init.skinType, concerns: init.concerns },
        };
      }
    } catch {
      // ignore malformed state
    }
    return init;
  }

  try {
    const raw = sessionStorage.getItem(HANDOFF_KEY);
    if (!raw) return init;
    sessionStorage.removeItem(HANDOFF_KEY);
    const data = JSON.parse(raw) as {
      skinType?: SkinType;
      concerns?: Concern[];
      text?: string;
      tab?: string;
    };
    if (data.skinType) init.skinType = data.skinType;
    if (Array.isArray(data.concerns)) init.concerns = data.concerns;
    if (data.text) init.text = data.text;
    if (data.tab === "photo") init.tab = "photo";
  } catch {
    // ignore malformed handoff
  }
  return init;
}

const SAMPLE =
  "Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Dimethicone, Cetearyl Alcohol, Phenoxyethanol, Tocopherol, Parfum, Limonene";

export default function AnalyzeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // Initial values come from ?inci=, post-login pending state, or the
  // homepage handoff — read once via a lazy initializer (no effects needed).
  const [init] = useState<InitialState>(() =>
    readInitialState(searchParams.get("inci")),
  );
  const [skinType, setSkinType] = useState<SkinType>(init.skinType);
  const [concerns, setConcerns] = useState<Concern[]>(init.concerns);
  const [tab, setTab] = useState<Tab>(init.tab);
  const [text, setText] = useState(init.text);
  const [productLabel, setProductLabel] = useState("");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleConcern(id: Concern) {
    setConcerns((prev) => {
      if (id === "none") return prev.includes("none") ? [] : ["none"];
      const withoutNone = prev.filter((c) => c !== "none");
      return withoutNone.includes(id)
        ? withoutNone.filter((c) => c !== id)
        : [...withoutNone, id];
    });
  }

  const runAnalysisWithProfile = useCallback(
    async (inputText: string, profile: SkinProfile) => {
      const trimmed = inputText.trim();
      if (!trimmed) return;
      setLoading(true);
      setError(null);
      setReport(null);
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: trimmed, profile, label: productLabel || undefined }),
        });
        const data = await res.json();
        if (res.status === 401) {
          // Save state and redirect to login
          sessionStorage.setItem(
            AUTH_PENDING_KEY,
            JSON.stringify({ skinType: profile.skinType, concerns: profile.concerns, text: trimmed }),
          );
          router.push("/login?next=/analyze");
          return;
        }
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
    [router, productLabel],
  );

  // Auto-run an analysis restored after the login redirect (runs once).
  const autoRanRef = useRef(false);
  useEffect(() => {
    if (init.pendingRun && !autoRanRef.current) {
      autoRanRef.current = true;
      runAnalysisWithProfile(init.pendingRun.text, init.pendingRun.profile);
    }
  }, [init.pendingRun, runAnalysisWithProfile]);

  const runAnalysis = useCallback(
    async (inputText: string) => {
      const trimmed = inputText.trim();
      if (!trimmed) {
        setError("Paste or scan an ingredient list first.");
        setReport(null);
        return;
      }
      await runAnalysisWithProfile(trimmed, { skinType, concerns });
    },
    [skinType, concerns, runAnalysisWithProfile],
  );

  function startNewAnalysis() {
    setReport(null);
    setError(null);
    setText("");
    setProductLabel("");
    setTab("paste");
  }

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
            onIngredients={(inci, name) => {
              setText(inci);
              if (name) setProductLabel(name);
              setTab("paste");
            }}
          />
        )}
      </section>

      {!report && (
        <button
          type="button"
          onClick={() => runAnalysis(text)}
          disabled={loading}
          className="w-full rounded-full bg-green-btn px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover disabled:opacity-60"
        >
          {loading ? "Analyzing…" : "Analyze Ingredients"}
        </button>
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-risk-bad-bg px-4 py-3 text-sm text-risk-bad">
          {error}
        </p>
      )}

      {report && (
        <>
          <button
            type="button"
            onClick={startNewAnalysis}
            className="w-full rounded-full border border-green-primary px-6 py-3.5 text-sm font-semibold text-green-primary transition-colors hover:bg-green-light"
          >
            New Analysis
          </button>
          <div className="mt-10">
            <AnalysisResults report={report} />
          </div>
        </>
      )}
    </div>
  );
}
