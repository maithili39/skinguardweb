import { ratingStyle } from "@/lib/rating-display";
import type { Rating } from "@/lib/types";

interface Props {
  rating: Rating | null;
  size?: "sm" | "lg";
}

export default function RatingBadge({ rating, size = "sm" }: Props) {
  const style = ratingStyle(rating);
  if (!style) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${style.badge} ${
        size === "lg"
          ? "px-4 py-1 text-sm"
          : "px-2.5 py-0.5 text-xs"
      }`}
      title={style.description}
    >
      {style.label}
    </span>
  );
}
