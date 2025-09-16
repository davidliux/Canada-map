/**
 * 错误处理和容量管理工具
 * 
 * 提供统一的错误处理、重试机制和容量管理功能
 * Tasks 53-55: 错误处理和容量管理
 */

/**
 * 错误类型定义
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  CAPACITY: 'CAPACITY_ERROR'
};

/**
 * 错误级别
 */
export const ERROR_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * 自定义错误类
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.SERVER, level = ERROR_LEVELS.MEDIUM, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.level = level;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.id = generateErrorId();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      type: this.type,
      level: this.level,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * 生成错误ID
 */
function generateErrorId() {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 错误收集器
 */
class ErrorCollector {
  constructor() {
    this.errors = [];
    this.maxErrors = 1000;
    this.listeners = [];
  }

  collect(error) {
    const errorData = error instanceof AppError ? error.toJSON() : {
      id: generateErrorId(),
      name: error.name || 'Error',
      message: error.message,
      type: this.classifyError(error),
      level: this.determineLevel(error),
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    this.errors.unshift(errorData);
    
    // 保持错误数量在限制内
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // 通知监听器
    this.notifyListeners(errorData);

    // 发送到错误监控服务
    this.sendToMonitoring(errorData);

    return errorData;
  }

  classifyError(error) {
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network')) {
      return ERROR_TYPES.NETWORK;
    }
    if (error.status === 401 || error.status === 403) {
      return ERROR_TYPES.PERMISSION;
    }
    if (error.status === 404) {
      return ERROR_TYPES.NOT_FOUND;
    }
    if (error.status === 429) {
      return ERROR_TYPES.RATE_LIMIT;
    }
    if (error.status === 408) {
      return ERROR_TYPES.TIMEOUT;
    }
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return ERROR_TYPES.VALIDATION;
    }
    return ERROR_TYPES.SERVER;
  }

  determineLevel(error) {
    if (error.status >= 500) {
      return ERROR_LEVELS.CRITICAL;
    }
    if (error.status >= 400) {
      return ERROR_LEVELS.HIGH;
    }
    if (error.type === ERROR_TYPES.NETWORK) {
      return ERROR_LEVELS.MEDIUM;
    }
    return ERROR_LEVELS.LOW;
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(errorData) {
    this.listeners.forEach(listener => {
      try {
        listener(errorData);
      } catch (err) {
        console.error('Error in error listener:', err);
      }
    });
  }

  sendToMonitoring(errorData) {
    // 发送到外部错误监控服务（如Sentry、LogRocket等）
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: errorData.message,
        fatal: errorData.level === ERROR_LEVELS.CRITICAL
      });
    }

    // 发送到自定义监控API
    if (errorData.level === ERROR_LEVELS.CRITICAL || errorData.level === ERROR_LEVELS.HIGH) {
      this.sendToCriticalMonitoring(errorData);
    }
  }

  async sendToCriticalMonitoring(errorData) {
    try {
      await fetch('/api/v1/monitoring/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
    } catch (err) {
      console.error('Failed to send error to monitoring:', err);
    }
  }

  getErrors(filters = {}) {
    let filteredErrors = [...this.errors];

    if (filters.type) {
      filteredErrors = filteredErrors.filter(e => e.type === filters.type);
    }

    if (filters.level) {
      filteredErrors = filteredErrors.filter(e => e.level === filters.level);
    }

    if (filters.since) {
      const since = new Date(filters.since);
      filteredErrors = filteredErrors.filter(e => new Date(e.timestamp) >= since);
    }

    return filteredErrors;
  }

  clearErrors(filters = {}) {
    if (Object.keys(filters).length === 0) {
      this.errors = [];
    } else {
      const errorsToRemove = this.getErrors(filters);
      errorsToRemove.forEach(error => {
        const index = this.errors.findIndex(e => e.id === error.id);
        if (index !== -1) {
          this.errors.splice(index, 1);
        }
      });
    }
  }
}

/**
 * 重试机制
 */
