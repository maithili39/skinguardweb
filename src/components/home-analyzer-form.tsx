"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SKIN_TYPES,
  CONCERNS,
  type SkinType,
  type Concern,
} from "@/lib/profile";

type Tab = "paste" | "photo" | "barcode";

const HANDOFF_KEY = "skinguard:analyze-handoff";

export default function HomeAnalyzerForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("paste");
  const [skinType, setSkinType] = useState<SkinType>("normal");
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [text, setText] = useState("");

  function toggleConcern(id: Concern) {
    setConcerns((prev) => {
      if (id === "none") return prev.includes("none") ? [] : ["none"];
      const withoutNone = prev.filter((c) => c !== "none");
      return withoutNone.includes(id)
        ? withoutNone.filter((c) => c !== id)
        : [...withoutNone, id];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Hand off the profile (and any pasted text) to the full analyzer page.
    try {
      sessionStorage.setItem(
        HANDOFF_KEY,
        JSON.stringify({ skinType, concerns, text, tab }),
      );
    } catch {
      // sessionStorage may be unavailable (private mode); the analyzer page
      // simply starts blank in that case.
    }
    router.push("/analyze");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-border bg-card-bg p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-green-primary">
          Free Analysis
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold text-text-dark">
          Analyze your skincare
        </h2>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Set your skin profile, then paste or upload an ingredient list for an
          instant, science-backed analysis.
        </p>
      </div>

      <fieldset className="mb-5">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#7a7269" }}>
          Skin Type (Choose One)
        </legend>
        <div className="flex flex-wrap gap-2">
          {SKIN_TYPES.map((t) => (
            <label
              key={t.id}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
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
              {skinType === t.id && <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-dark" />}
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Concerns */}
      <fieldset className="mb-6">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "#7a7269" }}>
          Skin Concerns &amp; Conditions (Select All That Apply)
        </legend>
        <div className="flex flex-wrap gap-2">
          {CONCERNS.map((c) => {
            const active = concerns.includes(c.id);
            return (
              <label
                key={c.id}
                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-green-primary bg-green-light text-green-dark"
                    : "border-border bg-white text-text-body hover:border-green-mid"
                }`}
              >
                <input
                  type="checkbox"
                  name="concerns"
                  value={c.id}
                  checked={active}
                  onChange={() => toggleConcern(c.id)}
                  className="sr-only"
                />
                {active && <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c.id === 'acne' ? '#d44c4c' : '#5b6e55' }} />}
                {c.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Input tabs — reference style: border-b underline, active = dark green pill */}
      <div className="mb-4 flex gap-1 border-b" style={{ borderColor: "#e0dbd2" }}>
        {(
          [
            ["paste", "Paste List", <svg key="paste" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M6 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="14" y2="16"/></svg>],
            ["photo", "Photo / OCR", <svg key="photo" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>],
            ["barcode", "Barcode", <svg key="barcode" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14"/><rect x="1" y="3" width="22" height="18" rx="2"/></svg>],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === id
                ? "rounded-t-lg text-white"
                : "text-text-muted hover:text-text-dark"
            }`}
            style={tab === id ? { backgroundColor: "#4a5d44" } : {}}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {tab === "paste" && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Aqua, Glycerin, Niacinamide, Sodium Hyaluronate, Phenoxyethanol…"
          className="w-full resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm text-text-dark outline-none placeholder:text-text-light focus:border-green-primary"
        />
      )}

      {tab === "photo" && (
        <div className="rounded-xl border border-dashed border-border-dark bg-bg-section/50 px-4 py-8 text-center text-sm text-text-muted">
          Snap or upload a photo of the ingredient label — we&apos;ll read it
          right in your browser.
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 font-medium text-green-primary">
              Continue to open the scanner
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>
      )}

      {tab === "barcode" && (
        <div className="rounded-xl border border-dashed border-border-dark bg-bg-section/50 px-4 py-8 text-center text-sm text-text-muted">
          <span className="inline-flex items-center gap-1 font-medium text-text-body">Scan barcode on the full analyzer <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></span>
          <p className="mt-1 text-xs">Point your camera at any product barcode to look up its ingredients automatically.</p>
        </div>
      )}

      <button
        type="submit"
        className="mt-5 w-full rounded-full bg-green-btn px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover"
      >
        Analyze Ingredients
      </button>
    </form>
  );
}

export { HANDOFF_KEY };
export const AUTH_PENDING_KEY = "skinguard:analyze-pending";
