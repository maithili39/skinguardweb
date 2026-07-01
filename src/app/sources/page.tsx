import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Data Sources — SkinGuard",
};

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-display text-3xl font-bold text-text-dark">Data Sources</h1>
      <p className="mt-2 text-sm text-text-muted">Where our ingredient data comes from</p>

      <div className="mt-10 space-y-6">
        <div className="rounded-2xl border border-border bg-card-bg p-6">
          <h2 className="font-display text-lg font-semibold text-text-dark">EU CosIng Database</h2>
          <p className="mt-2 text-sm leading-7 text-text-body">
            The backbone of our ingredient data is the European Commission CosIng (Cosmetic Ingredient) database, which contains over 24,000 INCI-named cosmetic ingredients with their official EU functions, restrictions, CAS numbers, and EINECS references. CosIng is maintained by the European Commission Directorate-General for Internal Market, Industry, Entrepreneurship and SMEs.
          </p>
          <p className="mt-3 text-sm text-text-muted">Version: COSING_Ingredients-Fragrance Inventory v2 · Updated periodically from the official EU Commission export.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card-bg p-6">
          <h2 className="font-display text-lg font-semibold text-text-dark">Curated Safety Overlay</h2>
          <p className="mt-2 text-sm leading-7 text-text-body">
            On top of the raw CosIng data we maintain a hand-curated overlay of approximately 682 ingredients that commonly appear on real skincare labels. This overlay adds consumer-facing descriptions, irritancy and comedogenicity scores (scale 0–5), pregnancy safety flags, and known synonyms. Scoring is based on published dermatological literature and widely referenced consumer safety resources.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card-bg p-6">
          <h2 className="font-display text-lg font-semibold text-text-dark">Open Beauty Facts (Barcode Lookup)</h2>
          <p className="mt-2 text-sm leading-7 text-text-body">
            Barcode product lookups use the Open Beauty Facts API, a collaborative, open-data database of cosmetic and personal care products contributed by users worldwide. Ingredient lists retrieved via barcode are community-sourced and may not always be complete or up to date.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card-bg p-6">
          <h2 className="font-display text-lg font-semibold text-text-dark">Product Database</h2>
          <p className="mt-2 text-sm leading-7 text-text-body">
            Our built-in product database contains 175+ real products with ingredient lists sourced from publicly available product packaging. It covers major skincare brands across cleansers, moisturisers, serums, sunscreens, treatments, toners, and eye care.
          </p>
        </div>
      </div>
    </div>
  );
}
