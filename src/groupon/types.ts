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
