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
import { handleStats } from "../tools/stats.js";
import { DEALS, makeFeedResponse } from "./fixtures.js";

const mockFetchDeals = fetchDeals as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchDeals.mockResolvedValue(makeFeedResponse(DEALS));
});

describe("handleStats", () => {
  it("reports the correct total number of deals analyzed", async () => {
    const result = await handleStats({ division: "madrid" });

    expect(result).toContain(`${DEALS.length} deals analyzed`);
  });

  it("computes the correct average discount percentage", async () => {
    // DEALS discounts: 45 + 30 + 60 + 50 + 20 + 70 = 275 / 6 ≈ 45.8%
    const expected = (275 / 6).toFixed(1);
    const result = await handleStats({ division: "madrid" });

    expect(result).toContain(`${expected}%`);
  });

  it("counts active promotions correctly — spaADeal and gymDeal have active promotions", async () => {
    const result = await handleStats({ division: "madrid" });

    expect(result).toMatch(/Active promotions:\s+2/);
  });

  it("lists the top categories in the output", async () => {
    const result = await handleStats({ division: "madrid" });

    expect(result).toContain("Top categories:");
    // Categories are categoryGuid UUIDs — just verify the section has entries
    expect(result).toMatch(/\d+\. .+ \(\d+ deal/);
  });

  it("returns a no-deals message when the division has no active deals", async () => {
    mockFetchDeals.mockResolvedValue(makeFeedResponse([]));

    const result = await handleStats({ division: "madrid" });

    expect(result).toContain("No deals available");
  });

  it("returns error message when fetchDeals fails", async () => {
    mockFetchDeals.mockRejectedValue(new Error("Network failure"));
    const result = await handleStats({ division: "madrid" });
    expect(result).toContain("Unexpected error");
    expect(result).toContain("Network failure");
  });
});
