import { z } from "zod";
import { fetchDeals, GrouponApiError } from "../groupon/client.js";
import { DivisionSchema, formatPrice } from "./shared.js";

export const BestValueSchema = z.object({
  division: DivisionSchema,
  max_price: z
    .number().positive().optional()
    .describe("Maximum discounted price in euros. Omit to include all."),
  limit: z
    .number().int().min(1).max(50).default(10)
    .describe("Maximum number of results to return (1–50, default 10)"),
});

export type BestValueArgs = z.infer<typeof BestValueSchema>;

export async function handleBestValue(args: BestValueArgs): Promise<string> {
  try {
    const { deals } = await fetchDeals({ division: args.division as import("../groupon/divisions.js").Division, maxPages: 3 });

    let filtered = deals;
    if (args.max_price !== undefined) {
      filtered = deals.filter((d) => d.priceEuros <= args.max_price!);
    }

    filtered.sort((a, b) => {
      if (b.discountPercent !== a.discountPercent) return b.discountPercent - a.discountPercent;
      return a.priceEuros - b.priceEuros;
    });

    const results = filtered.slice(0, args.limit);

    if (results.length === 0) {
      return `No deals found in ${args.division} matching your filters.`;
    }

    const lines = [`Top ${results.length} best-value deals in ${args.division}:\n`];

    results.forEach((deal, i) => {
      lines.push(`${i + 1}. ${deal.title}`);
      lines.push(`   Merchant: ${deal.merchant}`);
      lines.push(`   Discount: ${deal.discountPercent}%`);
      lines.push(`   Price: €${formatPrice(deal.priceEuros)} (was €${formatPrice(deal.originalPriceEuros)})`);
      if (deal.category) lines.push(`   Category: ${deal.category}`);
      lines.push(`   URL: ${deal.url}`);
      lines.push("");
    });

    return lines.join("\n");
  } catch (err) {
    if (err instanceof GrouponApiError) return `Failed to fetch deals from Groupon: ${err.message}`;
    return `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
