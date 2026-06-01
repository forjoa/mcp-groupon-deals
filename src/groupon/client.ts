import { dealCache, selectTtl } from "../cache.js";
import { getCookieHeader } from "./cookieManager.js";
import { DIVISIONS } from "./divisions.js";
import { parseDeals } from "./parser.js";
import type { DealFeedResponse, RawCard, RawGraphQLResponse } from "./types.js";

type Division = typeof DIVISIONS[number];

const API_URL = "https://www.groupon.es/mobilenextapi/graphql";
const PERSISTED_QUERY_HASH = "c2f9fe8c3d8a58ce8b4f29c187cfbda0bc29013867fcd82a847fae33f93f4ada";
const PAGE_SIZE = 18;
const DEFAULT_MAX_PAGES = 3;

export interface FetchDealsParams {
  division: Division;
  maxPages?: number;
}

export class GrouponApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "GrouponApiError";
  }
}

async function buildHeaders(division: string): Promise<Record<string, string>> {
  const cookieHeader = await getCookieHeader(division);
  return {
    "content-type": "application/json",
    "accept": "application/json",
    "accept-language": "es-ES,es;q=0.9",
    "apollographql-client-name": "MBNXT Web: Pages Router",
    "x-mbnxt-gql-source": "client",
    "cookie": cookieHeader,
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    "origin": "https://www.groupon.es",
    "referer": "https://www.groupon.es/",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
  };
}

function buildBody(division: string, offset: number, feedToken: string | null): string {
  const dealFeedParams: Record<string, unknown> = {
    limit: PAGE_SIZE,
    division,
    pageName: "homepage",
    pageType: "homepage_all",
    filters: [],
    offset,
  };
  if (feedToken !== null) dealFeedParams["feedToken"] = feedToken;

  return JSON.stringify([{
    operationName: "getHomepageV2DealFeed",
    variables: { dealFeedParams },
    extensions: {
      persistedQuery: { version: 1, sha256Hash: PERSISTED_QUERY_HASH },
    },
  }]);
}

export async function fetchDeals(params: FetchDealsParams): Promise<DealFeedResponse> {
  const { division, maxPages = DEFAULT_MAX_PAGES } = params;

  const cached = dealCache.get(division);
  if (cached !== undefined) {
    return {
      deals: cached,
      pagination: { page: 1, limit: cached.length, totalCount: cached.length, totalPages: 1 },
      division,
      fetchedAt: new Date().toISOString(),
    };
  }

  const allCards: RawCard[] = [];
  let offset = 0;
  let feedToken: string | null = null;
  let pagesFetched = 0;

  while (pagesFetched < maxPages) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: await buildHeaders(division),
      body: buildBody(division, offset, feedToken),
    });

    if (!response.ok) {
      throw new GrouponApiError(`Groupon API error: ${response.statusText}`, response.status);
    }

    const json = (await response.json()) as RawGraphQLResponse[];
    const gqlResponse = json[0];

    if (gqlResponse.errors && gqlResponse.errors.length > 0) {
      throw new GrouponApiError(
        `GraphQL errors: ${gqlResponse.errors.map((e) => e.message).join("; ")}`,
        200
      );
    }

    const feed = gqlResponse.data.queryDealFeed;
    allCards.push(...feed.cards);
    pagesFetched++;

    const nextFeedToken = feed.pagination?.feedToken ?? null;
    if (feed.cards.length < PAGE_SIZE || nextFeedToken === null) break;

    offset += PAGE_SIZE;
    feedToken = nextFeedToken;
  }

  const deals = parseDeals(allCards, division);
  const ttl = selectTtl(deals);
  dealCache.set(division, deals, ttl);

  return {
    deals,
    pagination: {
      page: pagesFetched,
      limit: PAGE_SIZE,
      totalCount: deals.length,
      totalPages: pagesFetched,
    },
    division,
    fetchedAt: new Date().toISOString(),
  };
}
