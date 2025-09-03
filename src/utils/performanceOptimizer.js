// 性能优化工具集
import { debounce, throttle } from 'lodash';

/**
 * 防抖函数配置
 */
export const createDebouncer = (func, wait = 300, options = {}) => {
  return debounce(func, wait, options);
};

/**
 * 节流函数配置
 */
export const createThrottle = (func, wait = 100, options = {}) => {
  return throttle(func, wait, options);
};

/**
 * 虚拟化列表工具 - 用于大量数据渲染优化
 */
export class VirtualList {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || 50;
    this.containerHeight = options.containerHeight || 400;
    this.overscan = options.overscan || 5; // 预渲染项目数
    this.data = options.data || [];
  }

  getVisibleRange(scrollTop) {
    const start = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const end = Math.min(this.data.length - 1, start + visibleCount + this.overscan * 2);
    
    return { start, end };
  }

  getVisibleItems(scrollTop) {
    const { start, end } = this.getVisibleRange(scrollTop);
    return {
      items: this.data.slice(start, end + 1),
      startIndex: start,
      endIndex: end,
      totalHeight: this.data.length * this.itemHeight,
      offsetY: start * this.itemHeight
    };
  }
}

/**
 * 图片懒加载工具
 */
export class LazyImageLoader {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.1;
    this.rootMargin = options.rootMargin || '50px';
    this.imageQueue = new Map();
    this.observer = null;
    
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
          threshold: this.threshold,
          rootMargin: this.rootMargin
        }
      );
    }
  }

  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        const src = img.dataset.src;
        
        if (src) {
          this.loadImage(img, src);
          this.observer.unobserve(img);
        }
      }
    });
  }

  loadImage(img, src) {
    return new Promise((resolve, reject) => {
      const imageLoader = new Image();
      
      imageLoader.onload = () => {
        img.src = src;
        img.classList.add('loaded');
        resolve(img);
      };
      
      imageLoader.onerror = reject;
      imageLoader.src = src;
    });
  }

  observe(img) {
    if (this.observer) {
      this.observer.observe(img);
    } else {
      // 降级处理
      const src = img.dataset.src;
      if (src) {
        this.loadImage(img, src);
      }
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * 内存缓存管理器
 */
export class CacheManager {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessTimes = new Map();
  }

  set(key, value, ttl = null) {
    // 如果缓存满了，移除最少使用的项
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl ? Date.now() + ttl : null
    });
    
    this.accessTimes.set(key, Date.now());
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (item.ttl && Date.now() > item.ttl) {
      this.delete(key);
      return null;
    }

    // 更新访问时间
    this.accessTimes.set(key, Date.now());
    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  evict() {
    // 移除最少使用的项（LRU）
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  clear() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * 请求去重器 - 防止重复的API请求
 */
export class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async request(key, requestFn) {
    // 如果已有相同的请求在进行中，返回相同的Promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn()
      .finally(() => {
        // 请求完成后清除缓存
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  cancel(key) {
    this.pendingRequests.delete(key);
  }

  cancelAll() {
    this.pendingRequests.clear();
  }
}

/**
 * 批量处理器 - 批量执行操作以提高性能
 */
export class BatchProcessor {
  constructor(batchSize = 10, delay = 100) {
    this.batchSize = batchSize;
    this.delay = delay;
    this.queue = [];
    this.timer = null;
  }

  add(item) {
    this.queue.push(item);
    
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  scheduleFlush() {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) {
      return;
    }

    const batch = this.queue.splice(0);
    return this.processBatch(batch);
  }

  processBatch(batch) {
    // 子类需要重写此方法
    console.log('Processing batch:', batch);
    return batch;
  }
}

/**
 * 搜索结果批处理器
 */
export class SearchBatchProcessor extends BatchProcessor {
  constructor(searchFunction, options = {}) {
    super(options.batchSize, options.delay);
    this.searchFunction = searchFunction;
    this.callbacks = new Map();
  }

  search(query, callback) {
    const id = Date.now() + Math.random();
    this.callbacks.set(id, callback);
    this.add({ id, query });
    return id;
  }

  async processBatch(batch) {
    const queries = batch.map(item => item.query);
    const uniqueQueries = [...new Set(queries)];

    try {
      const results = await this.searchFunction(uniqueQueries);
      
      batch.forEach(({ id, query }) => {
        const callback = this.callbacks.get(id);
        if (callback) {
          const result = results.find(r => r.query === query);
          callback(null, result);
          this.callbacks.delete(id);
        }
      });
    } catch (error) {
      batch.forEach(({ id }) => {
        const callback = this.callbacks.get(id);
        if (callback) {
          callback(error);
          this.callbacks.delete(id);
        }
      });
    }
  }

  cancel(id) {
    this.callbacks.delete(id);
  }
}

/**
 * 性能监控器
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  startTimer(name) {
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: null,
      duration: null
    });
  }

  endTimer(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      
      console.log(`⏱️ ${name}: ${metric.duration.toFixed(2)}ms`);
      return metric.duration;
    }
    return null;
  }

  measureFunction(name, fn) {
    return (...args) => {
      this.startTimer(name);
      const result = fn.apply(this, args);
      
      if (result instanceof Promise) {
        return result.finally(() => this.endTimer(name));
      } else {
        this.endTimer(name);
        return result;
      }
    };
  }

  measureRender(componentName) {
    return {
      onRenderStart: () => this.startTimer(`render-${componentName}`),
      onRenderEnd: () => this.endTimer(`render-${componentName}`)
    };
  }

  getMetrics() {
    return Array.from(this.metrics.entries()).map(([name, metric]) => ({
      name,
      ...metric
    }));
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

// 创建全局实例
export const globalCache = new CacheManager(200);
export const requestDeduplicator = new RequestDeduplicator();
export const performanceMonitor = new PerformanceMonitor();

// 常用工具函数
export const debouncedSearch = createDebouncer((query, callback) => {
  callback(query);
}, 300);

export const throttledScroll = createThrottle((scrollData, callback) => {
  callback(scrollData);
}, 16); // ~60fps