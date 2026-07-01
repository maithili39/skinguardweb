"use client";

import { useRouter } from "next/navigation";

interface Props {
  brands: string[];
  categories: string[];
  currentBrand?: string;
  currentCategory?: string;
}

export default function ProductFilters({ brands, categories, currentBrand, currentCategory }: Props) {
  const router = useRouter();

  function navigate(brand: string | undefined, category: string | undefined) {
    const q = new URLSearchParams();
    if (brand) q.set("brand", brand);
    if (category) q.set("category", category);
    const qs = q.toString();
    router.push(`/products${qs ? `?${qs}` : ""}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={currentBrand ?? ""}
        onChange={(e) => navigate(e.target.value || undefined, currentCategory)}
        className="rounded-full border border-border bg-white px-4 py-2 text-sm text-text-dark outline-none transition-colors hover:border-green-primary focus:border-green-primary focus:ring-1 focus:ring-green-primary"
      >
        <option value="">All brands</option>
        {brands.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      <select
        value={currentCategory ?? ""}
        onChange={(e) => navigate(currentBrand, e.target.value || undefined)}
        className="rounded-full border border-border bg-white px-4 py-2 text-sm text-text-dark outline-none transition-colors hover:border-green-primary focus:border-green-primary focus:ring-1 focus:ring-green-primary"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}
