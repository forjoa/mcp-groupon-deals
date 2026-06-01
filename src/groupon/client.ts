import type { DealFeedResponse } from "./types.js";

export interface FetchDealsParams {
  division: string;
  query?: string;
  page?: number;
  limit?: number;
}

export async function fetchDeals(_params: FetchDealsParams): Promise<DealFeedResponse> {
  throw new Error("not implemented");
}
