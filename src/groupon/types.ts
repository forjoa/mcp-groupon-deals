// Normalized Deal (what tools work with)
export interface Deal {
  id: string;
  uuid: string;
  title: string;
  merchant: string;
  division: string;
  category?: string;
  priceEuros: number;           // discounted price in euros (amount / 100)
  originalPriceEuros: number;   // strike-through price in euros
  discountPercent: number;      // discountPercentage from API
  currency: string;
  url: string;
  imageUrl?: string;
  ratingValue?: number;
  ratingCount?: number;
  locationAddress?: string;
  locationName?: string;
  locationLat?: number;
  locationLng?: number;
  badges: Badge[];
  promotion?: Promotion;
  isFeatured: boolean;
}

export interface Badge {
  type: string;
  displayText: string;
}

export interface Promotion {
  code: string;
  expiresAt: string;
  priceEuros: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface DealFeedResponse {
  deals: Deal[];
  pagination: PaginationInfo;
  division: string;
  fetchedAt: string;
}

// Raw API types
export interface RawPrice {
  amount: number;
  currencyCode: string;
  currencyExponent: number;
}

export interface RawMerchant {
  name: string;
  rating: null | { value: number; count: number };
}

export interface RawPromotion {
  promoCode: string;
  expiration: string;
  price: RawPrice;
}

export interface RawBadge {
  badgeType: string;
  displayText: string;
}

export interface RawLocation {
  lat: number;
  lng: number;
  address: string;
  name: string;
}

export interface RawLocationsSummary {
  total: number;
  closest: RawLocation | null;
}

export interface RawImageUrls {
  medium: string;
  large?: string;
}

export interface RawRating {
  value: number;
  count: number;
}

export interface RawFlags {
  isTopRatedDeal: boolean;
}

export interface RawCard {
  id: string;
  uuid: string;
  url: string;
  title: string;
  categoryGuid?: string;
  prices: {
    price: RawPrice;
    strikeThroughPrice: RawPrice | null;
  };
  merchant: RawMerchant;
  promotion: RawPromotion | null;
  imageUrls: RawImageUrls;
  rating: RawRating | null;
  badges: RawBadge[];
  discountPercentage: number;
  locationsSummary: RawLocationsSummary | null;
  flags: RawFlags;
  invalidateAt: string | null;
}

export interface RawPaginationInfo {
  feedToken: string | null;
  totalCount?: number;
}

export interface RawDealFeedData {
  cards: RawCard[];
  pagination: RawPaginationInfo | null;
}

export interface RawGraphQLResponse {
  data: {
    queryDealFeed: RawDealFeedData;
  };
  errors?: { message: string }[];
}
