export interface Badge {
  label: string;
  type: string;
}

export interface Promotion {
  code: string;
  discount: number;
  description?: string;
}

export interface FlashSale {
  startsAt: string;
  endsAt: string;
  discountPercent: number;
}

export interface Deal {
  id: string;
  title: string;
  description?: string;
  merchant: string;
  division: string;
  category?: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercent: number;
  currency: string;
  url: string;
  imageUrl?: string;
  soldCount?: number;
  remainingCount?: number;
  expiresAt?: string;
  badges: Badge[];
  promotions: Promotion[];
  flashSale?: FlashSale;
  isFeatured: boolean;
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

// --- Raw API response types (GraphQL) ---

export interface RawPaginationInfo {
  nextOffset: number | null;
  feedToken: string | null;
  totalCount?: number;
}

export interface RawPrice {
  amount: number;
  currency: string;
  formattedPrice: string;
}

export interface RawFlashSale {
  startDateTime: string;
  endDateTime: string;
  discountPercent: number;
}

export interface RawPromotion {
  code: string;
  discountPercentage: number;
  description?: string;
}

export interface RawBadge {
  label: string;
  badgeType: string;
}

export interface RawMerchant {
  name: string;
}

export interface RawCard {
  uuid: string;
  id?: string;
  title: string;
  shortDescription?: string;
  merchant: RawMerchant;
  division: string;
  categoryGuid?: string;
  price: RawPrice;
  value: RawPrice;
  discountPercent: number;
  url: string;
  imageUrl?: string;
  soldCount?: number;
  remainingCount?: number;
  expiresAt?: string;
  badges: RawBadge[];
  promotions: RawPromotion[];
  flashSale?: RawFlashSale;
  isFeatured?: boolean;
}

export interface RawDealFeedData {
  cards: RawCard[];
  pagination: RawPaginationInfo;
}

export interface RawGraphQLResponse {
  data: {
    getHomepageV2DealFeed: RawDealFeedData;
  };
  errors?: { message: string }[];
}
