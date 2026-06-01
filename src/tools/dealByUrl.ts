import { z } from "zod";
import { fetchDeals, GrouponApiError } from "../groupon/client.js";
import { DIVISIONS } from "../groupon/divisions.js";
import { DivisionSchema, formatPrice, formatDate } from "./shared.js";
import type { Division } from "../groupon/divisions.js";

export const DealByUrlSchema = z.object({
  url: z.string().url().describe("Full groupon.es URL of the deal"),
  division: DivisionSchema.optional().describe(
    "Narrow search to one division. If omitted, division is inferred from the URL or all divisions are scanned."
  ),
});

export type DealByUrlArgs = z.infer<typeof DealByUrlSchema>;

function inferDivisionFromUrl(url: string): Division | undefined {
  try {
    const { pathname } = new URL(url);
    const segment = pathname.split("/").filter(Boolean)[0];
    if (segment && (DIVISIONS as readonly string[]).includes(segment)) {
      return segment as Division;
    }
  } catch {
    // invalid URL — Zod already validates, so this is a safety net
  }
  return undefined;
}

function extractSlug(url: string): string {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] ?? "";
  } catch {
    return "";
  }
}

export async function handleDealByUrl(args: DealByUrlArgs): Promise<string> {
  try {
    const divisionsToSearch: Division[] = args.division
      ? [args.division as Division]
      : (() => {
          const inferred = inferDivisionFromUrl(args.url);
          return inferred ? [inferred] : [...DIVISIONS];
        })();

    const slug = extractSlug(args.url);

    for (const division of divisionsToSearch) {
      const { deals } = await fetchDeals({ division, maxPages: 3 });

      const deal =
        deals.find((d) => d.url === args.url) ??
        (slug ? deals.find((d) => d.url.includes(slug)) : undefined);

      if (!deal) continue;

      const lines = [
        `Deal found in ${division}:\n`,
        `Title:    ${deal.title}`,
        `Merchant: ${deal.merchant}`,
        `Price:    €${formatPrice(deal.discountedPrice)} (was €${formatPrice(deal.originalPrice)}, ${deal.discountPercent}% off)`,
        `Category: ${deal.category ?? "N/A"}`,
        `Expires:  ${deal.expiresAt ? formatDate(deal.expiresAt) : "No expiry date"}`,
        `Flash:    ${deal.flashSale ? `Active until ${formatDate(deal.flashSale.endsAt)}` : "No active flash sale"}`,
        `Badges:   ${deal.badges.length > 0 ? deal.badges.map((b) => b.label).join(", ") : "None"}`,
        `URL:      ${deal.url}`,
      ];

      return lines.join("\n");
    }

    return `No deal matching URL '${args.url}' was found. The deal may have expired or the URL may be incorrect.`;
  } catch (err) {
    if (err instanceof GrouponApiError) return `Failed to fetch deals from Groupon: ${err.message}`;
    return `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
