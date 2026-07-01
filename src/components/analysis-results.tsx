"use client";

import { useState } from "react";
import Link from "next/link";
import RatingBadge from "./rating-badge";
import type { AnalysisReport, AnalysisFlag, AnalyzedIngredient, Verdict } from "@/lib/types";

const VERDICT_STYLES: Record<Verdict, { border: string; bg: string; dot: string; label: string; sub: string }> = {
  safe: {
    border: "border-risk-good/40",
    bg: "bg-risk-good-bg",
    dot: "bg-risk-good",
    label: "Safe for your skin",
    sub: "text-risk-good",
  },
  caution: {
    border: "border-risk-moderate/40",
    bg: "bg-risk-moderate-bg",
    dot: "bg-risk-moderate",
    label: "Use with caution",
    sub: "text-risk-moderate",
  },
  avoid: {
    border: "border-risk-bad/40",
    bg: "bg-risk-bad-bg",
    dot: "bg-risk-bad",
    label: "Not recommended",
    sub: "text-risk-bad",
  },
};

export default function AnalysisResults({ report }: { report: AnalysisReport }) {
  const { ingredients, flags, highlights, matchedCount, totalCount, verdict, verdictReason } = report;
  const vs = VERDICT_STYLES[verdict];
  const [showBreakdown, setShowBreakdown] = useState(false);

  const badFlags = flags.filter((f) => f.level === "bad");
  const moderateFlags = flags.filter((f) => f.level === "moderate");
  const goodFlags = flags.filter((f) => f.level === "good");

  return (
    <div className="space-y-4">

      {/* Verdict */}
      <div className={`rounded-2xl border p-5 ${vs.border} ${vs.bg}`}>
        <div className="flex items-center gap-2.5">
          <span className={`h-3 w-3 rounded-full ${vs.dot}`} aria-hidden="true" />
          <span className={`text-sm font-bold uppercase tracking-wide ${vs.sub}`}>{vs.label}</span>
        </div>
        <p className="mt-2 text-base font-medium text-text-dark">{verdictReason}</p>
        <p className="mt-1 text-xs text-text-muted">{matchedCount} of {totalCount} ingredients identified</p>
      </div>

      {/* Concerns — only if any bad/moderate flags */}
      {(badFlags.length > 0 || moderateFlags.length > 0) && (
        <div className="rounded-2xl border border-border bg-card-bg divide-y divide-border overflow-hidden">
          {[...badFlags, ...moderateFlags].map((flag, i) => (
            <FlagRow key={i} flag={flag} />
          ))}
        </div>
      )}

      {/* Quick highlights — compact chips */}
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

      {/* Ingredient breakdown — collapsed by default */}
      <div className="rounded-2xl border border-border bg-card-bg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBreakdown((v) => !v)}
          className="flex w-full items-center justify-between px-5 py-4 text-sm font-medium text-text-dark hover:bg-bg-section transition-colors"
        >
          <span>Full ingredient breakdown ({totalCount})</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform ${showBreakdown ? "rotate-180" : ""}`}
          >
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
  const dot =
    flag.level === "bad" ? "bg-risk-bad" : flag.level === "moderate" ? "bg-risk-moderate" : "bg-risk-good";
  return (
    <div className="flex items-start gap-3 px-5 py-4">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text-dark">{flag.title}</p>
        <p className="mt-0.5 text-sm text-text-muted">{flag.detail}</p>
        {flag.ingredientNames.length > 0 && (
          <p className="mt-1 text-xs text-text-light">{flag.ingredientNames.join(", ")}</p>
        )}
      </div>
    </div>
  );
}

function Chip({
  tone,
  label,
  items,
}: {
  tone: "good" | "moderate" | "bad";
  label: string;
  items: string[];
}) {
  const dot =
    tone === "good" ? "bg-risk-good" : tone === "moderate" ? "bg-risk-moderate" : "bg-risk-bad";
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
          {ing && <RatingBadge rating={ing.rating} />}
          {item.isMayContain && (
            <span className="rounded-full bg-bg-section px-2 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
              May contain
            </span>
          )}
          {item.matchKind === "fuzzy" && (
            <span className="rounded-full bg-risk-moderate-bg px-2 py-0.5 text-[10px] text-risk-moderate">
              closest match
            </span>
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
