export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  get(_key: string): T | undefined {
    throw new Error("not implemented");
  }
  set(_key: string, _value: T, _ttlMs: number): void {
    throw new Error("not implemented");
  }
  has(_key: string): boolean {
    throw new Error("not implemented");
  }
}
