/**
 * 性能优化工具
 * 
 * 提供React组件和数据处理的性能优化工具
 * Tasks 59-60: 性能优化实现
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * 防抖Hook
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 节流Hook
 */
export function useThrottle(value, limit) {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

/**
 * 虚拟化列表Hook
 */
export function useVirtualizedList(items, itemHeight, containerHeight) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2; // 缓冲区
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount, items.length);

    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      visibleItems: items.slice(Math.max(0, startIndex), endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: Math.max(0, startIndex) * itemHeight
    };
  }, [items, itemHeight, scrollTop, containerHeight]);

  return { visibleItems, setScrollTop };
}

/**
 * 缓存Hook
 */
export function useCache(key, fetcher, dependencies = []) {
  const cache = useRef(new Map());
  
  return useMemo(() => {
    const cacheKey = Array.isArray(key) ? key.join(':') : key;
    
    if (cache.current.has(cacheKey)) {
      return cache.current.get(cacheKey);
    }
    
    const result = fetcher();
    cache.current.set(cacheKey, result);
    
    // 限制缓存大小
    if (cache.current.size > 100) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }
    
    return result;
  }, [key, ...dependencies]);
}

/**
 * 批量状态更新Hook
 */
export function useBatchedState(initialState) {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef([]);
  const isUpdateScheduled = useRef(false);

  const batchedSetState = useCallback((update) => {
    pendingUpdates.current.push(update);
    
    if (!isUpdateScheduled.current) {
      isUpdateScheduled.current = true;
      
      // 使用 requestAnimationFrame 批量更新
      requestAnimationFrame(() => {
        setState(currentState => {
          let newState = currentState;
          
          pendingUpdates.current.forEach(update => {
            newState = typeof update === 'function' ? update(newState) : update;
          });
          
          pendingUpdates.current = [];
          isUpdateScheduled.current = false;
          
          return newState;
        });
      });
    }
  }, []);

  return [state, batchedSetState];
}

/**
 * 数据分页Hook
 */
export function usePagination(data, pageSize = 20) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      items: data.slice(startIndex, endIndex),
      totalPages: Math.ceil(data.length / pageSize),
      currentPage,
      totalItems: data.length,
      hasNextPage: endIndex < data.length,
      hasPreviousPage: currentPage > 1
    };
  }, [data, currentPage, pageSize]);

  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, paginatedData.totalPages)));
  }, [paginatedData.totalPages]);

  const nextPage = useCallback(() => {
    if (paginatedData.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginatedData.hasNextPage]);

  const previousPage = useCallback(() => {
    if (paginatedData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginatedData.hasPreviousPage]);

  return {
    ...paginatedData,
    goToPage,
    nextPage,
    previousPage,
    setPageSize: (newSize) => {
      setCurrentPage(1);
      // 这里应该更新pageSize，但需要额外的状态管理
    }
  };
}

/**
 * 内存泄漏检测
 */
export class MemoryLeakDetector {
  constructor() {
    this.components = new Map();
    this.timers = new Set();
    this.listeners = new Set();
  }

  registerComponent(name, instance) {
    if (!this.components.has(name)) {
      this.components.set(name, new Set());
    }
    this.components.get(name).add(instance);
  }

  unregisterComponent(name, instance) {
    if (this.components.has(name)) {
      this.components.get(name).delete(instance);
    }
  }

  registerTimer(id) {
    this.timers.add(id);
  }

  clearTimer(id) {
    this.timers.delete(id);
    clearTimeout(id);
    clearInterval(id);
  }

  registerListener(element, event, handler) {
    const listener = { element, event, handler };
    this.listeners.add(listener);
  }

  removeListener(element, event, handler) {
    for (const listener of this.listeners) {
      if (listener.element === element && listener.event === event && listener.handler === handler) {
        this.listeners.delete(listener);
        element.removeEventListener(event, handler);
        break;
      }
    }
  }

  cleanup() {
    // 清理定时器
    this.timers.forEach(id => {
      clearTimeout(id);
      clearInterval(id);
    });
    this.timers.clear();

    // 清理事件监听器
    this.listeners.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch (error) {
        console.warn('Failed to remove event listener:', error);
      }
    });
    this.listeners.clear();

    console.log('Memory leak detector cleanup completed');
  }

  getReport() {
    return {
      activeComponents: Array.from(this.components.entries()).map(([name, instances]) => ({
        name,
        count: instances.size
      })),
      activeTimers: this.timers.size,
      activeListeners: this.listeners.size
    };
  }
}

/**
 * 组件性能分析器
 */
export class ComponentProfiler {
  constructor() {
    this.renderTimes = new Map();
    this.updateCounts = new Map();
  }

