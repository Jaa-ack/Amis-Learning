// 簡單的記憶體快取層，用於減少重複資料庫查詢
// 適用於變化不頻繁的資料（如 dialects）

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTLSeconds: number = 300) {
    // 預設 5 分鐘
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // 自動清理過期項目
    setTimeout(() => {
      const entry = this.cache.get(key);
      if (entry && Date.now() - entry.timestamp >= ttl) {
        this.cache.delete(key);
      }
    }, ttl);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  // 支援模式匹配清除
  invalidatePattern(pattern: RegExp): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach((key) => {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    });
  }
}

// 全域快取實例（dialect 資料很少變動，可以快取 10 分鐘）
export const dialectCache = new SimpleCache(600);

// 卡片資料快取（較短時間，避免學習進度不同步）
export const cardCache = new SimpleCache(60);
