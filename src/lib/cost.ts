import type { Tool } from "../types";

export interface PricingTier {
  name: string;
  // Parsed monthly USD, or null when the tier is variable / pay-as-you-go /
  // enterprise / otherwise unknown. Free tiers explicitly resolve to 0.
  monthly: number | null;
}

const PRICE_RE = /\$([\d.,]+)\s*\/\s*mo/i;

// Parse a free-form pricing string into ordered tiers. Examples in the wild:
//   "Free · Pro $19/mo · Business $99/mo"
//   "Pay-as-you-go · ~$2/mo small VM"
//   "Scaler $39/mo · Enterprise"
export function parsePricingTiers(pricing: string | undefined): PricingTier[] {
  if (!pricing) return [];
  return pricing
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part): PricingTier => {
      const priceMatch = part.match(PRICE_RE);
      const name = part.replace(PRICE_RE, "").replace(/~/g, "").trim();
      const isFree = /^free/i.test(name);
      const monthly = isFree ? 0 : priceMatch ? parseFloat(priceMatch[1]!.replace(/,/g, "")) : null;
      return { name: name || part, monthly };
    });
}

export function priceForPlan(tool: Tool, planName: string | undefined): number | null {
  if (!planName) return null;
  const tiers = parsePricingTiers(tool.pricing);
  const found = tiers.find((t) => t.name.toLowerCase() === planName.toLowerCase());
  return found?.monthly ?? null;
}

export interface MonthlyTotals {
  total: number;
  tracked: number;
  untracked: number;
}

export function monthlyTotal(
  tools: Tool[],
  getPlan: (toolId: string) => string | undefined,
): MonthlyTotals {
  let total = 0;
  let tracked = 0;
  let untracked = 0;
  for (const tool of tools) {
    const price = priceForPlan(tool, getPlan(tool.id));
    if (price != null) {
      total += price;
      tracked += 1;
    } else {
      untracked += 1;
    }
  }
  return { total, tracked, untracked };
}
