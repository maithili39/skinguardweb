import type { Rating } from "./types";

export interface RatingStyle {
  label: string;
  /** Tailwind classes for a badge (bg + text). */
  badge: string;
  description: string;
}

export const RATING_STYLES: Record<Rating, RatingStyle> = {
  superstar: {
    label: "Superstar",
    badge: "bg-risk-good-bg text-risk-good",
    description: "A well-studied, highly effective ingredient.",
  },
  goodie: {
    label: "Goodie",
    badge: "bg-green-light text-green-dark",
    description: "A beneficial, well-regarded ingredient.",
  },
  neutral: {
    label: "Neutral",
    badge: "bg-bg-section text-text-muted",
    description: "A functional ingredient with no notable concerns.",
  },
  caution: {
    label: "Caution",
    badge: "bg-risk-moderate-bg text-risk-moderate",
    description: "May cause issues for some skin types.",
  },
  avoid: {
    label: "Avoid",
    badge: "bg-risk-bad-bg text-risk-bad",
    description: "Often best avoided, especially for reactive skin.",
  },
};

export function ratingStyle(rating: Rating | null): RatingStyle | null {
  return rating ? RATING_STYLES[rating] : null;
}

/** Color for a 0-5 irritancy/comedogenicity score. */
export function scoreColor(score: number): string {
  if (score <= 1) return "var(--score-green)";
  if (score <= 2) return "var(--score-yellow)";
  if (score <= 3) return "var(--score-orange)";
  return "var(--score-red)";
}
