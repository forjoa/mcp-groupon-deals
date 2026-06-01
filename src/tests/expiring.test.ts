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
import { handleExpiring } from "../tools/expiring.js";
import {
  DEALS,
  spaADeal,
  spaBDeal,
  gymDeal,
  restaurantDeal,
  expiredDeal,
  makeFeedResponse,
} from "./fixtures.js";

const mockFetchDeals = fetchDeals as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchDeals.mockResolvedValue(makeFeedResponse(DEALS));
});

describe("handleExpiring", () => {
  it("returns deals that expire within the given time window", async () => {
    // restaurantDeal expires in 2h — should appear when hours=3
    const result = await handleExpiring({ division: "madrid", hours: 3, limit: 10 });

    expect(result).toContain(restaurantDeal.title);
  });

  it("excludes deals that have already expired", async () => {
    mockFetchDeals.mockResolvedValue(
      makeFeedResponse([...DEALS, expiredDeal])
    );

    const result = await handleExpiring({ division: "madrid", hours: 24, limit: 10 });

    expect(result).not.toContain(expiredDeal.title);
  });

  it("excludes deals that have no expiry date", async () => {
    // Within 3h only restaurantDeal (2h) should appear — spaBDeal, gymDeal, hotelDeal have no expiry
    const result = await handleExpiring({ division: "madrid", hours: 3, limit: 10 });

    // Deals with no expiresAt must not appear
    expect(result).not.toContain(spaBDeal.merchant); // spaBDeal, no expiry
    expect(result).not.toContain(gymDeal.merchant); // gymDeal, no expiry
  });

  it("sorts results so the soonest-expiring deal appears first", async () => {
    // Within 50h: restaurantDeal (2h) and spaADeal (48h) both qualify
    const result = await handleExpiring({ division: "madrid", hours: 50, limit: 10 });

    const restaurantPos = result.indexOf(restaurantDeal.title);
    const spaAPos = result.indexOf(spaADeal.title);

    expect(restaurantPos).toBeGreaterThanOrEqual(0);
    expect(spaAPos).toBeGreaterThanOrEqual(0);
    // restaurantDeal (2h) must appear before spaADeal (48h)
    expect(restaurantPos).toBeLessThan(spaAPos);
  });

  it("returns an informative message when nothing expires within the window", async () => {
    // With hours=1 no deal expires that soon (shortest is restaurantDeal at 2h)
    const result = await handleExpiring({ division: "madrid", hours: 1, limit: 10 });

    expect(result).toContain("No deals expiring");
  });

  it("returns error message when fetchDeals fails", async () => {
    mockFetchDeals.mockRejectedValue(new Error("Network failure"));
    const result = await handleExpiring({ division: "madrid", hours: 24, limit: 10 });
    expect(result).toContain("Unexpected error");
    expect(result).toContain("Network failure");
  });
});
