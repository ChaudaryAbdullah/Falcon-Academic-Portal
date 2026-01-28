// middleware/redisCache.js
// Optional: Use Redis for production caching instead of node-cache

import Redis from "ioredis";

let redisClient = null;
let isRedisAvailable = false;

// Try to connect to Redis
try {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn(
          "⚠️  Redis connection failed, falling back to memory cache",
        );
        return null;
      }
      return Math.min(times * 100, 3000);
    },
  });

  redisClient.on("connect", () => {
    console.log("✅ Redis connected successfully");
    isRedisAvailable = true;
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err.message);
    isRedisAvailable = false;
  });
} catch (error) {
  console.warn("⚠️  Redis not available, using memory cache");
  isRedisAvailable = false;
}

// Fallback in-memory cache
import NodeCache from "node-cache";
const memoryCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

class CacheService {
  async get(key) {
    try {
      if (isRedisAvailable && redisClient) {
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
      } else {
        return memoryCache.get(key) || null;
      }
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      if (isRedisAvailable && redisClient) {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        memoryCache.set(key, value, ttlSeconds);
      }
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  async del(key) {
    try {
      if (isRedisAvailable && redisClient) {
        await redisClient.del(key);
      } else {
        memoryCache.del(key);
      }
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  async flush() {
    try {
      if (isRedisAvailable && redisClient) {
        await redisClient.flushdb();
      } else {
        memoryCache.flushAll();
      }
      return true;
    } catch (error) {
      console.error("Cache flush error:", error);
      return false;
    }
  }

  async keys(pattern) {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.keys(pattern);
      } else {
        return memoryCache.keys().filter((key) => key.match(pattern));
      }
    } catch (error) {
      console.error("Cache keys error:", error);
      return [];
    }
  }

  async deletePattern(pattern) {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        if (isRedisAvailable && redisClient) {
          await redisClient.del(...keys);
        } else {
          keys.forEach((key) => memoryCache.del(key));
        }
      }
      return keys.length;
    } catch (error) {
      console.error("Cache delete pattern error:", error);
      return 0;
    }
  }

  isAvailable() {
    return isRedisAvailable;
  }

  getType() {
    return isRedisAvailable ? "Redis" : "Memory";
  }
}

export const cacheService = new CacheService();

// Middleware for caching GET requests
export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Create cache key from URL and query params
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      // Check cache
      const cachedData = await cacheService.get(key);

      if (cachedData) {
        console.log(`🎯 Cache HIT: ${key}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${key}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json
      res.json = (data) => {
        // Cache the response
        cacheService.set(key, data, duration);
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next();
    }
  };
};

// Clear cache helper for routes
export const clearCachePattern = async (pattern) => {
  return await cacheService.deletePattern(pattern);
};

export default cacheService;
