import { createClient, RedisClientType } from 'redis';

export class CacheClient {
  private client: RedisClientType | null = null;
  private isConnected = false;
  private readonly TTL_SECONDS = 300; // 5 minutes

  constructor() {
    // Fire-and-forget: don't block app startup
    this.initializeClient().catch(() => { });
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          connectTimeout: 3000, // 3 second timeout
          reconnectStrategy: (retries) => {
            if (retries >= 3) {
              // Stop trying after 3 attempts — Redis is likely intentionally off
              console.warn('[Redis] Not available — running without cache.');
              return false as unknown as number; // stop reconnecting
            }
            return Math.min(retries * 200, 2000);
          },
        },
      });

      this.client.on('error', () => {
        // Suppress noisy error logs when Redis is intentionally unavailable
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('[Redis] Connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('[Redis] Not available — running without cache.');
      this.client = null;
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      console.warn('Redis not available, cache miss for key:', key);
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value === null) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error for key', key, ':', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      console.warn('Redis not available, skipping cache set for key:', key);
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      const ttl = ttlSeconds || this.TTL_SECONDS;
      await this.client.setEx(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Redis set error for key', key, ':', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      console.warn('Redis not available, skipping cache delete for key:', key);
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis delete error for key', key, ':', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      console.warn('Redis not available, skipping cache flush');
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error('Redis flush error:', error);
      return false;
    }
  }

  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
      } catch (error) {
        console.error('Error disconnecting Redis client:', error);
      }
    }
  }

  // Generate cache keys for analytics
  generateAnalyticsKey(metric: string, dateRange: string, granularity?: string): string {
    const parts = ['analytics', metric, dateRange];
    if (granularity) {
      parts.push(granularity);
    }
    return parts.join(':');
  }
}

// Singleton instance
export const cacheClient = new CacheClient();