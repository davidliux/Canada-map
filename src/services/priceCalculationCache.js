// Price Calculation Cache
// 价格计算缓存 - 减少重复计算，提高响应速度

/**
 * 价格计算缓存类
 * 使用 Map 存储计算结果，支持 TTL 过期
 */
class PriceCalculationCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.ttl = options.ttl || 5 * 60 * 1000; // 默认5分钟缓存
    this.maxSize = options.maxSize || 1000; // 最大缓存条目数
    this.hits = 0;
    this.misses = 0;

    // 定期清理过期缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, options.cleanupInterval || 60 * 1000); // 每分钟清理一次
  }

  /**
   * 生成缓存键
   * @param {string} cityId 城市ID
   * @param {string} zoneId 区域ID
   * @param {number} quantity 数量
   * @param {string} mode 定价模式
   * @param {Object} options 额外选项
   * @returns {string} 缓存键
   */
  getCacheKey(cityId, zoneId, quantity, mode, options = {}) {
    const optionsStr = Object.keys(options)
      .sort()
      .map(key => `${key}:${options[key]}`)
      .join('|');

    return `${cityId}:${zoneId}:${quantity}:${mode}:${optionsStr}`;
  }

  /**
   * 获取缓存的价格计算结果
   * @param {string} key 缓存键
   * @returns {Object|null} 缓存的结果或null
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.result;
  }

  /**
   * 设置缓存
   * @param {string} key 缓存键
   * @param {Object} result 计算结果
   * @param {number} customTTL 自定义TTL（可选）
   */
  set(key, result, customTTL = null) {
    // 如果缓存已满，删除最少访问的条目
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      result: result,
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0,
      ttl: customTTL || this.ttl
    });
  }

  /**
   * 批量获取缓存
   * @param {Array<string>} keys 缓存键数组
   * @returns {Object} 键值对结果
   */
  getMultiple(keys) {
    const results = {};

    keys.forEach(key => {
      const value = this.get(key);
      if (value !== null) {
        results[key] = value;
      }
    });

    return results;
  }

  /**
   * 批量设置缓存
   * @param {Object} entries 键值对
   * @param {number} customTTL 自定义TTL（可选）
   */
  setMultiple(entries, customTTL = null) {
    Object.entries(entries).forEach(([key, value]) => {
      this.set(key, value, customTTL);
    });
  }

  /**
   * 清除特定城市或区域的缓存
   * @param {string} pattern 匹配模式
   */
  clear(pattern = '') {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`清理了 ${keysToDelete.length} 个过期的价格缓存条目`);
    }
  }

  /**
   * LRU驱逐策略 - 删除最少访问的条目
   */
  evictLRU() {
    let lruKey = null;
    let lruAccessTime = Date.now();
    let lruAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // 优先删除访问次数少的，其次删除最久未访问的
      if (entry.accessCount < lruAccessCount ||
          (entry.accessCount === lruAccessCount && entry.lastAccessed < lruAccessTime)) {
        lruKey = key;
        lruAccessTime = entry.lastAccessed;
        lruAccessCount = entry.accessCount;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * 预热缓存
   * @param {Function} calculateFunction 计算函数
   * @param {Array} configurations 配置数组
   */
  async warmup(calculateFunction, configurations) {
    const promises = configurations.map(async (config) => {
      const { cityId, zoneId, quantity, mode, options } = config;
      const key = this.getCacheKey(cityId, zoneId, quantity, mode, options);

      // 如果已存在且未过期，跳过
      if (this.get(key)) {
        return null;
      }

      try {
        const result = await calculateFunction(cityId, zoneId, quantity, options);
        this.set(key, result);
        return { key, success: true };
      } catch (error) {
        console.error(`预热缓存失败 - ${key}:`, error);
        return { key, success: false, error };
      }
    });

    const results = await Promise.all(promises);
    const successful = results.filter(r => r && r.success).length;

    console.log(`缓存预热完成: ${successful}/${configurations.length} 成功`);
    return results;
  }

  /**
   * 获取缓存统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    const validEntries = entries.filter(([_, entry]) =>
      now - entry.timestamp <= entry.ttl
    );

    const totalAccessCount = validEntries.reduce((sum, [_, entry]) =>
      sum + entry.accessCount, 0
    );

    return {
      size: this.cache.size,
      validSize: validEntries.length,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) + '%'
        : '0%',
      totalAccessCount,
      averageAccessCount: validEntries.length > 0
        ? (totalAccessCount / validEntries.length).toFixed(2)
        : 0,
      oldestEntry: validEntries.length > 0
        ? new Date(Math.min(...validEntries.map(([_, entry]) => entry.timestamp)))
        : null,
      newestEntry: validEntries.length > 0
        ? new Date(Math.max(...validEntries.map(([_, entry]) => entry.timestamp)))
        : null
    };
  }

  /**
   * 导出缓存数据
   * @returns {Array} 缓存条目数组
   */
  export() {
    const entries = [];
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp <= entry.ttl) {
        entries.push({
          key,
          result: entry.result,
          timestamp: entry.timestamp,
          lastAccessed: entry.lastAccessed,
          accessCount: entry.accessCount,
          ttl: entry.ttl
        });
      }
    }

    return entries;
  }

  /**
   * 导入缓存数据
   * @param {Array} entries 缓存条目数组
   */
  import(entries) {
    const now = Date.now();
    let imported = 0;

    entries.forEach(entry => {
      // 只导入未过期的条目
      if (now - entry.timestamp <= entry.ttl) {
        this.cache.set(entry.key, {
          result: entry.result,
          timestamp: entry.timestamp,
          lastAccessed: entry.lastAccessed || entry.timestamp,
          accessCount: entry.accessCount || 0,
          ttl: entry.ttl || this.ttl
        });
        imported++;
      }
    });

    console.log(`导入了 ${imported}/${entries.length} 个缓存条目`);
    return imported;
  }

  /**
   * 销毁缓存实例
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// 创建单例实例
const priceCalculationCache = new PriceCalculationCache({
  ttl: 5 * 60 * 1000, // 5分钟
  maxSize: 1000,
  cleanupInterval: 60 * 1000 // 1分钟
});

// 导出单例和类
export default priceCalculationCache;
export { PriceCalculationCache };