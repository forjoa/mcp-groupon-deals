import { z } from "zod";
import { fetchDeals, GrouponApiError } from "../groupon/client.js";
import { DivisionSchema, formatPrice } from "./shared.js";

export const SearchSchema = z.object({
  division: DivisionSchema,
  query: z.string().min(1).describe("Keyword to match against deal title and merchant name"),
  min_discount: z
    .number().int().min(0).max(100).optional()
    .describe("Minimum discount percentage (0–100). Omit to include all."),
  max_price: z
    .number().positive().optional()
    .describe("Maximum discounted price in euros. Omit to include all."),
  limit: z
    .number().int().min(1).max(50).default(10)
    .describe("Maximum number of results to return (1–50, default 10)"),
});

export type SearchArgs = z.infer<typeof SearchSchema>;

export async function handleSearch(args: SearchArgs): Promise<string> {
  try {
    const { deals } = await fetchDeals({ division: args.division as import("../groupon/divisions.js").Division, maxPages: 5 });
    const q = args.query.toLowerCase().trim();

    let filtered = deals.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.merchant.toLowerCase().includes(q)
    );

    if (args.min_discount !== undefined) {
      filtered = filtered.filter((d) => d.discountPercent >= args.min_discount!);
    }
    if (args.max_price !== undefined) {
      filtered = filtered.filter((d) => d.discountedPrice <= args.max_price!);
    }

    filtered.sort((a, b) => b.discountPercent - a.discountPercent);
    const results = filtered.slice(0, args.limit);

    if (results.length === 0) {
      return `No deals found in ${args.division} matching "${args.query}". Try a different keyword or remove filters.`;
    }

    const lines = [
      `Found ${results.length} deal${results.length === 1 ? "" : "s"} in ${args.division} matching "${args.query}":\n`,
    ];

    results.forEach((deal, i) => {
      lines.push(`${i + 1}. ${deal.title}`);
      lines.push(`   Merchant: ${deal.merchant}`);
      lines.push(`   Price: €${formatPrice(deal.discountedPrice)} (was €${formatPrice(deal.originalPrice)}, ${deal.discountPercent}% off)`);
      if (deal.category) lines.push(`   Category: ${deal.category}`);
      lines.push(`   URL: ${deal.url}`);
      lines.push("");
    });

    lines.push(`(Filtered from ${deals.length} deals)`);
    return lines.join("\n");
  } catch (err) {
    if (err instanceof GrouponApiError) return `Failed to fetch deals from Groupon: ${err.message}`;
    return `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
