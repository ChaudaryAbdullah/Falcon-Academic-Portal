const cache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

export const cacheMiddleware = (duration = CACHE_DURATION) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse && cachedResponse.timestamp > Date.now() - duration) {
      return res.json(cachedResponse.data);
    }

    // Store original res.json
    const originalJson = res.json.bind(res);

    // Override res.json
    res.json = (data) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
      });

      // Clean old cache entries
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }

      return originalJson(data);
    };

    next();
  };
};

// Clear cache helper
export const clearCache = () => {
  cache.clear();
};
