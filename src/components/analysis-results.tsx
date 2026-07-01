"use client";

import { useState } from "react";
import Link from "next/link";
import RatingBadge from "./rating-badge";
import type { AnalysisReport, AnalysisFlag, AnalyzedIngredient, Verdict } from "@/lib/types";

const VERDICT_STYLES: Record<Verdict, { border: string; bg: string; ring: string; label: string; textColor: string }> = {
  safe:    { border: "border-risk-good/30",     bg: "bg-risk-good-bg",     ring: "#43a047", label: "Recommended",       textColor: "text-risk-good" },
  caution: { border: "border-risk-moderate/30", bg: "bg-risk-moderate-bg", ring: "#f57c00", label: "Use with caution",  textColor: "text-risk-moderate" },
  avoid:   { border: "border-risk-bad/30",      bg: "bg-risk-bad-bg",      ring: "#e53935", label: "Not recommended",   textColor: "text-risk-bad" },
};

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0" aria-label={`Score: ${score} out of 100`}>
      <circle cx="48" cy="48" r={r} fill="none" stroke="#e8e4dc" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="44" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="700" fill={color}>{score}</text>
      <text x="48" y="62" textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="#8a8276">/100</text>
    </svg>
  );
}

export default function AnalysisResults({ report }: { report: AnalysisReport }) {
  const {
    ingredients, flags, highlights,
    matchedCount, totalCount,
    verdict, verdictReason,
    score, scoreBreakdown, recommendation,
  } = report;

  const vs = VERDICT_STYLES[verdict];
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showScoreDetail, setShowScoreDetail] = useState(false);

  const badFlags = flags.filter((f) => f.level === "bad");
  const moderateFlags = flags.filter((f) => f.level === "moderate");
  const goodFlags = flags.filter((f) => f.level === "good");

  return (
    <div className="space-y-4">

      {/* Score + Verdict card */}
      <div className={`rounded-2xl border p-5 ${vs.border} ${vs.bg}`}>
        <div className="flex items-start gap-5">
          <ScoreRing score={score} color={vs.ring} />
          <div className="flex-1 min-w-0">
            <span className={`text-xs font-bold uppercase tracking-wider ${vs.textColor}`}>{vs.label}</span>
            <p className="mt-1 text-sm font-medium text-text-dark leading-relaxed">{verdictReason}</p>
            <p className="mt-3 text-sm text-text-body leading-relaxed border-t border-black/5 pt-3">{recommendation}</p>
            <p className="mt-2 text-xs text-text-muted">{matchedCount} of {totalCount} ingredients identified</p>
          </div>
        </div>

        {scoreBreakdown.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowScoreDetail((v) => !v)}
              className="mt-3 flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-dark transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showScoreDetail ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
              {showScoreDetail ? "Hide score breakdown" : "How is this score calculated?"}
            </button>

            {showScoreDetail && (
              <div className="mt-3 rounded-xl border border-black/8 bg-white/60 p-4 space-y-2">
                <p className="text-xs text-text-muted mb-3">
                  Score starts at <strong>65</strong> (neutral baseline) and adjusts based on your skin profile:
                </p>
                {scoreBreakdown.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`shrink-0 w-9 text-right text-xs font-bold tabular-nums ${item.points >= 0 ? "text-risk-good" : "text-risk-bad"}`}>
                      {item.points >= 0 ? `+${item.points}` : item.points}
                    </span>
                    <p className="text-xs text-text-body">
                      <span className="font-semibold text-text-dark">{item.label}</span>
                      {" — "}{item.reason}
                    </p>
                  </div>
                ))}
                <p className="text-xs text-text-muted pt-2 border-t border-black/5">
                  Final score: <strong>{score}/100</strong> (clamped to 0–100)
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Concern flags */}
      {(badFlags.length > 0 || moderateFlags.length > 0) && (
        <div className="rounded-2xl border border-border bg-card-bg divide-y divide-border overflow-hidden">
          {[...badFlags, ...moderateFlags].map((flag, i) => (
            <FlagRow key={i} flag={flag} />
          ))}
        </div>
      )}

      {/* Positive highlights */}
      {(highlights.superstars.length > 0 || highlights.actives.length > 0 ||
        highlights.fragranceAllergens.length > 0 || highlights.comedogenic.length > 0 ||
        goodFlags.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {highlights.superstars.length > 0 && (
            <Chip tone="good" label="Superstars" items={highlights.superstars} />
          )}
          {highlights.actives.length > 0 && (
            <Chip tone="moderate" label="Actives" items={highlights.actives} />
          )}
          {highlights.fragranceAllergens.length > 0 && (
            <Chip tone="bad" label="Fragrance / allergens" items={highlights.fragranceAllergens} />
          )}
          {highlights.comedogenic.length > 0 && (
            <Chip tone="bad" label="Pore-clogging" items={highlights.comedogenic} />
          )}
          {goodFlags.map((f, i) => (
            <Chip key={i} tone="good" label={f.title} items={f.ingredientNames} />
          ))}
        </div>
      )}

      {/* Ingredient breakdown — collapsed */}
      <div className="rounded-2xl border border-border bg-card-bg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-text-dark hover:bg-bg-section transition-colors"
        >
          <span>Full ingredient breakdown ({totalCount})</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showBreakdown ? "rotate-180" : ""}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {showBreakdown && (
          <ul className="divide-y divide-border border-t border-border">
            {ingredients.map((item, i) => (
              <IngredientRow key={i} item={item} index={i} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FlagRow({ flag }: { flag: AnalysisFlag }) {
  const dot = flag.level === "bad" ? "bg-risk-bad" : flag.level === "moderate" ? "bg-risk-moderate" : "bg-risk-good";
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-dark">{flag.title}</p>
        <p className="mt-0.5 text-sm text-text-muted leading-relaxed">{flag.detail}</p>
        {flag.ingredientNames.length > 0 && (
          <p className="mt-1 text-xs text-text-light">{flag.ingredientNames.join(", ")}</p>
        )}
      </div>
    </div>
  );
}

function Chip({ tone, label, items }: { tone: "good" | "moderate" | "bad"; label: string; items: string[] }) {
  const dot = tone === "good" ? "bg-risk-good" : tone === "moderate" ? "bg-risk-moderate" : "bg-risk-bad";
  return (
    <div className="rounded-xl border border-border bg-bg-section/60 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-sm text-text-body line-clamp-2">{items.join(", ")}</p>
    </div>
  );
}

function IngredientRow({ item, index }: { item: AnalyzedIngredient; index: number }) {
  const ing = item.ingredient;
  return (
    <li className="flex items-start justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-light">{index + 1}.</span>
          {ing ? (
            <Link href={`/ingredients/${ing.slug}`} className="font-medium text-text-dark hover:text-green-primary">
              {item.rawName}
            </Link>
          ) : (
            <span className="font-medium text-text-dark">{item.rawName}</span>
          )}
          {ing && item.rawName.toLowerCase() !== ing.displayName.toLowerCase() && (
            <span className="text-xs text-text-light">({ing.displayName})</span>
          )}
          {item.concentration && (
            <span className="rounded-full bg-green-primary/10 px-2 py-0.5 text-[10px] font-semibold text-green-primary">{item.concentration}</span>
          )}
          {ing && <RatingBadge rating={ing.rating} />}
          {item.isMayContain && (
            <span className="rounded-full bg-bg-section px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">May contain</span>
          )}
          {item.matchKind === "fuzzy" && (
            <span className="rounded-full bg-risk-moderate-bg px-2 py-0.5 text-[10px] text-risk-moderate">closest match</span>
          )}
        </div>
        {ing ? (
          <p className="mt-0.5 line-clamp-1 text-sm text-text-muted">
            {ing.whatItDoes ?? (ing.functions.length ? ing.functions.join(", ") : ing.description ?? "EU CosIng database.")}
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-text-light">Not recognized — may be a trade name.</p>
        )}
      </div>
      <div className="shrink-0 text-right text-xs text-text-muted">
        {ing?.functions[0] ?? (ing ? "" : "—")}
      </div>
    </li>
  );
}
