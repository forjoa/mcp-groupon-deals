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
  it("returns deals whose promotion expires within the given time window", async () => {
    // spaADeal promotion expires in 12h — should appear when hours=24
    const result = await handleExpiring({ division: "madrid", hours: 24, limit: 10 });

    expect(result).toContain(spaADeal.title);
  });

  it("excludes deals whose promotion has already expired", async () => {
    mockFetchDeals.mockResolvedValue(
      makeFeedResponse([...DEALS, expiredDeal])
    );

    const result = await handleExpiring({ division: "madrid", hours: 24, limit: 10 });

    expect(result).not.toContain(expiredDeal.title);
  });

  it("excludes deals that have no promotion", async () => {
    // restaurantDeal has no promotion, should never appear
    const result = await handleExpiring({ division: "madrid", hours: 72, limit: 10 });

    expect(result).not.toContain(restaurantDeal.title);
  });

  it("sorts results so the soonest-expiring promotion appears first", async () => {
    // Within 50h: spaADeal (promo in 12h) and gymDeal (promo in 48h) both qualify
    const result = await handleExpiring({ division: "madrid", hours: 50, limit: 10 });

    const spaAPos = result.indexOf(spaADeal.title);
    const gymPos = result.indexOf(gymDeal.title);

    expect(spaAPos).toBeGreaterThanOrEqual(0);
    expect(gymPos).toBeGreaterThanOrEqual(0);
    // spaADeal (12h) must appear before gymDeal (48h)
    expect(spaAPos).toBeLessThan(gymPos);
  });

  it("returns an informative message when nothing expires within the window", async () => {
    // With hours=1 no promotion expires that soon (shortest is spaADeal at 12h)
    const result = await handleExpiring({ division: "madrid", hours: 1, limit: 10 });

    expect(result).toContain("No deals");
  });

  it("returns error message when fetchDeals fails", async () => {
    mockFetchDeals.mockRejectedValue(new Error("Network failure"));
    const result = await handleExpiring({ division: "madrid", hours: 24, limit: 10 });
    expect(result).toContain("Unexpected error");
    expect(result).toContain("Network failure");
  });
});