export class RetryHandler {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 30000;
    this.backoffFactor = options.backoffFactor || 2;
    this.retryCondition = options.retryCondition || this.defaultRetryCondition;
  }

  defaultRetryCondition(error, attempt) {
    // 不重试的错误类型
    const nonRetryableTypes = [
      ERROR_TYPES.VALIDATION,
      ERROR_TYPES.PERMISSION,
      ERROR_TYPES.NOT_FOUND
    ];

    if (error.type && nonRetryableTypes.includes(error.type)) {
      return false;
    }

    // HTTP状态码判断
    if (error.status) {
      if (error.status >= 400 && error.status < 500) {
        return error.status === 429; // 仅重试速率限制错误
      }
      return error.status >= 500; // 重试服务器错误
    }

    // 网络错误和超时错误可重试
    return error.type === ERROR_TYPES.NETWORK || error.type === ERROR_TYPES.TIMEOUT;
  }

  async execute(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        console.log(`执行操作，尝试 ${attempt}/${this.maxAttempts}`, context);
        const result = await operation();
        
        if (attempt > 1) {
          console.log(`操作成功，经过 ${attempt} 次尝试`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        console.warn(`操作失败，尝试 ${attempt}/${this.maxAttempts}:`, error.message);
        
        // 检查是否应该重试
        if (attempt === this.maxAttempts || !this.retryCondition(error, attempt)) {
          break;
        }

        // 计算延迟时间
        const delay = Math.min(
          this.baseDelay * Math.pow(this.backoffFactor, attempt - 1),
          this.maxDelay
        );

        console.log(`等待 ${delay}ms 后重试...`);
        await this.sleep(delay);
      }
    }

    // 所有尝试都失败了
    console.error(`操作最终失败，经过 ${this.maxAttempts} 次尝试:`, lastError);
    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 容量管理器
 */
export class CapacityManager {
  constructor(options = {}) {
    this.limits = {
      maxConcurrentRequests: options.maxConcurrentRequests || 10,
      maxQueueSize: options.maxQueueSize || 100,
      requestTimeout: options.requestTimeout || 30000,
      rateLimitWindow: options.rateLimitWindow || 60000, // 1分钟
      rateLimitCount: options.rateLimitCount || 100
    };

    this.activeRequests = new Set();
    this.requestQueue = [];
    this.rateLimitTracker = new Map();
    this.metrics = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      queuedRequests: 0,
      rateLimitHits: 0
    };
  }

  async execute(operation, options = {}) {
    const requestId = generateErrorId();
    const priority = options.priority || 'normal';

    try {
      // 检查速率限制
      if (!this.checkRateLimit(options.rateLimitKey || 'default')) {
        this.metrics.rateLimitHits++;
        throw new AppError(
          'Rate limit exceeded',
          ERROR_TYPES.RATE_LIMIT,
          ERROR_LEVELS.MEDIUM,
          { requestId, rateLimitKey: options.rateLimitKey }
        );
      }

      // 检查并发限制
      if (this.activeRequests.size >= this.limits.maxConcurrentRequests) {
        if (this.requestQueue.length >= this.limits.maxQueueSize) {
          throw new AppError(
            'Request queue is full',
            ERROR_TYPES.CAPACITY,
            ERROR_LEVELS.HIGH,
            { requestId, queueSize: this.requestQueue.length }
          );
        }

        // 添加到队列
        return this.queueRequest(requestId, operation, options, priority);
      }

      // 立即执行
      return await this.executeRequest(requestId, operation, options);
    } catch (error) {
      this.metrics.failedRequests++;
      throw error;
    }
  }

  async executeRequest(requestId, operation, options) {
    this.activeRequests.add(requestId);
    this.metrics.totalRequests++;

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new AppError(
            'Request timeout',
            ERROR_TYPES.TIMEOUT,
            ERROR_LEVELS.HIGH,
            { requestId, timeout: this.limits.requestTimeout }
          ));
        }, this.limits.requestTimeout);
      });

      const result = await Promise.race([operation(), timeoutPromise]);
      
      this.metrics.completedRequests++;
      return result;
    } finally {
      this.activeRequests.delete(requestId);
      this.processQueue();
    }
  }

  queueRequest(requestId, operation, options, priority) {
    return new Promise((resolve, reject) => {
      const queueItem = {
        requestId,
        operation,
        options,
        priority,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // 根据优先级插入队列
      if (priority === 'high') {
        this.requestQueue.unshift(queueItem);
      } else {
        this.requestQueue.push(queueItem);
      }

      this.metrics.queuedRequests = this.requestQueue.length;
    });
  }

  processQueue() {
    if (this.requestQueue.length === 0 || 
        this.activeRequests.size >= this.limits.maxConcurrentRequests) {
      return;
    }

    const queueItem = this.requestQueue.shift();
    this.metrics.queuedRequests = this.requestQueue.length;

    // 检查请求是否超时
    const age = Date.now() - queueItem.timestamp;
    if (age > this.limits.requestTimeout) {
      queueItem.reject(new AppError(
        'Request timed out in queue',
        ERROR_TYPES.TIMEOUT,
        ERROR_LEVELS.MEDIUM,
        { requestId: queueItem.requestId, age }
      ));
      return;
    }

    // 执行请求
    this.executeRequest(queueItem.requestId, queueItem.operation, queueItem.options)
      .then(queueItem.resolve)
      .catch(queueItem.reject);
  }

  checkRateLimit(key) {
    const now = Date.now();
    const windowStart = now - this.limits.rateLimitWindow;

    // 获取或创建速率限制跟踪
    if (!this.rateLimitTracker.has(key)) {
      this.rateLimitTracker.set(key, []);
    }

    const requests = this.rateLimitTracker.get(key);
    
    // 清理过期的请求记录
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.rateLimitTracker.set(key, validRequests);

    // 检查是否超过限制
    if (validRequests.length >= this.limits.rateLimitCount) {
      return false;
    }

    // 记录当前请求
    validRequests.push(now);
    return true;
  }

  getMetrics() {
    return {
      ...this.metrics,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      rateLimitKeys: this.rateLimitTracker.size
    };
  }

  clearQueue() {
    const queuedCount = this.requestQueue.length;
    this.requestQueue.forEach(item => {
      item.reject(new AppError(
        'Request queue cleared',
        ERROR_TYPES.CAPACITY,
        ERROR_LEVELS.LOW,
        { requestId: item.requestId }
      ));
    });
    this.requestQueue = [];
    this.metrics.queuedRequests = 0;
    return queuedCount;
  }

  updateLimits(newLimits) {
    this.limits = { ...this.limits, ...newLimits };
    this.processQueue(); // 可能可以处理更多队列项目
  }
}

