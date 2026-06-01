import type { Deal } from "./groupon/types.js";

export const TTL_BASE_MS = 30 * 60 * 1000;
export const TTL_FLASH_MS = 10 * 60 * 1000;

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

export function selectTtl(deals: Deal[]): number {
  const hasActivePromo = deals.some((d) => d.promotion !== undefined);
  return hasActivePromo ? TTL_FLASH_MS : TTL_BASE_MS;
}

export const dealCache = new Cache<Deal[]>();