  startRender(componentName) {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      
      if (!this.renderTimes.has(componentName)) {
        this.renderTimes.set(componentName, []);
      }
      
      this.renderTimes.get(componentName).push(duration);
      
      // 更新计数
      const currentCount = this.updateCounts.get(componentName) || 0;
      this.updateCounts.set(componentName, currentCount + 1);
    };
  }

  getStats(componentName) {
    const renderTimes = this.renderTimes.get(componentName) || [];
    const updateCount = this.updateCounts.get(componentName) || 0;
    
    if (renderTimes.length === 0) {
      return null;
    }

    return {
      componentName,
      updateCount,
      averageRenderTime: renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length,
      minRenderTime: Math.min(...renderTimes),
      maxRenderTime: Math.max(...renderTimes),
      totalRenderTime: renderTimes.reduce((sum, time) => sum + time, 0)
    };
  }

  getAllStats() {
    return Array.from(this.renderTimes.keys()).map(name => this.getStats(name)).filter(Boolean);
  }

  reset() {
    this.renderTimes.clear();
    this.updateCounts.clear();
  }
}

/**
 * 数据处理优化工具
 */
export const dataOptimization = {
  // 分块处理大数组
  async processInChunks(array, processor, chunkSize = 100) {
    const results = [];
    
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);
      
      // 让出主线程
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    return results;
  },

  // 去重优化
  deduplicateByKey(array, keyFn) {
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  // 深拷贝优化
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      Object.keys(obj).forEach(key => {
        cloned[key] = this.deepClone(obj[key]);
      });
      return cloned;
    }
  },

  // 对象比较优化
  shallowEqual(obj1, obj2) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    return keys1.every(key => obj1[key] === obj2[key]);
  }
};

/**
 * Web Worker 任务队列
 */
export class WorkerTaskQueue {
  constructor(workerScript) {
    this.workers = [];
    this.taskQueue = [];
    this.maxWorkers = navigator.hardwareConcurrency || 4;
    this.workerScript = workerScript;
  }

  async executeTask(taskData) {
    return new Promise((resolve, reject) => {
      const task = { taskData, resolve, reject };
      
      const availableWorker = this.workers.find(w => !w.busy);
      
      if (availableWorker) {
        this.assignTask(availableWorker, task);
      } else if (this.workers.length < this.maxWorkers) {
        this.createWorker().then(worker => {
          this.assignTask(worker, task);
        });
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  async createWorker() {
    const worker = new Worker(this.workerScript);
    const workerWrapper = {
      worker,
      busy: false
    };

    worker.onmessage = (e) => {
      const { taskId, result, error } = e.data;
      const task = workerWrapper.currentTask;
      
      if (task) {
        workerWrapper.busy = false;
        workerWrapper.currentTask = null;
        
        if (error) {
          task.reject(new Error(error));
        } else {
          task.resolve(result);
        }
        
        // 处理队列中的下一个任务
        this.processQueue();
      }
    };

    this.workers.push(workerWrapper);
    return workerWrapper;
  }

  assignTask(workerWrapper, task) {
    workerWrapper.busy = true;
    workerWrapper.currentTask = task;
    workerWrapper.worker.postMessage({
      taskId: Date.now(),
      data: task.taskData
    });
  }

  processQueue() {
    if (this.taskQueue.length === 0) return;
    
    const availableWorker = this.workers.find(w => !w.busy);
    if (availableWorker) {
      const task = this.taskQueue.shift();
      this.assignTask(availableWorker, task);
    }
  }

  terminate() {
    this.workers.forEach(({ worker }) => worker.terminate());
    this.workers = [];
    this.taskQueue.forEach(task => task.reject(new Error('Worker terminated')));
    this.taskQueue = [];
  }
}

// 全局实例
export const memoryLeakDetector = new MemoryLeakDetector();
export const componentProfiler = new ComponentProfiler();

// 性能监控Hook
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    
    if (lastRenderTime.current > 0) {
      const renderDuration = currentTime - lastRenderTime.current;
      componentProfiler.startRender(componentName)();
    }
    
    lastRenderTime.current = currentTime;
  });

  useEffect(() => {
    memoryLeakDetector.registerComponent(componentName, {});
    
    return () => {
      memoryLeakDetector.unregisterComponent(componentName, {});
    };
  }, [componentName]);
}

// 导出所有工具
export default {
  useDebounce,
  useThrottle,
  useVirtualizedList,
  useCache,
  useBatchedState,
  usePagination,
  usePerformanceMonitor,
  MemoryLeakDetector,
  ComponentProfiler,
  WorkerTaskQueue,
  dataOptimization,
  memoryLeakDetector,
  componentProfiler
};