export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "ingredient"
  );
}

export function normalizeName(input: string): string {
  return input
    .replace(/\s+/g, " ")
    .replace(/[.;]+$/g, "")
    .trim()
    .toUpperCase();
}

export function titleCase(input: string): string {
  const lower = input.toLowerCase().trim();
  return lower.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

const KEEP_UPPER = new Set([
  "PEG", "PPG", "PVP", "PVM", "PCA", "EDTA", "BHT", "BHA", "AHA", "TEA",
  "MEA", "DEA", "MIPA", "CI", "SD", "HC", "VP", "VA", "UV", "EU", "DNA",
  "RNA", "ATP", "PG", "PTFE", "PFPE", "TBHQ", "C12", "C13", "C14", "PEG/PPG",
  "SLS", "SLES", "MCT", "NMF", "HA", "EGCG", "Q10",
  "NP", "AP", "EOP", "EOS", "NS", "NG", "AS",
]);

export function smartTitleCase(name: string): string {
  const fixPart = (part: string): string => {
    if (!part) return part;
    const upper = part.toUpperCase();
    if (KEEP_UPPER.has(upper)) return upper;
    if (/[A-Za-z]/.test(part) && /\d/.test(part) && part.length <= 4) return upper;
    if (!/[A-Za-z]/.test(part)) return part;
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  };

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.split("-").map(fixPart).join("-"))
    .join(" ");
}

export function parseFunctions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,/]/)
        .map((f) => f.trim())
        .filter(Boolean)
        .map((f) => titleCase(f)),
    ),
  );
}
