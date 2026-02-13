import Redis from 'ioredis';

/**
 * Redis cache client using ioredis
 */
export class Cache {
  private redis: Redis;
  private ttl: number;

  constructor(redisUrl: string, ttl: number = 86400) {
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    this.ttl = ttl;
  }

  /**
   * Connect to Redis
   */
  async connect(): Promise<void> {
    await this.redis.connect();
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttl || this.ttl, serialized);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete a key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Health check - verify Redis is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close the Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

/**
 * Singleton cache instance
 */
let cacheInstance: Cache | null = null;

export function getCache(redisUrl?: string, ttl?: number): Cache {
  if (!cacheInstance) {
    const url = redisUrl || process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL is not set');
    }
    const cacheTtl = ttl || parseInt(process.env.CACHE_TTL || '86400', 10);
    cacheInstance = new Cache(url, cacheTtl);
  }
  return cacheInstance;
}
