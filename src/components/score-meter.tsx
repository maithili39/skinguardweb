import { scoreColor } from "@/lib/rating-display";

interface ScoreMeterProps {
  label: string;
  score: number | null;
  max?: number;
}

export default function ScoreMeter({ label, score, max = 5 }: ScoreMeterProps) {
  if (score === null) return null;
  const color = scoreColor(score);
  const pct = (score / max) * 100;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-text-dark">{label}</span>
        <span className="text-text-muted">
          {score}
          <span className="text-text-light">/{max}</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-section">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1 text-xs text-text-muted">
        {score === 0
          ? "None"
          : score <= 1
            ? "Very low"
            : score <= 2
              ? "Low"
              : score <= 3
                ? "Moderate"
                : score <= 4
                  ? "High"
                  : "Very high"}
      </p>
    </div>
  );
}
