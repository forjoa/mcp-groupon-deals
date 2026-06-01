import { z } from "zod";
import { fetchDeals, GrouponApiError } from "../groupon/client.js";
import { DivisionSchema, formatPrice, formatDate } from "./shared.js";

export const CompareSchema = z.object({
  division: DivisionSchema,
  deal_id_a: z.string().min(1).describe("ID of the first deal to compare"),
  deal_id_b: z.string().min(1).describe("ID of the second deal to compare"),
});

export type CompareArgs = z.infer<typeof CompareSchema>;

function pad(str: string, len: number): string {
  const s = str.length > len ? str.slice(0, len - 1) + "…" : str;
  return s.padEnd(len);
}

export async function handleCompare(args: CompareArgs): Promise<string> {
  try {
    const { deals } = await fetchDeals({ division: args.division as import("../groupon/divisions.js").Division, maxPages: 5 });

    const dealA = deals.find((d) => d.id === args.deal_id_a);
    const dealB = deals.find((d) => d.id === args.deal_id_b);

    if (!dealA && !dealB) {
      return `Neither deal ID was found in ${args.division}.`;
    }
    if (!dealA) {
      return `Deal with ID '${args.deal_id_a}' not found in ${args.division}. The deal may have expired or the ID may be incorrect.`;
    }
    if (!dealB) {
      return `Deal with ID '${args.deal_id_b}' not found in ${args.division}. The deal may have expired or the ID may be incorrect.`;
    }

    const COL = 26;
    const label = (l: string) => l.padEnd(14);

    const row = (l: string, a: string, b: string) =>
      `${label(l)}${pad(a, COL)}${pad(b, COL)}`;

    const lines = [
      `Deal Comparison — ${args.division}\n`,
      row("", "Deal A", "Deal B"),
      row("Title", dealA.title, dealB.title),
      row("Merchant", dealA.merchant, dealB.merchant),
      row("Price", `€${formatPrice(dealA.discountedPrice)}`, `€${formatPrice(dealB.discountedPrice)}`),
      row("Original", `€${formatPrice(dealA.originalPrice)}`, `€${formatPrice(dealB.originalPrice)}`),
      row("Discount", `${dealA.discountPercent}%`, `${dealB.discountPercent}%`),
      row("Category", dealA.category ?? "N/A", dealB.category ?? "N/A"),
      row("Flash Sale", dealA.flashSale ? "Yes" : "No", dealB.flashSale ? "Yes" : "No"),
      row("Featured", dealA.isFeatured ? "Yes" : "No", dealB.isFeatured ? "Yes" : "No"),
      row("Expires", dealA.expiresAt ? formatDate(dealA.expiresAt) : "N/A", dealB.expiresAt ? formatDate(dealB.expiresAt) : "N/A"),
      row("URL", dealA.url, dealB.url),
      "",
    ];

    const betterDiscount =
      dealA.discountPercent === dealB.discountPercent
        ? "Both deals offer the same discount."
        : `Deal ${dealA.discountPercent > dealB.discountPercent ? "A" : "B"} offers a better discount (${Math.max(dealA.discountPercent, dealB.discountPercent)}%).`;

    const cheaperDeal =
      dealA.discountedPrice === dealB.discountedPrice
        ? "Both deals have the same price."
        : `Deal ${dealA.discountedPrice < dealB.discountedPrice ? "A" : "B"} is cheaper at €${formatPrice(Math.min(dealA.discountedPrice, dealB.discountedPrice))}.`;

    lines.push(`Verdict: ${betterDiscount} ${cheaperDeal}`);

    return lines.join("\n");
  } catch (err) {
    if (err instanceof GrouponApiError) return `Failed to fetch deals from Groupon: ${err.message}`;
    return `Unexpected error: ${err instanceof Error ? err.message : String(err)}`;
  }
}
