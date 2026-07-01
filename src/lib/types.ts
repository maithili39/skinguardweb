export type Rating =
  | "superstar"
  | "goodie"
  | "neutral"
  | "caution"
  | "avoid";

export type PregnancySafety = "safe" | "caution" | "avoid";

export interface Ingredient {
  id: number;
  cosingRef: string | null;
  inciName: string;
  displayName: string;
  slug: string;
  casNo: string | null;
  einecsNo: string | null;
  description: string | null;
  functions: string[];
  restriction: string | null;
  updateDate: string | null;
  whatItDoes: string | null;
  rating: Rating | null;
  irritancy: number | null;
  comedogenicity: number | null;
  pregnancySafe: PregnancySafety | null;
  pregnancyNotes: string | null;
  alsoKnownAs: string[];
  tags: string[];
  isCurated: boolean;
}

export interface ProductSummary {
  id: number;
  brand: string;
  name: string;
  slug: string;
  category: string | null;
  description: string | null;
}

export interface ProductIngredientRef {
  position: number;
  rawName: string;
  ingredient: Ingredient | null;
}

export interface Product extends ProductSummary {
  rawInci: string;
  ingredients: ProductIngredientRef[];
}

export type MatchKind = "exact" | "synonym" | "fuzzy" | "unmatched";

export interface AnalyzedIngredient {
  rawName: string;
  matchKind: MatchKind;
  ingredient: Ingredient | null;
  isMayContain: boolean;
}

export interface AnalysisFlag {
  level: "good" | "moderate" | "bad";
  title: string;
  detail: string;
  ingredientNames: string[];
}

export interface AnalysisReport {
  ingredients: AnalyzedIngredient[];
  matchedCount: number;
  totalCount: number;
  flags: AnalysisFlag[];
  highlights: {
    superstars: string[];
    actives: string[];
    fragranceAllergens: string[];
    comedogenic: string[];
  };
}