/**
 * 断路器模式实现
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1分钟
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10秒
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new AppError(
          'Circuit breaker is OPEN',
          ERROR_TYPES.CAPACITY,
          ERROR_LEVELS.HIGH,
          { state: this.state, nextAttempt: this.nextAttemptTime }
        );
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.nextAttemptTime = null;
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.timeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }
}

// 创建全局实例
export const errorCollector = new ErrorCollector();
export const retryHandler = new RetryHandler();
export const capacityManager = new CapacityManager();

/**
 * 包装函数，为操作添加错误处理和重试
 */
export function withErrorHandling(operation, options = {}) {
  return async (...args) => {
    try {
      if (options.useRetry) {
        const retryOptions = typeof options.useRetry === 'object' ? options.useRetry : {};
        const handler = new RetryHandler(retryOptions);
        return await handler.execute(() => operation(...args));
      }

      if (options.useCapacityManagement) {
        const capacityOptions = typeof options.useCapacityManagement === 'object' ? options.useCapacityManagement : {};
        return await capacityManager.execute(() => operation(...args), capacityOptions);
      }

      return await operation(...args);
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError(
        error.message,
        errorCollector.classifyError(error),
        errorCollector.determineLevel(error),
        { originalError: error, operation: operation.name }
      );

      errorCollector.collect(appError);

      if (options.suppressError) {
        console.warn('Error suppressed:', appError);
        return options.defaultValue;
      }

      throw appError;
    }
  };
}

export default {
  AppError,
  ERROR_TYPES,
  ERROR_LEVELS,
  errorCollector,
  retryHandler,
  capacityManager,
  RetryHandler,
  CapacityManager,
  CircuitBreaker,
  withErrorHandling
};