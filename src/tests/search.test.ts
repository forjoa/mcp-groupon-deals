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
import { handleSearch } from "../tools/search.js";
import {
  DEALS,
  spaADeal,
  spaBDeal,
  restaurantDeal,
  gymDeal,
  hotelDeal,
  makeFeedResponse,
} from "./fixtures.js";

const mockFetchDeals = fetchDeals as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchDeals.mockResolvedValue(makeFeedResponse(DEALS));
});

describe("handleSearch", () => {
  it("returns deals matching keyword in title", async () => {
    // spaADeal title contains "spa", spaBDeal title contains "bañeras"
    // Use "masaje" which is unique to spaADeal, and "bañeras" for spaBDeal separately
    const spaResult = await handleSearch({ division: "madrid", query: "masaje", limit: 10 });
    expect(spaResult).toContain(spaADeal.title);
    expect(spaResult).not.toContain(restaurantDeal.title);

    const hammamResult = await handleSearch({ division: "madrid", query: "bañeras", limit: 10 });
    expect(hammamResult).toContain(spaBDeal.title);
    expect(hammamResult).not.toContain(spaADeal.title);
  });

  it("returns deals matching keyword in merchant name", async () => {
    const result = await handleSearch({
      division: "madrid",
      query: "La Terraza de Madrid",
      limit: 10,
    });

    expect(result).toContain(restaurantDeal.title);
    expect(result).not.toContain(spaADeal.title);
  });

  it("filters by min_discount — only returns deals with at least 50% off", async () => {
    const result = await handleSearch({
      division: "madrid",
      query: "a",
      min_discount: 50,
      limit: 10,
    });

    // restaurantDeal (60%), gymDeal (50%), hotelDeal (70%) qualify
    expect(result).toContain(restaurantDeal.title);
    expect(result).toContain(gymDeal.title);
    expect(result).toContain(hotelDeal.title);
    // spaADeal (45%) and spaBDeal (30%) do not qualify
    expect(result).not.toContain(spaADeal.title);
    expect(result).not.toContain(spaBDeal.title);
  });

  it("filters by max_price — only returns deals at or under €20", async () => {
    const result = await handleSearch({
      division: "madrid",
      query: "a",
      max_price: 20,
      limit: 10,
    });

    // spaBDeal (€19.99) and restaurantDeal (€15.00) qualify
    expect(result).toContain(spaBDeal.title);
    expect(result).toContain(restaurantDeal.title);
    // spaADeal (€29.99), hotelDeal (€89.00), theatreDeal (€35.00) do not
    expect(result).not.toContain(spaADeal.title);
    expect(result).not.toContain(hotelDeal.title);
  });

  it("returns an informative message when no deals match the query", async () => {
    const result = await handleSearch({
      division: "madrid",
      query: "nonexistent-service-xyz",
      limit: 10,
    });

    expect(result).toContain("No deals found");
  });

  it("sorts results by discount descending so best deals appear first", async () => {
    const result = await handleSearch({ division: "madrid", query: "a", limit: 10 });

    const hotelPos = result.indexOf(hotelDeal.title);
    const spaAPos = result.indexOf(spaADeal.title);

    // hotelDeal (70%) should appear before spaADeal (45%)
    expect(hotelPos).toBeGreaterThanOrEqual(0);
    expect(spaAPos).toBeGreaterThanOrEqual(0);
    expect(hotelPos).toBeLessThan(spaAPos);
  });

  it("returns error message when fetchDeals fails", async () => {
    mockFetchDeals.mockRejectedValue(new Error("Network failure"));
    const result = await handleSearch({ division: "madrid", query: "spa", limit: 10 });
    expect(result).toContain("Unexpected error");
    expect(result).toContain("Network failure");
  });
});
