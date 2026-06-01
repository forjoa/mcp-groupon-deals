export const DIVISIONS = [
  "madrid",
  "barcelona",
  "valencia",
  "sevilla",
  "bilbao",
  "malaga",
  "zaragoza",
  "murcia",
  "palma",
  "alicante",
  "valladolid",
  "granada",
] as const;

export type Division = typeof DIVISIONS[number];
