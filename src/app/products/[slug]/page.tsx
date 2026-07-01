export const revalidate = 3600;

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductBySlug } from "@/lib/products";
import { analyzeInci } from "@/lib/analyzer";
import AnalysisResults from "@/components/analysis-results";
import type { SkinProfile } from "@/lib/profile";

const DEFAULT_PROFILE: SkinProfile = {
  skinType: "combination",
  concerns: [],
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: `${product.brand} ${product.name} Ingredients — SkinGuard`,
    description:
      product.description ??
      `Full ingredient analysis for ${product.brand} ${product.name} backed by EU CosIng data.`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const report = await analyzeInci(product.rawInci, DEFAULT_PROFILE);
  const matchedCount = product.ingredients.filter((i) => i.ingredient).length;
  const unmatchedCount = product.ingredients.length - matchedCount;

  return (
    <div style={{ backgroundColor: "#f5f1ea", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="border-b border-border" style={{ backgroundColor: "#f5f1ea" }}>
        <div className="mx-auto max-w-5xl px-6 py-5">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/products" className="transition-colors hover:text-green-primary">
              Products
            </Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="text-text-muted">{product.brand}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="truncate font-medium text-text-dark">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Main content */}
          <div className="space-y-5 lg:col-span-2">

            {/* Identity card */}
            <div className="rounded-2xl border border-border bg-white p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-primary">
                    {product.brand}
                  </p>
                  <h1 className="mt-1 font-display text-3xl font-bold text-text-dark">
                    {product.name}
                  </h1>
                  {product.category && (
                    <span className="mt-2 inline-block rounded-full border border-border bg-bg-section px-3 py-0.5 text-xs text-text-muted">
                      {product.category}
                    </span>
                  )}
                </div>
                <Link
                  href={`/analyze?inci=${encodeURIComponent(product.rawInci)}`}
                  className="inline-flex items-center gap-2 rounded-full bg-green-btn px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover"
                >
                  Customize analysis
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              {product.description && (
                <p className="mt-4 text-base leading-7 text-text-body">{product.description}</p>
              )}

              {/* Stats row */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-bg-section p-4 text-center">
                  <p className="font-display text-2xl font-bold text-text-dark">{product.ingredients.length}</p>
                  <p className="mt-0.5 text-xs text-text-muted">Total ingredients</p>
                </div>
                <div className="rounded-xl bg-bg-section p-4 text-center">
                  <p className="font-display text-2xl font-bold text-text-dark">{matchedCount}</p>
                  <p className="mt-0.5 text-xs text-text-muted">Identified</p>
                </div>
                <div className="rounded-xl p-4 text-center" style={{ backgroundColor: report.flags.length > 0 ? "#fff3e0" : "#e8f5e9" }}>
                  <p className="font-display text-2xl font-bold" style={{ color: report.flags.length > 0 ? "#f57c00" : "#43a047" }}>
                    {report.flags.length}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">Flags</p>
                </div>
              </div>
            </div>

            {/* Raw INCI */}
            <details className="group rounded-2xl border border-border bg-white">
              <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-text-dark">
                Raw ingredient list
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <div className="border-t border-border px-6 py-4">
                <p className="text-sm leading-7 text-text-body">{product.rawInci}</p>
              </div>
            </details>

            {/* Analysis */}
            <div className="rounded-2xl border border-border bg-white p-7">
              <h2 className="mb-5 font-display text-lg font-semibold text-text-dark">
                Ingredient Analysis
              </h2>
              <AnalysisResults report={report} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Coverage */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="mb-4 font-display text-base font-semibold text-text-dark">
                Coverage
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-text-muted">Identified</span>
                    <span className="font-medium text-text-dark">{matchedCount} / {product.ingredients.length}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-bg-section">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${product.ingredients.length ? (matchedCount / product.ingredients.length) * 100 : 0}%`,
                        backgroundColor: "#43a047",
                      }}
                    />
                  </div>
                </div>
                {unmatchedCount > 0 && (
                  <p className="text-xs text-text-muted">
                    {unmatchedCount} ingredient{unmatchedCount !== 1 ? "s" : ""} not in our database
                  </p>
                )}
              </div>
            </div>

            {/* Product details */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <h2 className="mb-4 font-display text-base font-semibold text-text-dark">
                Product Details
              </h2>
              <dl className="space-y-3">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">Brand</dt>
                  <dd className="text-sm text-text-dark">{product.brand}</dd>
                </div>
                {product.category && (
                  <div className="flex flex-col gap-0.5">
                    <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">Category</dt>
                    <dd className="text-sm text-text-dark">{product.category}</dd>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs font-medium uppercase tracking-wider text-text-muted">Ingredients</dt>
                  <dd className="text-sm text-text-dark">{product.ingredients.length} listed</dd>
                </div>
              </dl>
            </div>

            {/* Customize CTA */}
            <div className="rounded-2xl bg-green-light p-6">
              <p className="font-display text-sm font-semibold text-text-dark">
                Want a personalized analysis?
              </p>
              <p className="mt-2 text-xs leading-5 text-text-muted">
                Set your skin type and concerns to get tailored flags and recommendations.
              </p>
              <Link
                href={`/analyze?inci=${encodeURIComponent(product.rawInci)}`}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-btn px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover"
              >
                Customize analysis
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Browse more */}
            <div className="rounded-2xl border border-border bg-white p-6">
              <p className="text-sm font-semibold text-text-dark">Browse more products</p>
              <p className="mt-1 text-xs text-text-muted">
                175+ real products from top skincare brands.
              </p>
              <Link
                href="/products"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-green-primary transition-colors hover:text-green-dark"
              >
                View all products
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
