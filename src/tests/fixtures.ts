import type { Deal, DealFeedResponse } from "../groupon/types.js";

const NOW = Date.now();
const inHours = (h: number) => new Date(NOW + h * 3_600_000).toISOString();
const pastHours = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

// 1. Spa A — wellness, madrid, 45% off, €29.99, featured, with promotion
export const spaADeal: Deal = {
  id: "deal-spa-a",
  uuid: "uuid-spa-a",
  title: "Circuito spa y masaje relajante en Bienestar Madrid",
  merchant: "Bienestar Madrid Spa",
  division: "madrid",
  category: "251ce8be-0001-0001-0001-000000000001",
  priceEuros: 29.99,
  originalPriceEuros: 54.53,
  discountPercent: 45,
  currency: "EUR",
  url: "https://www.groupon.es/deals/bienestar-madrid-spa-circuito",
  isFeatured: true,
  ratingValue: 4.5,
  ratingCount: 120,
  badges: [{ type: "POPULAR_GIFT", displayText: "Más vendido" }],
  promotion: {
    code: "VERANO",
    expiresAt: inHours(12),
    priceEuros: 26.99,
  },
};

// 2. Spa B — wellness, madrid, 30% off, €19.99, no promotion
export const spaBDeal: Deal = {
  id: "deal-spa-b",
  uuid: "uuid-spa-b",
  title: "Entrada a bañeras árabes en Hammam Al Ándalus",
  merchant: "Hammam Al Ándalus",
  division: "madrid",
  category: "251ce8be-0001-0001-0001-000000000002",
  priceEuros: 19.99,
  originalPriceEuros: 28.56,
  discountPercent: 30,
  currency: "EUR",
  url: "https://www.groupon.es/deals/hammam-al-andalus-entrada",
  isFeatured: false,
  badges: [],
};

// 3. Restaurant — restaurant, madrid, 60% off, €15.00
export const restaurantDeal: Deal = {
  id: "deal-restaurant",
  uuid: "uuid-restaurant",
  title: "Menú degustación en Restaurante La Terraza de Madrid",
  merchant: "La Terraza de Madrid",
  division: "madrid",
  category: "251ce8be-0002-0002-0002-000000000003",
  priceEuros: 15.0,
  originalPriceEuros: 37.5,
  discountPercent: 60,
  currency: "EUR",
  url: "https://www.groupon.es/deals/la-terraza-menu-degustacion",
  isFeatured: false,
  badges: [{ type: "FLASH", displayText: "Flash" }],
};

// 4. Gym — fitness, barcelona, 50% off, €25.00, with promotion
export const gymDeal: Deal = {
  id: "deal-gym",
  uuid: "uuid-gym",
  title: "3 meses de acceso ilimitado al gimnasio UrbanFit Barcelona",
  merchant: "UrbanFit Barcelona",
  division: "barcelona",
  category: "251ce8be-0003-0003-0003-000000000004",
  priceEuros: 25.0,
  originalPriceEuros: 50.0,
  discountPercent: 50,
  currency: "EUR",
  url: "https://www.groupon.es/deals/urbanfit-3-meses",
  isFeatured: false,
  badges: [],
  promotion: {
    code: "GYM10",
    expiresAt: inHours(48),
    priceEuros: 22.5,
  },
};

// 5. Theatre — entertainment, madrid, 20% off, €35.00
export const theatreDeal: Deal = {
  id: "deal-theatre",
  uuid: "uuid-theatre",
  title: "Entradas para El Rey León en el Teatro Lope de Vega",
  merchant: "Teatro Lope de Vega",
  division: "madrid",
  category: "251ce8be-0004-0004-0004-000000000005",
  priceEuros: 35.0,
  originalPriceEuros: 43.75,
  discountPercent: 20,
  currency: "EUR",
  url: "https://www.groupon.es/deals/teatro-lope-de-vega-rey-leon",
  isFeatured: false,
  badges: [],
};

// 6. Hotel — hotel, madrid, 70% off, €89.00, featured
export const hotelDeal: Deal = {
  id: "deal-hotel",
  uuid: "uuid-hotel",
  title: "Noche en habitación doble con desayuno en Hotel Gran Vía Palace",
  merchant: "Hotel Gran Vía Palace",
  division: "madrid",
  category: "251ce8be-0005-0005-0005-000000000006",
  priceEuros: 89.0,
  originalPriceEuros: 296.67,
  discountPercent: 70,
  currency: "EUR",
  url: "https://www.groupon.es/deals/hotel-gran-via-palace-noche",
  isFeatured: true,
  ratingValue: 4.8,
  ratingCount: 500,
  badges: [{ type: "SPECIAL", displayText: "Oferta especial" }],
};

// A deal whose promotion has already expired — for expiring edge-case tests
export const expiredDeal: Deal = {
  id: "deal-expired",
  uuid: "uuid-expired",
  title: "Tratamiento facial exprés en Centro Estética Moreno",
  merchant: "Centro Estética Moreno",
  division: "madrid",
  category: "251ce8be-0001-0001-0001-000000000099",
  priceEuros: 18.0,
  originalPriceEuros: 40.0,
  discountPercent: 55,
  currency: "EUR",
  url: "https://www.groupon.es/deals/estetica-moreno-facial",
  isFeatured: false,
  badges: [],
  promotion: {
    code: "EXPIRED",
    expiresAt: pastHours(3),
    priceEuros: 16.0,
  },
};

export const DEALS: Deal[] = [
  spaADeal,
  spaBDeal,
  restaurantDeal,
  gymDeal,
  theatreDeal,
  hotelDeal,
];

export function makeFeedResponse(deals: Deal[], division = "madrid"): DealFeedResponse {
  return {
    deals,
    pagination: {
      page: 1,
      limit: deals.length,
      totalCount: deals.length,
      totalPages: 1,
    },
    division,
    fetchedAt: new Date().toISOString(),
  };
}
