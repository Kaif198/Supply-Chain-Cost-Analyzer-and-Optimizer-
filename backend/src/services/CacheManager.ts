import { cacheClient } from '../utils/redis';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  key: string;
  namespace: string;
}

export interface CacheStats {
  hitCount: number;
  missCount: number;
  hitRate: number;
}

/**
 * CacheManager provides a high-level interface for caching with TTL support
 * and namespace-based key management
 */
export class CacheManager {
  private stats = {
    hits: 0,
    misses: 0,
  };

  /**
   * Get cached data if available and not expired
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await cacheClient.get<T>(key);
    
    if (data !== null) {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    return data;
  }

  /**
   * Store data in cache with TTL
   */
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    await cacheClient.set(key, data, ttl);
  }

  /**
   * Check if cached data exists and is fresh
   */
  async has(key: string): Promise<boolean> {
    const data = await cacheClient.get(key);
    return data !== null;
  }

  /**
   * Invalidate cached data
   */
  async invalidate(key: string): Promise<void> {
    await cacheClient.del(key);
  }

  /**
   * Get cache statistics (hit rate, miss rate)
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;
    
    return {
      hitCount: this.stats.hits,
      missCount: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  /**
   * Generate namespaced cache key
   */
  generateKey(namespace: string, ...parts: string[]): string {
    return [namespace, ...parts].join(':');
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
