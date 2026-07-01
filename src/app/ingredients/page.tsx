export const revalidate = 3600; // rebuild at most once per hour

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  listCuratedIngredients,
  countCuratedIngredients,
  searchCuratedIngredients,
  countSearchedIngredients,
} from "@/lib/ingredients";
import RatingBadge from "@/components/rating-badge";
import IngredientSearch from "@/components/ingredient-search";

export const metadata: Metadata = {
  title: "Ingredient Index — SkinGuard",
  description:
    "Browse 680+ curated skincare ingredients with safety ratings, irritancy scores, and plain-English explanations backed by EU CosIng data.",
};

const VALID_RATINGS = ["superstar", "goodie", "caution", "avoid"] as const;
type ValidRating = (typeof VALID_RATINGS)[number];

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string; rating?: string }>;
}

export default async function IngredientsPage({ searchParams }: PageProps) {
  const { page: pageStr, q, rating: ratingParam } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const PER_PAGE = 60;
  const offset = (page - 1) * PER_PAGE;
  const query = q?.trim() ?? "";
  const rating: ValidRating | undefined = VALID_RATINGS.includes(ratingParam as ValidRating)
    ? (ratingParam as ValidRating)
    : undefined;

  const [ingredients, total] = await Promise.all([
    query
      ? searchCuratedIngredients(query, PER_PAGE, offset, rating)
      : listCuratedIngredients(PER_PAGE, offset, rating),
    query
      ? countSearchedIngredients(query, rating)
      : countCuratedIngredients(rating),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (query) params.set("q", query);
    if (rating) params.set("rating", rating);
    const qs = params.toString();
    return qs ? `/ingredients?${qs}` : "/ingredients";
  }

  function chipUrl(r?: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (r) params.set("rating", r);
    const qs = params.toString();
    return qs ? `/ingredients?${qs}` : "/ingredients";
  }

  return (
    <div style={{ backgroundColor: "#f5f1ea" }}>
      {/* Page header */}
      <div style={{ backgroundColor: "#f5f1ea" }}>
        <div className="mx-auto max-w-5xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-primary">
            Ingredient Index
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-text-dark">
            Browse Skincare Ingredients
          </h1>
          <p className="mt-3 max-w-2xl text-base text-text-muted">
            {total.toLocaleString()} curated ingredients with safety ratings and
            plain-English explanations — matched against the EU CosIng database.
          </p>

          {/* Search */}
          <div className="mt-6 max-w-xl">
            <Suspense>
              <IngredientSearch defaultValue={query} />
            </Suspense>
          </div>

          {/* Filter chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs text-text-muted">Filter by rating:</span>
            {[
              { label: "All", value: undefined },
              { label: "Superstar", value: "superstar" },
              { label: "Goodie", value: "goodie" },
              { label: "Caution", value: "caution" },
              { label: "Avoid", value: "avoid" },
            ].map((chip) => {
              const isActive = chip.value === rating;
              return (
                <Link
                  key={chip.label}
                  href={chipUrl(chip.value)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-green-primary bg-green-primary text-white"
                      : "border-border bg-white text-text-body hover:border-green-primary hover:bg-green-light hover:text-green-dark"
                  }`}
                >
                  {chip.label}
                </Link>
              );
            })}

            {query && (
              <div className="ml-auto flex items-center gap-2 rounded-full bg-green-light px-3.5 py-1.5 text-xs font-medium text-green-dark">
                <span>
                  {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
                </span>
                <Link
                  href="/ingredients"
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-dark text-white text-xs leading-none"
                  aria-label="Clear search"
                >
                  &times;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        {ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card-bg py-24 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-section text-text-muted">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-base font-semibold text-text-dark">No ingredients found</p>
            <p className="mt-1 text-sm text-text-muted">Try a different search term or browse all ingredients.</p>
            <Link
              href="/ingredients"
              className="mt-6 rounded-full bg-green-btn px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover"
            >
              Clear Search
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card-bg shadow-sm">
            {ingredients.map((ing) => (
              <li key={ing.slug}>
                <Link
                  href={`/ingredients/${ing.slug}`}
                  className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-bg-section"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-semibold text-text-dark transition-colors group-hover:text-green-primary">
                        {ing.displayName}
                      </span>
                      <RatingBadge rating={ing.rating} />
                    </div>
                    {ing.whatItDoes && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-text-muted">
                        {ing.whatItDoes}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-muted transition-all group-hover:border-green-primary group-hover:bg-green-light group-hover:text-green-dark">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(page - 1)}
                className="flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-bg-section"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Previous
              </Link>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <Link
                    key={p}
                    href={pageUrl(p)}
                    className={`min-w-[2.25rem] rounded-full border px-3 py-2 text-center text-sm font-medium transition-colors ${
                      p === page
                        ? "border-green-primary bg-green-primary text-white"
                        : "border-border text-text-dark hover:bg-bg-section"
                    }`}
                  >
                    {p}
                  </Link>
                );
              })}
            </div>

            {page < totalPages && (
              <Link
                href={pageUrl(page + 1)}
                className="flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-bg-section"
              >
                Next
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
