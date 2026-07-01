import type { Metadata } from "next";
import { Suspense } from "react";
import AnalyzeClient from "./analyze-client";

export const metadata: Metadata = {
  title: "Analyze Ingredients — SkinGuard",
  description:
    "Paste or scan a skincare ingredient list for an instant breakdown: ratings, irritants, pore-cloggers, actives, and fragrance allergens.",
};

export default function AnalyzePage() {
  return (
    <Suspense>
      <AnalyzeClient />
    </Suspense>
  );
}
