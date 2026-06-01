import type { Deal, DealFeedResponse } from "../groupon/types.js";

const NOW = Date.now();
const inHours = (h: number) => new Date(NOW + h * 3_600_000).toISOString();
const pastHours = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

// 1. Spa A — wellness, madrid, 45% off, €29.99, expires in 48h, flash sale, featured
export const spaADeal: Deal = {
  id: "deal-spa-a",
  title: "Circuito spa y masaje relajante en Bienestar Madrid",
  merchant: "Bienestar Madrid Spa",
  division: "madrid",
  category: "Salud y Belleza",
  originalPrice: 54.53,
  discountedPrice: 29.99,
  discountPercent: 45,
  currency: "EUR",
  url: "https://www.groupon.es/madrid/deals/bienestar-madrid-spa-circuito",
  isFeatured: true,
  expiresAt: inHours(48),
  badges: [{ label: "Más vendido", type: "bestseller" }],
  promotions: [],
  flashSale: {
    startsAt: new Date(NOW - 3_600_000).toISOString(),
    endsAt: inHours(12),
    discountPercent: 10,
  },
};

// 2. Spa B — wellness, madrid, 30% off, €19.99, no expiry, no flash sale
export const spaBDeal: Deal = {
  id: "deal-spa-b",
  title: "Entrada a bañeras árabes en Hammam Al Ándalus",
  merchant: "Hammam Al Ándalus",
  division: "madrid",
  category: "Salud y Belleza",
  originalPrice: 28.56,
  discountedPrice: 19.99,
  discountPercent: 30,
  currency: "EUR",
  url: "https://www.groupon.es/madrid/deals/hammam-al-andalus-entrada",
  isFeatured: false,
  badges: [],
  promotions: [],
};

// 3. Restaurant — restaurant, madrid, 60% off, €15.00, expires in 2h
export const restaurantDeal: Deal = {
  id: "deal-restaurant",
  title: "Menú degustación en Restaurante La Terraza de Madrid",
  merchant: "La Terraza de Madrid",
  division: "madrid",
  category: "Restaurantes",
  originalPrice: 37.5,
  discountedPrice: 15.0,
  discountPercent: 60,
  currency: "EUR",
  url: "https://www.groupon.es/madrid/deals/la-terraza-menu-degustacion",
  isFeatured: false,
  expiresAt: inHours(2),
  badges: [{ label: "Flash", type: "flash" }],
  promotions: [],
};

// 4. Gym — fitness, barcelona, 50% off, €25.00, has promotion
export const gymDeal: Deal = {
  id: "deal-gym",
  title: "3 meses de acceso ilimitado al gimnasio UrbanFit Barcelona",
  merchant: "UrbanFit Barcelona",
  division: "barcelona",
  category: "Deporte y Fitness",
  originalPrice: 50.0,
  discountedPrice: 25.0,
  discountPercent: 50,
  currency: "EUR",
  url: "https://www.groupon.es/barcelona/deals/urbanfit-3-meses",
  isFeatured: false,
  badges: [],
  promotions: [{ code: "GYM10", discount: 10, description: "10% extra en primer mes" }],
};

// 5. Theatre — entertainment, madrid, 20% off, €35.00, expires in 100h
export const theatreDeal: Deal = {
  id: "deal-theatre",
  title: "Entradas para El Rey León en el Teatro Lope de Vega",
  merchant: "Teatro Lope de Vega",
  division: "madrid",
  category: "Ocio y Entretenimiento",
  originalPrice: 43.75,
  discountedPrice: 35.0,
  discountPercent: 20,
  currency: "EUR",
  url: "https://www.groupon.es/madrid/deals/teatro-lope-de-vega-rey-leon",
  isFeatured: false,
  expiresAt: inHours(100),
  badges: [],
  promotions: [],
};

// 6. Hotel — hotel, madrid, 70% off, €89.00, featured, flash sale
export const hotelDeal: Deal = {
  id: "deal-hotel",
  title: "Noche en habitación doble con desayuno en Hotel Gran Vía Palace",
  merchant: "Hotel Gran Vía Palace",
  division: "madrid",
  category: "Viajes y Hoteles",
  originalPrice: 296.67,
  discountedPrice: 89.0,
  discountPercent: 70,
  currency: "EUR",
  url: "https://www.groupon.es/madrid/deals/hotel-gran-via-palace-noche",
  isFeatured: true,
  badges: [{ label: "Oferta especial", type: "special" }],
  promotions: [],
  flashSale: {
    startsAt: new Date(NOW - 1_800_000).toISOString(),
    endsAt: inHours(6),
    discountPercent: 15,
  },
};

// A deal that is already expired — for expiring edge-case tests
export const expiredDeal: Deal = {
  id: "deal-expired",
  title: "Tratamiento facial exprés en Centro Estética Moreno",
  merchant: "Centro Estética Moreno",
  division: "madrid",
  category: "Salud y Belleza",
  originalPrice: 40.0,
  discountedPrice: 18.0,
  discountPercent: 55,
  currency: "EUR",
  url: "https://www.groupon.es/madrid/deals/estetica-moreno-facial",
  isFeatured: false,
  expiresAt: pastHours(3),
  badges: [],
  promotions: [],
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
