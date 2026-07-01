import Link from "next/link";
import RatingBadge from "./rating-badge";
import type { AnalysisReport, AnalysisFlag, AnalyzedIngredient } from "@/lib/types";

const FLAG_STYLES: Record<AnalysisFlag["level"], string> = {
  good: "border-risk-good/30 bg-risk-good-bg",
  moderate: "border-risk-moderate/30 bg-risk-moderate-bg",
  bad: "border-risk-bad/30 bg-risk-bad-bg",
};

const FLAG_DOT: Record<AnalysisFlag["level"], string> = {
  good: "bg-risk-good",
  moderate: "bg-risk-moderate",
  bad: "bg-risk-bad",
};

export default function AnalysisResults({ report }: { report: AnalysisReport }) {
  const { ingredients, flags, highlights, matchedCount, totalCount } = report;

  return (
    <div className="space-y-8">
      {/* Summary */}
      <div className="rounded-2xl border border-border bg-card-bg p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-bold text-text-dark">
            Analysis Summary
          </h2>
          <p className="text-sm text-text-muted">
            {matchedCount} of {totalCount} ingredients identified
          </p>
        </div>

        {/* Highlight chips */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <HighlightGroup
            title="Superstars"
            items={highlights.superstars}
            tone="good"
          />
          <HighlightGroup title="Actives" items={highlights.actives} tone="moderate" />
          <HighlightGroup
            title="Fragrance / allergens"
            items={highlights.fragranceAllergens}
            tone="bad"
          />
          <HighlightGroup
            title="Higher comedogenic"
            items={highlights.comedogenic}
            tone="bad"
          />
        </div>
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="space-y-3">
          {flags.map((flag, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 ${FLAG_STYLES[flag.level]}`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${FLAG_DOT[flag.level]}`}
                  aria-hidden="true"
                />
                <h3 className="font-display text-sm font-semibold text-text-dark">
                  {flag.title}
                </h3>
              </div>
              <p className="mt-1.5 text-sm leading-6 text-text-body">
                {flag.detail}
              </p>
              {flag.ingredientNames.length > 0 && (
                <p className="mt-2 text-xs text-text-muted">
                  {flag.ingredientNames.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ingredient breakdown */}
      <div>
        <h2 className="mb-4 font-display text-xl font-bold text-text-dark">
          Ingredient breakdown
        </h2>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card-bg">
          {ingredients.map((item, i) => (
            <IngredientRow key={i} item={item} index={i} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function HighlightGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "good" | "moderate" | "bad";
}) {
  const dot =
    tone === "good"
      ? "bg-risk-good"
      : tone === "moderate"
        ? "bg-risk-moderate"
        : "bg-risk-bad";
  return (
    <div className="rounded-xl bg-bg-section/60 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
        {title}
      </p>
      <p className="mt-1.5 text-sm text-text-body">
        {items.length ? items.join(", ") : "None detected"}
      </p>
    </div>
  );
}

function IngredientRow({
  item,
  index,
}: {
  item: AnalyzedIngredient;
  index: number;
}) {
  const ing = item.ingredient;

  return (
    <li className="flex items-start justify-between gap-4 px-5 py-3.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-light">{index + 1}.</span>
          {ing ? (
            <Link
              href={`/ingredients/${ing.slug}`}
              className="font-medium text-text-dark hover:text-green-primary"
            >
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
          <p className="mt-0.5 line-clamp-2 text-sm text-text-muted">
            {ing.whatItDoes ??
              (ing.functions.length
                ? ing.functions.join(", ")
                : ing.description ?? "Listed in the EU CosIng database.")}
          </p>
        ) : (
          <p className="mt-0.5 text-sm text-text-light">
            Not recognized — check spelling, or it may be a trade name.
          </p>
        )}
      </div>

      <div className="shrink-0 text-right text-xs text-text-muted">
        {ing?.functions[0] ?? (ing ? "" : "—")}
      </div>
    </li>
  );
}
