// frontend/src/utils/cacheManager.ts

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new Map();
    this.loadFromLocalStorage();
    this.startCleanupInterval();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Load cache from localStorage on initialization
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem("app_cache");
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([key, value]) => {
          this.cache.set(key, value as CacheItem<any>);
        });
        // Clean expired items
        this.cleanExpired();
      }
    } catch (error) {
      console.error("Failed to load cache from localStorage:", error);
    }
  }

  // Save cache to localStorage
  private saveToLocalStorage(): void {
    try {
      const cacheObject: Record<string, CacheItem<any>> = {};
      this.cache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      localStorage.setItem("app_cache", JSON.stringify(cacheObject));
    } catch (error) {
      console.error("Failed to save cache to localStorage:", error);
    }
  }

  // Set cache item
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    };
    this.cache.set(key, cacheItem);
    this.saveToLocalStorage();
  }

  // Get cache item
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.saveToLocalStorage();
      return null;
    }

    return item.data as T;
  }

  // Check if cache has valid data
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.saveToLocalStorage();
      return false;
    }

    return true;
  }

  // Delete cache item
  delete(key: string): void {
    this.cache.delete(key);
    this.saveToLocalStorage();
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    localStorage.removeItem("app_cache");
  }

  // Clear specific pattern
  clearPattern(pattern: string): void {
    const keys = Array.from(this.cache.keys()).filter((key) =>
      key.includes(pattern),
    );
    keys.forEach((key) => this.cache.delete(key));
    this.saveToLocalStorage();
  }

  // Clean expired items
  private cleanExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((value, key) => {
      if (now > value.expiresAt) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      this.saveToLocalStorage();
    }
  }

  // Start cleanup interval (runs every 5 minutes)
  private startCleanupInterval(): void {
    setInterval(
      () => {
        this.cleanExpired();
      },
      5 * 60 * 1000,
    );
  }

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Invalidate related caches (useful when data changes)
  invalidateRelated(keys: string[]): void {
    keys.forEach((key) => this.delete(key));
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Cache key constants
export const CACHE_KEYS = {
  STUDENTS: "students",
  TEACHERS: "teachers",
  FEE_STRUCTURE: "fee_structure",
  STUDENT_DISCOUNTS: "student_discounts",
  FEE_CHALLANS: "fee_challans",
  PAPER_FUND_CHALLANS: "paper_fund_challans",
  SUBJECTS: "subjects",
  EXAMS: "exams",
  RESULTS: "results",
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000, // 2 minutes - for frequently changing data
  MEDIUM: 5 * 60 * 1000, // 5 minutes - default
  LONG: 15 * 60 * 1000, // 15 minutes - for relatively stable data
  VERY_LONG: 60 * 60 * 1000, // 1 hour - for very stable data
} as const;
