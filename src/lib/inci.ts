import { normalizeName } from "./text";

export interface TokenizedInci {
  main: string[];
  mayContain: string[];
}

export function tokenizeInci(raw: string): TokenizedInci {
  if (!raw) return { main: [], mayContain: [] };

  let text = raw.replace(/\r/g, "").trim();

  let mayContainPart = "";
  const mcMatch = text.match(/(?:may\s*contain|\+\/-|±)\s*:?\s*/i);
  if (mcMatch && mcMatch.index !== undefined) {
    mayContainPart = text.slice(mcMatch.index + mcMatch[0].length);
    text = text.slice(0, mcMatch.index);
  }

  return {
    main: splitTokens(text),
    mayContain: splitTokens(mayContainPart),
  };
}

function splitTokens(text: string): string[] {
  if (!text || !text.trim()) return [];
  const parts = text
    .split(/[\n•·;]+|,(?!\d)|(?<!\d),/g)
    .map(cleanToken)
    .filter(Boolean);
  return parts;
}

export function cleanToken(token: string): string {
  return token
    .replace(/\s+/g, " ")
    .replace(/^[\s.,;:•·*\-]+/, "")
    .replace(/[\s.,;:•·*]+$/, "")
    .trim();
}

export function candidateForms(token: string): string[] {
  const forms: string[] = [];
  const seen = new Set<string>();
  const push = (s: string) => {
    const n = normalizeName(s);
    if (n && !seen.has(n)) {
      seen.add(n);
      forms.push(n);
    }
  };

  const cleaned = cleanToken(token);
  push(cleaned);

  const paren = cleaned.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    push(paren[1]);
    push(paren[2]);
  }

  const noParen = cleaned.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  push(noParen);

  if (/\//.test(cleaned)) {
    const slashParts = cleaned.split("/").map((s) => s.trim());
    if (slashParts.length === 2 && slashParts.every((p) => p.split(" ").length <= 2)) {
      slashParts.forEach(push);
    }
  }

  return forms;
}
