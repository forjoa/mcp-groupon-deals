import type { Deal, RawCard } from "./types.js";

export function parseDeals(rawCards: RawCard[], division: string): Deal[] {
  return rawCards.map((card) => parseCard(card, division));
}

function parseCard(card: RawCard, division: string): Deal {
  const priceEuros = card.prices.price.amount / 100;
  const originalPriceEuros = card.prices.strikeThroughPrice
    ? card.prices.strikeThroughPrice.amount / 100
    : priceEuros;

  const closest = card.locationsSummary?.closest ?? null;

  return {
    id: card.id,
    uuid: card.uuid,
    title: card.title,
    merchant: card.merchant.name,
    division,
    category: card.categoryGuid,
    priceEuros,
    originalPriceEuros,
    discountPercent: card.discountPercentage,
    currency: card.prices.price.currencyCode,
    url: card.url,
    imageUrl: card.imageUrls.medium,
    ratingValue: card.rating?.value,
    ratingCount: card.rating?.count,
    locationAddress: closest?.address,
    locationName: closest?.name,
    locationLat: closest?.lat,
    locationLng: closest?.lng,
    badges: card.badges.map((b) => ({ type: b.badgeType, displayText: b.displayText })),
    promotion: card.promotion
      ? {
          code: card.promotion.promoCode,
          expiresAt: card.promotion.expiration,
          priceEuros: card.promotion.price.amount / 100,
        }
      : undefined,
    isFeatured: card.flags.isTopRatedDeal,
  };
}
