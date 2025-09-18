/**
 * Dashboard 数据缓存管理
 * 实现5分钟缓存策略，减少API调用
 * Requirements: 设计2.5.3
 */

class DashboardCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟
    this.memoryLimit = 50; // 最多缓存50个条目
  }

  /**
   * 生成缓存键
   */
  generateKey(type, ...params) {
    return `${type}:${params.join(':')}`;
  }

  /**
   * 获取缓存数据
   */
  get(key) {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问时间（LRU）
    cached.lastAccessed = Date.now();
    return cached.data;
  }

  /**
   * 设置缓存数据
   */
  set(key, data) {
    // 检查内存限制
    if (this.cache.size >= this.memoryLimit) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  /**
   * 清除最旧的缓存项（LRU）
   */
  evictOldest() {
    let oldestKey = null;
    let oldestTime = Date.now();

    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 清除特定类型的缓存
   */
  clearByType(type) {
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 清除所有缓存
   */
  clear() {
    this.cache.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const stats = {
      size: this.cache.size,
      limit: this.memoryLimit,
      items: []
    };

    for (const [key, value] of this.cache.entries()) {
      const age = Date.now() - value.timestamp;
      const ttl = this.cacheTimeout - age;

      stats.items.push({
        key,
        age: Math.floor(age / 1000), // 秒
        ttl: Math.floor(ttl / 1000), // 秒
        size: JSON.stringify(value.data).length
      });
    }

    return stats;
  }
}

// 创建单例实例
const dashboardCache = new DashboardCache();

/**
 * 缓存装饰器
 * 用于包装API调用函数
 */
export const withCache = (fn, cacheKey, customTimeout) => {
  return async (...args) => {
    const key = typeof cacheKey === 'function'
      ? cacheKey(...args)
      : dashboardCache.generateKey(cacheKey, ...args);

    // 尝试从缓存获取
    const cached = dashboardCache.get(key);
    if (cached) {
      console.log(`Cache hit: ${key}`);
      return cached;
    }

    // 调用原函数
    console.log(`Cache miss: ${key}`);
    const result = await fn(...args);

    // 存入缓存
    if (result) {
      dashboardCache.set(key, result);
    }

    return result;
  };
};

/**
 * React Hook: 使用缓存的数据
 */
export const useCachedData = (key, fetcher, dependencies = []) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 先检查缓存
        const cached = dashboardCache.get(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // 获取新数据
        const result = await fetcher();

        // 更新缓存和状态
        dashboardCache.set(key, result);
        setData(result);
      } catch (err) {
        console.error(`Error fetching data for key ${key}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error, refresh: () => fetchData() };
};

/**
 * 预加载数据到缓存
 */
export const preloadCache = async (items) => {
  const promises = items.map(async ({ key, fetcher }) => {
    try {
      const data = await fetcher();
      dashboardCache.set(key, data);
      return { key, success: true };
    } catch (error) {
      console.error(`Failed to preload ${key}:`, error);
      return { key, success: false, error };
    }
  });

  return Promise.all(promises);
};

export default dashboardCache;