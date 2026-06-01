import type { Deal, RawCard } from "./types.js";

export function parseDeals(rawCards: RawCard[], division: string): Deal[] {
  return rawCards.map((card) => parseCard(card, division));
}

function parseCard(card: RawCard, division: string): Deal {
  return {
    id: card.id ?? card.uuid,
    title: card.title,
    description: card.shortDescription,
    merchant: card.merchant.name,
    division,
    category: card.categoryGuid,
    originalPrice: card.value.amount,
    discountedPrice: card.price.amount,
    discountPercent: card.discountPercent,
    currency: card.price.currency,
    url: card.url,
    imageUrl: card.imageUrl,
    soldCount: card.soldCount,
    remainingCount: card.remainingCount,
    expiresAt: card.expiresAt,
    badges: card.badges.map((b) => ({ label: b.label, type: b.badgeType })),
    promotions: card.promotions.map((p) => ({
      code: p.code,
      discount: p.discountPercentage,
      description: p.description,
    })),
    flashSale: card.flashSale
      ? {
          startsAt: card.flashSale.startDateTime,
          endsAt: card.flashSale.endDateTime,
          discountPercent: card.flashSale.discountPercent,
        }
      : undefined,
    isFeatured: card.isFeatured ?? false,
  };
}
