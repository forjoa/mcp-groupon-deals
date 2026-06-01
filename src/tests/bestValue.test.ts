import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../groupon/client.js", () => ({
  fetchDeals: vi.fn(),
  GrouponApiError: class GrouponApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

import { fetchDeals } from "../groupon/client.js";
import { handleBestValue } from "../tools/bestValue.js";
import {
  DEALS,
  hotelDeal,
  spaBDeal,
  theatreDeal,
  makeFeedResponse,
} from "./fixtures.js";
import type { Deal } from "../groupon/types.js";

const mockFetchDeals = fetchDeals as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchDeals.mockResolvedValue(makeFeedResponse(DEALS));
});

describe("handleBestValue", () => {
  it("returns deals sorted by discount descending so the best deal is first", async () => {
    const result = await handleBestValue({ division: "madrid", limit: 10 });

    const hotelPos = result.indexOf(hotelDeal.title); // 70%
    const spaBPos = result.indexOf(spaBDeal.title);   // 30%

    expect(hotelPos).toBeGreaterThanOrEqual(0);
    expect(spaBPos).toBeGreaterThanOrEqual(0);
    expect(hotelPos).toBeLessThan(spaBPos);
  });

  it("filters by max_price — excludes deals above €30", async () => {
    const result = await handleBestValue({ division: "madrid", max_price: 30, limit: 10 });

    // hotelDeal (€89.00) and theatreDeal (€35.00) must not appear
    expect(result).not.toContain(hotelDeal.title);
    expect(result).not.toContain(theatreDeal.title); // €35.00 exceeds max
    // spaBDeal (€19.99) and restaurantDeal (€15.00) should appear
    expect(result).toContain(spaBDeal.title);
  });

  it("returns an informative message when all deals are filtered out by max_price", async () => {
    const result = await handleBestValue({ division: "madrid", max_price: 1, limit: 10 });

    expect(result).toContain("No deals found");
  });

  it("uses price as tiebreaker when two deals share the same discount percentage", async () => {
    // Create two deals with identical 40% discount, different prices
    const cheaperDeal: Deal = {
      ...spaBDeal,
      id: "tiebreaker-cheap",
      discountPercent: 40,
      discountedPrice: 10.0,
      title: "Oferta barata igual descuento",
    };
    const pricierDeal: Deal = {
      ...spaBDeal,
      id: "tiebreaker-pricey",
      discountPercent: 40,
      discountedPrice: 30.0,
      title: "Oferta cara igual descuento",
    };

    mockFetchDeals.mockResolvedValue(makeFeedResponse([pricierDeal, cheaperDeal]));

    const result = await handleBestValue({ division: "madrid", limit: 10 });

    const cheaperPos = result.indexOf(cheaperDeal.title);
    const pricierPos = result.indexOf(pricierDeal.title);

    expect(cheaperPos).toBeGreaterThanOrEqual(0);
    expect(pricierPos).toBeGreaterThanOrEqual(0);
    // cheaper deal (€10) should appear before the pricier deal (€30)
    expect(cheaperPos).toBeLessThan(pricierPos);
  });

  it("returns error message when fetchDeals fails", async () => {
    mockFetchDeals.mockRejectedValue(new Error("Network failure"));
    const result = await handleBestValue({ division: "madrid", limit: 10 });
    expect(result).toContain("Unexpected error");
    expect(result).toContain("Network failure");
  });
});
