export const revalidate = 3600;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getIngredientBySlug } from "@/lib/ingredients";
import RatingBadge from "@/components/rating-badge";
import ScoreMeter from "@/components/score-meter";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ing = await getIngredientBySlug(slug);
  if (!ing) return {};
  return {
    title: `${ing.displayName} — SkinGuard Ingredient`,
    description:
      ing.whatItDoes ??
      ing.description ??
      `Learn about ${ing.displayName}: safety rating, functions, and skin compatibility backed by EU CosIng data.`,
  };
}

export default async function IngredientPage({ params }: PageProps) {
  const { slug } = await params;
  const ing = await getIngredientBySlug(slug);
  if (!ing) notFound();

  const pregnancyLabel =
    ing.pregnancySafe === "safe"
      ? "Generally considered safe"
      : ing.pregnancySafe === "caution"
        ? "Use with caution — check with your doctor"
        : "Commonly advised to avoid during pregnancy";

  const pregnancyColor =
    ing.pregnancySafe === "safe"
      ? "bg-risk-good-bg text-risk-good border-risk-good/20"
      : ing.pregnancySafe === "caution"
        ? "bg-risk-moderate-bg text-risk-moderate border-risk-moderate/20"
        : "bg-risk-bad-bg text-risk-bad border-risk-bad/20";

  return (
    <div className="bg-bg-page">
      {/* Top bar */}
      <div className="border-b border-border bg-bg-section">
        <div className="mx-auto max-w-4xl px-6 py-5">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/ingredients" className="transition-colors hover:text-green-primary">
              Ingredients
            </Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="truncate font-medium text-text-dark">{ing.displayName}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left column — main info */}
          <div className="space-y-5 lg:col-span-2">

            {/* Identity card */}
            <div className="rounded-2xl border border-border bg-card-bg p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-bold text-text-dark">
                    {ing.displayName}
                  </h1>
                  <p className="mt-1 font-mono text-sm text-text-muted">{ing.inciName}</p>
                </div>
                <RatingBadge rating={ing.rating} size="lg" />
              </div>

              {ing.whatItDoes && (
                <p className="mt-5 text-base leading-7 text-text-body">{ing.whatItDoes}</p>
              )}
            </div>

            {/* Safety scores */}
            {(ing.irritancy !== null || ing.comedogenicity !== null) && (
              <div className="rounded-2xl border border-border bg-card-bg p-7">
                <h2 className="mb-5 font-display text-lg font-semibold text-text-dark">
                  Safety Scores
                </h2>
                <div className="space-y-4">
                  {ing.irritancy !== null && (
                    <ScoreMeter label="Irritancy" score={ing.irritancy} max={5} />
                  )}
                  {ing.comedogenicity !== null && (
                    <ScoreMeter label="Comedogenicity" score={ing.comedogenicity} max={5} />
                  )}
                </div>
                <p className="mt-4 text-xs text-text-muted">
                  Scores are rated 0 (none) to 5 (high). Based on published dermatological research.
                </p>
              </div>
            )}

            {/* Pregnancy safety */}
            {ing.pregnancySafe && (
              <div className={`rounded-2xl border p-6 ${pregnancyColor}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-current/10">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-70">
                      Pregnancy Safety
                    </p>
                    <p className="mt-0.5 font-semibold">{pregnancyLabel}</p>
                  </div>
                </div>
                {ing.pregnancyNotes && (
                  <p className="mt-3 text-sm opacity-80">{ing.pregnancyNotes}</p>
                )}
              </div>
            )}

            {/* Description */}
            {ing.description && (
              <div className="rounded-2xl border border-border bg-card-bg p-7">
                <h2 className="mb-3 font-display text-lg font-semibold text-text-dark">
                  Technical Description
                </h2>
                <p className="text-sm leading-7 text-text-body">{ing.description}</p>
              </div>
            )}

            {/* Functions */}
            {ing.functions.length > 0 && (
              <div className="rounded-2xl border border-border bg-card-bg p-7">
                <h2 className="mb-4 font-display text-lg font-semibold text-text-dark">
                  EU CosIng Functions
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ing.functions.map((fn) => (
                    <span
                      key={fn}
                      className="rounded-full border border-border bg-bg-section px-3.5 py-1.5 text-sm text-text-body"
                    >
                      {fn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Also known as */}
            {ing.alsoKnownAs.length > 0 && (
              <div className="rounded-2xl border border-border bg-card-bg p-7">
                <h2 className="mb-4 font-display text-lg font-semibold text-text-dark">
                  Also Known As
                </h2>
                <div className="flex flex-wrap gap-2">
                  {ing.alsoKnownAs.map((aka) => (
                    <span
                      key={aka}
                      className="rounded-full border border-border bg-bg-section px-3.5 py-1.5 text-sm text-text-muted"
                    >
                      {aka}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — sidebar */}
          <div className="space-y-5">

            {/* Technical details */}
            <div className="rounded-2xl border border-border bg-card-bg p-6">
              <h2 className="mb-4 font-display text-base font-semibold text-text-dark">
                Technical Details
              </h2>
              <dl className="space-y-3">
                {ing.cosingRef && <Row label="CosIng Ref" value={ing.cosingRef} />}
                {ing.casNo && <Row label="CAS No" value={ing.casNo} />}
                {ing.einecsNo && <Row label="EINECS / ELINCS" value={ing.einecsNo} />}
                {ing.restriction && <Row label="EU Restriction" value={ing.restriction} />}
                {ing.updateDate && <Row label="Last Updated" value={ing.updateDate} />}
              </dl>
            </div>

            {/* Analyze CTA */}
            <div className="rounded-2xl bg-green-light p-6">
              <p className="font-display text-sm font-semibold text-text-dark">
                Analyzing a product that contains {ing.displayName}?
              </p>
              <p className="mt-2 text-xs leading-5 text-text-muted">
                Paste the full ingredient list to see how every ingredient interacts with your skin profile.
              </p>
              <Link
                href="/analyze"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-btn px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover"
              >
                Analyze Ingredients
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Browse more */}
            <div className="rounded-2xl border border-border bg-card-bg p-6">
              <p className="text-sm font-semibold text-text-dark">Browse more ingredients</p>
              <p className="mt-1 text-xs text-text-muted">
                680+ curated INCI ingredients with safety ratings.
              </p>
              <Link
                href="/ingredients"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green-primary transition-colors hover:text-green-dark"
              >
                View all ingredients
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">{label}</dt>
      <dd className="text-sm text-text-dark">{value}</dd>
    </div>
  );
}
