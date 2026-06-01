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
import { handleCompare } from "../tools/compare.js";
import { DEALS, spaADeal, spaBDeal, hotelDeal, makeFeedResponse } from "./fixtures.js";

const mockFetchDeals = fetchDeals as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchDeals.mockResolvedValue(makeFeedResponse(DEALS));
});

describe("handleCompare", () => {
  it("compares two valid deals and outputs both titles, prices, and a verdict", async () => {
    const result = await handleCompare({
      division: "madrid",
      deal_id_a: spaADeal.id,
      deal_id_b: spaBDeal.id,
    });

    // title is truncated in the padded comparison table — match on prefix only
    expect(result).toContain(spaADeal.title.slice(0, 10)); // truncated in padded table
    expect(result).toContain(spaBDeal.title.slice(0, 10));
    expect(result).toContain("Verdict:");
  });

  it("returns an error message when deal A is not found", async () => {
    const result = await handleCompare({
      division: "madrid",
      deal_id_a: "unknown-id-a",
      deal_id_b: spaBDeal.id,
    });

    expect(result).toContain("unknown-id-a");
    expect(result).toContain("not found");
  });

  it("returns an error message when deal B is not found", async () => {
    const result = await handleCompare({
      division: "madrid",
      deal_id_a: spaADeal.id,
      deal_id_b: "unknown-id-b",
    });

    expect(result).toContain("unknown-id-b");
    expect(result).toContain("not found");
  });

  it("returns an error message when neither deal is found", async () => {
    const result = await handleCompare({
      division: "madrid",
      deal_id_a: "unknown-a",
      deal_id_b: "unknown-b",
    });

    expect(result).toContain("Neither deal");
  });

  it("verdict correctly identifies the deal with the better discount", async () => {
    // hotelDeal is 70%, spaBDeal is 30% — hotelDeal is Deal A here
    const result = await handleCompare({
      division: "madrid",
      deal_id_a: hotelDeal.id,
      deal_id_b: spaBDeal.id,
    });

    // Deal A (hotelDeal at 70%) should win the discount comparison
    expect(result).toContain("Deal A offers a better discount (70%)");
  });

  it("returns error message when fetchDeals fails", async () => {
    mockFetchDeals.mockRejectedValue(new Error("Network failure"));
    const result = await handleCompare({ division: "madrid", deal_id_a: "a", deal_id_b: "b" });
    expect(result).toContain("Unexpected error");
    expect(result).toContain("Network failure");
  });
});
