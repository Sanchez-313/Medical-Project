export interface MatchableMedicine {
  id: number;
  name: string;
}

// Ported from Medical_Product/src/lib/medicineAi.js (client-side Teachable
// Machine matcher). Server-side now so the AI proxy route can return a clean
// { label, matchedProduct } shape instead of a raw model tensor. Aliases keep
// the same label strings; productId/productName should be re-pointed at the
// migrated MySQL rows during data cutover.
const LABEL_PRODUCT_ALIASES: Array<{ labels: string[]; productName?: string; productId?: number }> = [
  { labels: ["generlog oral"], productName: "Generlog Oral" },
  { labels: ["gentalene c cream", "gentalene-c cream"], productName: "Gentalene-C Cream" },
  { labels: ["win methylated spirit", "win ( methylated spirit )"], productName: "Win (Methylated Spirit)" },
  { labels: ["enervon c", "enervon-c"], productName: "Enervon-C" },
  { labels: ["ab keto hair shampoo", "ab-keto hair shampoo", "ab keto"], productName: "Keto Shampoo 75ml" },
  { labels: ["rv ors oral rehydration salts blue", "rv ors"], productName: "Oral Rehydration Salts (ORS)" },
  { labels: ["axiona"], productName: "Axiona" },
  { labels: ["ribovit tablet"], productName: "Ribovit Tablet" },
  { labels: ["kotase"], productName: "Kotase" },
  { labels: ["multivitaminus"], productName: "Multivitaminus" },
  { labels: ["sezo b cream", "sezo-b cream"], productName: "SEZO-B Cream" },
  { labels: ["fungiderm cream"], productName: "Fungiderm Cream" },
];

function normalizeText(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value).split(" ").filter(Boolean);
}

function scoreProductMatch(label: string, product: MatchableMedicine): number {
  const labelTokens = tokenize(label);
  const nameTokens = tokenize(product.name);
  if (!labelTokens.length || !nameTokens.length) return 0;

  const nameSet = new Set(nameTokens);
  let score = 0;
  for (const token of new Set(labelTokens)) {
    if (nameSet.has(token)) score += 3;
  }

  const normalizedLabel = normalizeText(label);
  const normalizedName = normalizeText(product.name);
  if (normalizedName.includes(normalizedLabel) || normalizedLabel.includes(normalizedName)) {
    score += 8;
  }
  if (labelTokens.some((token) => normalizedName.startsWith(token))) {
    score += 1;
  }

  return score;
}

export function mapLabelToProduct<T extends MatchableMedicine>(label: string, catalog: T[]): T | null {
  const normalizedLabel = normalizeText(label);

  const aliasMatch = LABEL_PRODUCT_ALIASES.find((entry) =>
    entry.labels.some((alias) => normalizedLabel.includes(normalizeText(alias)))
  );
  if (aliasMatch) {
    const direct = aliasMatch.productId
      ? catalog.find((p) => p.id === aliasMatch.productId)
      : catalog.find((p) => normalizeText(p.name) === normalizeText(aliasMatch.productName ?? ""));
    if (direct) return direct;
  }

  const best = catalog
    .map((product) => ({ product, score: scoreProductMatch(label, product) }))
    .sort((a, b) => b.score - a.score)[0];

  return best && best.score >= 4 ? best.product : null;
}
