const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient;

const initializeCache = async () => {
  try {
    // Skip Redis in test environment or if not configured
    if (process.env.NODE_ENV === 'test' || !process.env.REDIS_URL) {
      logger.info('Cache disabled (test environment or no Redis URL)');
      return null;
    }

    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          logger.error('Redis connection failed after 3 retries');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error:', err);
    });

    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('Cache initialization failed:', error);
    // Don't throw - allow app to run without cache
    return null;
  }
};

const disconnectCache = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Cache connection closed');
  }
};

const getCache = () => redisClient;

const getCacheKey = (prefix, ...parts) => {
  return `postal:${prefix}:${parts.join(':')}`;
};

const cacheGet = async (key) => {
  if (!redisClient) return null;
  
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

const cacheSet = async (key, value, ttl = 3600) => {
  if (!redisClient) return false;
  
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
};

const cacheDel = async (pattern) => {
  if (!redisClient) return false;
  
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
};

module.exports = {
  initializeCache,
  disconnectCache,
  getCache,
  getCacheKey,
  cacheGet,
  cacheSet,
  cacheDel,
};