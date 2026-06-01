import { dealCache, selectTtl } from "../cache.js";
import { DIVISIONS } from "./divisions.js";
import { parseDeals } from "./parser.js";
import type { DealFeedResponse, RawCard, RawGraphQLResponse } from "./types.js";

type Division = typeof DIVISIONS[number];

const API_URL = "https://www.groupon.es/mobilenextapi/graphql";
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

const GQL_QUERY = `
  query getHomepageV2DealFeed($offset: Int!, $feedToken: String) {
    getHomepageV2DealFeed(offset: $offset, feedToken: $feedToken) {
      cards {
        uuid
        id
        title
        shortDescription
        merchant { name }
        division
        categoryGuid
        price { amount currency formattedPrice }
        value { amount currency formattedPrice }
        discountPercent
        url
        imageUrl
        soldCount
        remainingCount
        expiresAt
        isFeatured
        badges { label badgeType }
        promotions { code discountPercentage description }
        flashSale { startDateTime endDateTime discountPercent }
      }
      pagination { nextOffset feedToken totalCount }
    }
  }
`;

function buildHeaders(division: string): Record<string, string> {
  return {
    "content-type": "application/json",
    "apollographql-client-name": "MBNXT Web: Pages Router",
    "x-mbnxt-gql-source": "client",
    "cookie": `division=${division}; user_locale=es_ES`,
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    "origin": "https://www.groupon.es",
    "referer": "https://www.groupon.es/",
  };
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
    const variables: Record<string, unknown> = { offset };
    if (feedToken !== null) variables["feedToken"] = feedToken;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: buildHeaders(division),
      body: JSON.stringify({ query: GQL_QUERY, variables }),
    });

    if (!response.ok) {
      throw new GrouponApiError(`Groupon API error: ${response.statusText}`, response.status);
    }

    const json = (await response.json()) as RawGraphQLResponse;

    if (json.errors && json.errors.length > 0) {
      throw new GrouponApiError(
        `GraphQL errors: ${json.errors.map((e) => e.message).join("; ")}`,
        200
      );
    }

    const feed = json.data.getHomepageV2DealFeed;
    allCards.push(...feed.cards);
    pagesFetched++;

    const { nextOffset, feedToken: nextToken } = feed.pagination;

    if (nextOffset === null || feed.cards.length < PAGE_SIZE) {
      break;
    }

    offset = nextOffset;
    feedToken = nextToken;
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
