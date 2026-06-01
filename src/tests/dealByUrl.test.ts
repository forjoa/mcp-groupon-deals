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
import { handleDealByUrl } from "../tools/dealByUrl.js";
import { DEALS, spaADeal, makeFeedResponse } from "./fixtures.js";

const mockFetchDeals = fetchDeals as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchDeals.mockResolvedValue(makeFeedResponse(DEALS));
});

describe("handleDealByUrl", () => {
  it("finds a deal by its exact URL", async () => {
    const result = await handleDealByUrl({ url: spaADeal.url });

    expect(result).toContain(spaADeal.title);
    expect(result).toContain(spaADeal.merchant);
  });

  it("finds a deal by slug fallback when the URL prefix differs", async () => {
    // Same slug as spaADeal but with a different host/prefix
    const altUrl = "https://www.groupon.es/otras/deals/bienestar-madrid-spa-circuito";
    const result = await handleDealByUrl({ url: altUrl });

    // slug match should still find spaADeal
    expect(result).toContain(spaADeal.title);
  });

  it("infers the division from the URL path and only fetches that division", async () => {
    await handleDealByUrl({ url: spaADeal.url });

    // spaADeal.url starts with /madrid/ so fetchDeals should be called with division: "madrid"
    const calls = mockFetchDeals.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0].division).toBe("madrid");
  });

  it("uses the explicitly provided division parameter to narrow the search", async () => {
    await handleDealByUrl({ url: spaADeal.url, division: "barcelona" });

    const calls = mockFetchDeals.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    // explicit division should override any inferred one
    expect(calls[0][0].division).toBe("barcelona");
  });

  it("returns a not-found message for a URL that matches no deal", async () => {
    const unknownUrl = "https://www.groupon.es/madrid/deals/no-existe-este-deal";
    const result = await handleDealByUrl({ url: unknownUrl });

    expect(result).toContain("No deal matching URL");
  });

  it("returns error message when fetchDeals fails", async () => {
    mockFetchDeals.mockRejectedValue(new Error("Network failure"));
    const result = await handleDealByUrl({ url: "https://www.groupon.es/madrid/some-deal" });
    expect(result).toContain("Unexpected error");
    expect(result).toContain("Network failure");
  });
});
