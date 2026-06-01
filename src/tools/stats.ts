import { z } from "zod";
import { fetchDeals, GrouponApiError } from "../groupon/client.js";
import { DivisionSchema, formatPrice } from "./shared.js";

export const StatsSchema = z.object({
  division: DivisionSchema,
});

export type StatsArgs = z.infer<typeof StatsSchema>;

export async function handleStats(args: StatsArgs): Promise<string> {
  try {
    const { deals } = await fetchDeals({ division: args.division as import("../groupon/divisions.js").Division, maxPages: 5 });

    if (deals.length === 0) {
      return `No deals available for ${args.division} at this time.`;
    }

    const total = deals.length;
    const avgDiscount = deals.reduce((s, d) => s + d.discountPercent, 0) / total;
    const avgPrice = deals.reduce((s, d) => s + d.discountedPrice, 0) / total;
    const avgOriginal = deals.reduce((s, d) => s + d.originalPrice, 0) / total;
    const maxDiscount = Math.max(...deals.map((d) => d.discountPercent));
    const minPrice = Math.min(...deals.map((d) => d.discountedPrice));
    const flashCount = deals.filter((d) => d.flashSale !== undefined).length;
    const featuredCount = deals.filter((d) => d.isFeatured).length;
    const expiryCount = deals.filter((d) => d.expiresAt !== undefined).length;

    const catMap = new Map<string, number>();
    for (const d of deals) {
      const cat = d.category ?? "Uncategorized";
      catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
    }
    const topCats = [...catMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const lines = [
      `Deal stats for ${args.division} (${total} deals analyzed):\n`,
      `Pricing`,
      `  Average price:          €${formatPrice(avgPrice)}`,
      `  Average original price: €${formatPrice(avgOriginal)}`,
      `  Lowest price available: €${formatPrice(minPrice)}`,
      ``,
      `Discounts`,
      `  Average discount:       ${avgDiscount.toFixed(1)}%`,
      `  Highest discount:       ${maxDiscount}%`,
      ``,
      `Availability`,
      `  Flash sales active:     ${flashCount}`,
      `  Featured deals:         ${featuredCount}`,
      `  Deals with expiry date: ${expiryCount}`,
      ``,
      `Top categories:`,
      ...topCats.map(([ cat, count ], i) => `  ${i + 1}. ${cat} (${count} deal${count === 1 ? "" : "s"})`),
    ];

    return lines.join("\n");
  } catch (err) {
    if (err instanceof GrouponApiError) return `Failed to fetch deals from Groupon: ${err.message}`;
    return `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
