export const revalidate = 3600;

import type { Metadata } from "next";
import Link from "next/link";
import { listProducts, listBrands, listCategories, countProducts } from "@/lib/products";
import type { ProductSummary } from "@/lib/types";
import ProductFilters from "@/components/product-filters";

export const metadata: Metadata = {
  title: "Product Library — SkinGuard",
  description:
    "Browse 175+ real skincare products with full ingredient analysis. Filter by brand or category.",
};


interface PageProps {
  searchParams: Promise<{ category?: string; brand?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { category, brand, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const PER_PAGE = 24;
  const offset = (page - 1) * PER_PAGE;

  const [products, total, brands, categories] = await Promise.all([
    listProducts({ category, brand, limit: PER_PAGE, offset }),
    countProducts({ category, brand }),
    listBrands(),
    listCategories(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(params: { category?: string; brand?: string; page?: string }) {
    const q = new URLSearchParams();
    const cat = "category" in params ? params.category : category;
    const br = "brand" in params ? params.brand : brand;
    const pg = "page" in params ? params.page : String(page);
    if (cat) q.set("category", cat);
    if (br) q.set("brand", br);
    if (pg && pg !== "1") q.set("page", pg);
    const qs = q.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  return (
    <div style={{ backgroundColor: "#f5f1ea", minHeight: "100vh" }}>
      {/* Page header */}
      <div style={{ backgroundColor: "#f5f1ea" }}>
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-primary">
            Product Library
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold text-text-dark">
            Browse Skincare Products
          </h1>
          <p className="mt-3 max-w-2xl text-base text-text-muted">
            {total.toLocaleString()} real products with full ingredient analysis — backed by EU CosIng data.
          </p>
          <div className="mt-6">
            <ProductFilters
              brands={brands}
              categories={categories}
              currentBrand={brand}
              currentCategory={category}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-10">
          {/* Product grid */}
          <div>
            {/* Active filters */}
            {(brand || category) && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {brand && (
                  <div className="flex items-center gap-2 rounded-full bg-green-light px-3.5 py-1.5 text-xs font-medium text-green-dark">
                    <span>{brand}</span>
                    <Link
                      href={buildUrl({ brand: undefined, page: "1" })}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-green-dark text-white leading-none"
                      aria-label="Remove brand filter"
                    >
                      &times;
                    </Link>
                  </div>
                )}
                {category && (
                  <div className="flex items-center gap-2 rounded-full bg-green-light px-3.5 py-1.5 text-xs font-medium text-green-dark">
                    <span>{category}</span>
                    <Link
                      href={buildUrl({ category: undefined, page: "1" })}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-green-dark text-white leading-none"
                      aria-label="Remove category filter"
                    >
                      &times;
                    </Link>
                  </div>
                )}
                <span className="text-xs text-text-muted">{total} result{total !== 1 ? "s" : ""}</span>
              </div>
            )}

            {products.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white py-24 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-bg-section text-text-muted">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-text-dark">No products found</p>
                <p className="mt-1 text-sm text-text-muted">Try a different filter or browse all products.</p>
                <Link
                  href="/products"
                  className="mt-6 rounded-full bg-green-btn px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-btn-hover"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={buildUrl({ page: String(page - 1) })}
                        className="flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-white"
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
                            href={buildUrl({ page: String(p) })}
                            className={`min-w-[2.25rem] rounded-full border px-3 py-2 text-center text-sm font-medium transition-colors ${
                              p === page
                                ? "border-green-primary bg-green-primary text-white"
                                : "border-border text-text-dark hover:bg-white"
                            }`}
                          >
                            {p}
                          </Link>
                        );
                      })}
                    </div>
                    {page < totalPages && (
                      <Link
                        href={buildUrl({ page: String(page + 1) })}
                        className="flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-text-dark transition-colors hover:bg-white"
                      >
                        Next
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-white p-5 transition-all hover:border-green-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-green-primary">
            {product.brand}
          </p>
          <h3 className="mt-0.5 font-display text-base font-semibold leading-snug text-text-dark transition-colors group-hover:text-green-primary">
            {product.name}
          </h3>
        </div>
        {product.category && (
          <span className="shrink-0 rounded-full bg-bg-section px-2.5 py-0.5 text-xs text-text-muted">
            {product.category}
          </span>
        )}
      </div>
      {product.description && (
        <p className="mt-2 line-clamp-2 text-sm leading-5 text-text-muted">
          {product.description}
        </p>
      )}
      <div className="mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-green-primary">
        View analysis
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
