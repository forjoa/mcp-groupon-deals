import { z } from "zod";
import { fetchDeals, GrouponApiError } from "../groupon/client.js";
import { DivisionSchema, formatPrice, formatDate, hoursUntil } from "./shared.js";

export const ExpiringSchema = z.object({
  division: DivisionSchema,
  hours: z
    .number().positive().default(24)
    .describe("Time window in hours from now. Deals expiring within this window are returned. Default 24."),
  limit: z
    .number().int().min(1).max(50).default(10)
    .describe("Maximum number of results to return (1–50, default 10)"),
});

export type ExpiringArgs = z.infer<typeof ExpiringSchema>;

export async function handleExpiring(args: ExpiringArgs): Promise<string> {
  try {
    const { deals } = await fetchDeals({ division: args.division as import("../groupon/divisions.js").Division, maxPages: 3 });

    const now = Date.now();
    const cutoff = now + args.hours * 3_600_000;

    const filtered = deals
      .filter((d) => {
        if (!d.expiresAt) return false;
        const exp = new Date(d.expiresAt).getTime();
        return exp > now && exp <= cutoff;
      })
      .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())
      .slice(0, args.limit);

    if (filtered.length === 0) {
      return `No deals expiring within ${args.hours} hours found in ${args.division}.`;
    }

    const lines = [`${filtered.length} deal${filtered.length === 1 ? "" : "s"} expiring within ${args.hours} hours in ${args.division}:\n`];

    filtered.forEach((deal, i) => {
      const h = hoursUntil(deal.expiresAt!);
      lines.push(`${i + 1}. ${deal.title}`);
      lines.push(`   Merchant: ${deal.merchant}`);
      lines.push(`   Expires: ${formatDate(deal.expiresAt!)} (in ${h} hour${h === 1 ? "" : "s"})`);
      lines.push(`   Price: €${formatPrice(deal.discountedPrice)} (${deal.discountPercent}% off)`);
      lines.push(`   URL: ${deal.url}`);
      lines.push("");
    });

    return lines.join("\n");
  } catch (err) {
    if (err instanceof GrouponApiError) return `Failed to fetch deals from Groupon: ${err.message}`;
    return `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
