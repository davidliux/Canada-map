/**
 * 货车配送系统错误处理器
 * 定义自定义错误类和全局错误处理函数
 */

import { dataUpdateNotifier } from '../dataUpdateNotifier.js';

// 错误类型常量
export const ERROR_TYPES = {
  FSA_CONFLICT: 'FSA_CONFLICT',
  VALIDATION: 'VALIDATION',
  STORAGE_QUOTA: 'STORAGE_QUOTA',
  NETWORK: 'NETWORK',
  DATA_CORRUPTION: 'DATA_CORRUPTION',
  PERMISSION: 'PERMISSION',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
};

// 错误严重程度
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * 基础自定义错误类
 */
export class TruckDeliveryError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, details = {}) {
    super(message);
    this.name = 'TruckDeliveryError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.code = this.generateErrorCode();
    
    // 确保错误堆栈正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TruckDeliveryError);
    }
  }

  /**
   * 生成错误代码
   * @returns {string} 错误代码
   */
  generateErrorCode() {
    const typePrefix = this.type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${typePrefix}_${timestamp}_${random}`;
  }

  /**
   * 转换为JSON格式
   * @returns {Object} 错误信息对象
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }

  /**
   * 获取用户友好的错误信息
   * @returns {string} 用户友好的错误消息
   */
  getUserMessage() {
    switch (this.type) {
      case ERROR_TYPES.FSA_CONFLICT:
        return `邮编分配冲突：${this.message}`;
      case ERROR_TYPES.VALIDATION:
        return `数据验证错误：${this.message}`;
      case ERROR_TYPES.STORAGE_QUOTA:
        return `存储空间不足：${this.message}`;
      case ERROR_TYPES.NETWORK:
        return `网络连接问题：${this.message}`;
      case ERROR_TYPES.DATA_CORRUPTION:
        return `数据损坏：${this.message}`;
      case ERROR_TYPES.PERMISSION:
        return `权限不足：${this.message}`;
      case ERROR_TYPES.TIMEOUT:
        return `操作超时：${this.message}`;
      default:
        return `系统错误：${this.message}`;
    }
  }
}

/**
 * FSA冲突错误类
 * 当同一个FSA被分配给多个区域时抛出
 */
export class FSAConflictError extends TruckDeliveryError {
  constructor(fsaCode, existingRegion, newRegion, details = {}) {
    const message = `FSA ${fsaCode} 已被分配给区域 ${existingRegion}，无法再分配给区域 ${newRegion}`;
    super(message, ERROR_TYPES.FSA_CONFLICT, ERROR_SEVERITY.HIGH, {
      fsaCode,
      existingRegion,
      newRegion,
      ...details
    });
    this.name = 'FSAConflictError';
    this.fsaCode = fsaCode;
    this.existingRegion = existingRegion;
    this.newRegion = newRegion;
  }

  /**
   * 获取冲突解决建议
   * @returns {Array} 解决建议列表
   */
  getResolutionSuggestions() {
    return [
      `从区域 ${this.existingRegion} 中移除 FSA ${this.fsaCode}`,
      `选择不同的FSA分配给区域 ${this.newRegion}`,
      `检查FSA ${this.fsaCode} 的正确归属区域`,
      '使用FSA冲突解决工具自动处理'
    ];
  }
}

/**
 * 数据验证错误类
 * 当数据不符合预期格式或规则时抛出
 */
export class ValidationError extends TruckDeliveryError {
  constructor(message, field, value, expectedFormat, details = {}) {
    super(message, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM, {
      field,
      value,
      expectedFormat,
      ...details
    });
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.expectedFormat = expectedFormat;
  }

  /**
   * 获取验证规则说明
   * @returns {string} 规则说明
   */
  getValidationRules() {
    const rules = {
      regionId: '区域ID必须是1-8之间的字符串',
      fsaCode: 'FSA代码必须是3位字符，格式如"M5V"',
      postalCode: '邮编必须符合加拿大邮编格式，如"M5V 3A8"',
      weight: '重量必须是大于0的数字',
      price: '价格必须是大于等于0的数字',
      weightRange: '重量区间的最小值必须小于最大值'
    };
    
    return rules[this.field] || '请检查数据格式是否正确';
  }
}

/**
 * 存储配额错误类
 * 当localStorage空间不足时抛出
 */
export class StorageQuotaError extends TruckDeliveryError {
  constructor(requestedSize, availableSize, details = {}) {
    const message = `存储空间不足，需要 ${requestedSize} bytes，可用 ${availableSize} bytes`;
    super(message, ERROR_TYPES.STORAGE_QUOTA, ERROR_SEVERITY.HIGH, {
      requestedSize,
      availableSize,
      ...details
    });
    this.name = 'StorageQuotaError';
    this.requestedSize = requestedSize;
    this.availableSize = availableSize;
  }

  /**
   * 获取清理建议
   * @returns {Array} 清理建议列表
   */
  getCleanupSuggestions() {
    return [
      '清理价格历史记录',
      '删除不使用的区域配置',
      '压缩存储数据',
      '清理浏览器缓存',
      '联系管理员增加存储配额'
    ];
  }
}

/**
 * 全局错误处理器
 */
export class GlobalErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 1000;
    this.listeners = new Set();
    this.isInitialized = false;
  }

  /**
   * 初始化全局错误处理
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    // 监听未捕获的错误
    window.addEventListener('error', (event) => {
      this.handleError(new TruckDeliveryError(
        event.message,
        ERROR_TYPES.UNKNOWN,
        ERROR_SEVERITY.HIGH,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      ));
    });

    // 监听未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new TruckDeliveryError(
        event.reason?.message || '未处理的Promise拒绝',
        ERROR_TYPES.UNKNOWN,
        ERROR_SEVERITY.HIGH,
        {
          reason: event.reason,
          promise: event.promise
        }
      ));
    });

    this.isInitialized = true;
    console.log('全局错误处理器已初始化');
  }

  /**
   * 处理错误
   * @param {Error|TruckDeliveryError} error - 错误对象
   * @param {Object} context - 错误上下文信息
   */
  handleError(error, context = {}) {
    try {
      // 转换为标准错误格式
      const standardError = this.standardizeError(error, context);
      
      // 记录错误
      this.logError(standardError);
      
      // 通知监听器
      this.notifyListeners(standardError);
      
      // 根据严重程度进行处理
      this.processBySeverity(standardError);
      
      // 尝试自动恢复
      this.attemptAutoRecovery(standardError);
      
    } catch (handlerError) {
      console.error('错误处理器本身发生错误:', handlerError);
    }
  }

  /**
   * 标准化错误对象
   * @param {Error} error - 原始错误
   * @param {Object} context - 上下文信息
   * @returns {TruckDeliveryError} 标准化的错误对象
   */
  standardizeError(error, context = {}) {
    if (error instanceof TruckDeliveryError) {
      // 添加上下文信息
      error.details = { ...error.details, ...context };
      return error;
    }

    // 转换普通错误为自定义错误
    let errorType = ERROR_TYPES.UNKNOWN;
    let severity = ERROR_SEVERITY.MEDIUM;

    // 根据错误消息推断类型
    const message = error.message.toLowerCase();
    if (message.includes('quota') || message.includes('storage')) {
      errorType = ERROR_TYPES.STORAGE_QUOTA;
      severity = ERROR_SEVERITY.HIGH;
    } else if (message.includes('network') || message.includes('fetch')) {
      errorType = ERROR_TYPES.NETWORK;
      severity = ERROR_SEVERITY.MEDIUM;
    } else if (message.includes('validation') || message.includes('invalid')) {
      errorType = ERROR_TYPES.VALIDATION;
      severity = ERROR_SEVERITY.LOW;
    }

    return new TruckDeliveryError(
      error.message,
      errorType,
      severity,
      {
        originalError: error.name,
        stack: error.stack,
        ...context
      }
    );
  }

  /**
   * 记录错误到日志
   * @param {TruckDeliveryError} error - 错误对象
   */
  logError(error) {
    const logEntry = {
      ...error.toJSON(),
      id: this.generateLogId(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId()
    };

    // 添加到内存日志
    this.errorLog.unshift(logEntry);
    
    // 限制日志大小
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // 存储到localStorage（仅存储关键错误）
    if (error.severity === ERROR_SEVERITY.HIGH || error.severity === ERROR_SEVERITY.CRITICAL) {
      this.persistErrorLog(logEntry);
    }

    // 控制台输出
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.code}] ${error.type}: ${error.message}`, error.details);
  }

  /**
   * 根据严重程度获取日志方法
   * @param {string} severity - 严重程度
   * @returns {Function} 日志方法
   */
  getLogMethod(severity) {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return console.error;
      case ERROR_SEVERITY.HIGH:
        return console.error;
      case ERROR_SEVERITY.MEDIUM:
        return console.warn;
      case ERROR_SEVERITY.LOW:
        return console.info;
      default:
        return console.log;
    }
  }

  /**
   * 根据严重程度处理错误
   * @param {TruckDeliveryError} error - 错误对象
   */
  processBySeverity(error) {
    switch (error.severity) {
      case ERROR_SEVERITY.CRITICAL:
        this.handleCriticalError(error);
        break;
      case ERROR_SEVERITY.HIGH:
        this.handleHighSeverityError(error);
        break;
      case ERROR_SEVERITY.MEDIUM:
        this.handleMediumSeverityError(error);
        break;
      case ERROR_SEVERITY.LOW:
        this.handleLowSeverityError(error);
        break;
    }
  }

  /**
   * 处理严重错误
   * @param {TruckDeliveryError} error - 错误对象
   */
  handleCriticalError(error) {
    // 显示错误提示
    this.showErrorNotification(error, true);
    
    // 尝试数据备份
    this.backupCurrentData();
    
    // 发送错误报告
    this.sendErrorReport(error);
  }

  /**
   * 处理高优先级错误
   * @param {TruckDeliveryError} error - 错误对象
   */
  handleHighSeverityError(error) {
    this.showErrorNotification(error, false);
    
    if (error.type === ERROR_TYPES.FSA_CONFLICT) {
      // 触发FSA冲突解决流程
      this.triggerConflictResolution(error);
    } else if (error.type === ERROR_TYPES.STORAGE_QUOTA) {
      // 触发存储清理流程
      this.triggerStorageCleanup(error);
    }
  }

  /**
   * 处理中等优先级错误
   * @param {TruckDeliveryError} error - 错误对象
   */
  handleMediumSeverityError(error) {
    // 仅记录，不显示用户通知
    if (error.type === ERROR_TYPES.VALIDATION) {
      // 可以在表单中显示验证错误
      this.notifyValidationError(error);
    }
  }

  /**
   * 处理低优先级错误
   * @param {TruckDeliveryError} error - 错误对象
   */
  handleLowSeverityError(error) {
    // 仅记录日志
  }

  /**
   * 尝试自动恢复
   * @param {TruckDeliveryError} error - 错误对象
   */
  attemptAutoRecovery(error) {
    switch (error.type) {
      case ERROR_TYPES.DATA_CORRUPTION:
        this.attemptDataRecovery();
        break;
      case ERROR_TYPES.NETWORK:
        this.scheduleRetry(error);
        break;
      case ERROR_TYPES.STORAGE_QUOTA:
        this.attemptStorageCleanup();
        break;
    }
  }

  /**
   * 显示错误通知
   * @param {TruckDeliveryError} error - 错误对象
   * @param {boolean} blocking - 是否阻塞用户操作
   */
  showErrorNotification(error, blocking = false) {
    const notification = {
      type: 'error',
      title: '系统错误',
      message: error.getUserMessage(),
      code: error.code,
      severity: error.severity,
      blocking,
      timestamp: error.timestamp,
      actions: this.getErrorActions(error)
    };

    // 通过数据更新通知器发送通知
    dataUpdateNotifier.notifyError(error.type, notification);
  }

  /**
   * 获取错误处理操作
   * @param {TruckDeliveryError} error - 错误对象
   * @returns {Array} 操作列表
   */
  getErrorActions(error) {
    const actions = [];

    if (error instanceof FSAConflictError) {
      actions.push({
        label: '查看冲突详情',
        action: 'showConflictDetails',
        data: { fsaCode: error.fsaCode, conflictInfo: error.details }
      });
    }

    if (error instanceof StorageQuotaError) {
      actions.push({
        label: '清理存储',
        action: 'cleanupStorage',
        data: { suggestions: error.getCleanupSuggestions() }
      });
    }

    actions.push({
      label: '重试',
      action: 'retry',
      data: { errorCode: error.code }
    });

    return actions;
  }

  /**
   * 添加错误监听器
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消监听的函数
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * 通知所有监听器
   * @param {TruckDeliveryError} error - 错误对象
   */
  notifyListeners(error) {
    this.listeners.forEach(callback => {
      try {
        callback(error);
      } catch (listenerError) {
        console.error('错误监听器执行失败:', listenerError);
      }
    });
  }

  /**
   * 获取错误日志
   * @param {Object} filters - 过滤条件
   * @returns {Array} 错误日志数组
   */
  getErrorLog(filters = {}) {
    let filteredLog = [...this.errorLog];

    if (filters.type) {
      filteredLog = filteredLog.filter(entry => entry.type === filters.type);
    }

    if (filters.severity) {
      filteredLog = filteredLog.filter(entry => entry.severity === filters.severity);
    }

    if (filters.startTime) {
      filteredLog = filteredLog.filter(entry => 
        new Date(entry.timestamp) >= new Date(filters.startTime)
      );
    }

    if (filters.limit) {
      filteredLog = filteredLog.slice(0, filters.limit);
    }

    return filteredLog;
  }

  /**
   * 清除错误日志
   * @param {Object} criteria - 清除条件
   */
  clearErrorLog(criteria = {}) {
    if (Object.keys(criteria).length === 0) {
      // 清除所有日志
      this.errorLog = [];
    } else {
      // 根据条件清除
      this.errorLog = this.errorLog.filter(entry => {
        if (criteria.type && entry.type === criteria.type) return false;
        if (criteria.severity && entry.severity === criteria.severity) return false;
        if (criteria.beforeDate && new Date(entry.timestamp) < new Date(criteria.beforeDate)) return false;
        return true;
      });
    }

    console.log('错误日志已清除');
  }

  /**
   * 生成日志ID
   * @returns {string} 唯一ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取当前用户ID（如果有）
   * @returns {string|null} 用户ID
   */
  getCurrentUserId() {
    // 从localStorage或会话中获取用户ID
    return localStorage.getItem('userId') || null;
  }

  /**
   * 持久化错误日志
   * @param {Object} logEntry - 日志条目
   */
  persistErrorLog(logEntry) {
    try {
      const key = 'truck_delivery_error_log';
      const stored = localStorage.getItem(key);
      let persistentLog = stored ? JSON.parse(stored) : [];
      
      persistentLog.unshift(logEntry);
      
      // 限制持久化日志大小（最多100条）
      if (persistentLog.length > 100) {
        persistentLog = persistentLog.slice(0, 100);
      }
      
      localStorage.setItem(key, JSON.stringify(persistentLog));
    } catch (storageError) {
      console.error('无法持久化错误日志:', storageError);
    }
  }

  // 占位符方法，可以在具体实现中扩展
  backupCurrentData() {
    console.log('执行数据备份...');
  }

  sendErrorReport(error) {
    console.log('发送错误报告:', error.code);
  }

  triggerConflictResolution(error) {
    console.log('触发FSA冲突解决:', error.fsaCode);
  }

  triggerStorageCleanup(error) {
    console.log('触发存储清理...');
  }

  notifyValidationError(error) {
    console.log('验证错误通知:', error.field);
  }

  attemptDataRecovery() {
    console.log('尝试数据恢复...');
  }

  scheduleRetry(error) {
    console.log('计划重试操作:', error.code);
  }

  attemptStorageCleanup() {
    console.log('尝试自动清理存储...');
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = new GlobalErrorHandler();

/**
 * 便捷的错误处理函数
 * @param {Error} error - 错误对象
 * @param {Object} context - 上下文信息
 */
export const handleError = (error, context = {}) => {
  globalErrorHandler.handleError(error, context);
};

/**
 * 创建并抛出FSA冲突错误
 * @param {string} fsaCode - FSA代码
 * @param {string} existingRegion - 已存在的区域
 * @param {string} newRegion - 新区域
 * @param {Object} details - 详细信息
 */
export const throwFSAConflictError = (fsaCode, existingRegion, newRegion, details = {}) => {
  throw new FSAConflictError(fsaCode, existingRegion, newRegion, details);
};

/**
 * 创建并抛出验证错误
 * @param {string} message - 错误消息
 * @param {string} field - 字段名
 * @param {any} value - 字段值
 * @param {string} expectedFormat - 期望格式
 * @param {Object} details - 详细信息
 */
export const throwValidationError = (message, field, value, expectedFormat, details = {}) => {
  throw new ValidationError(message, field, value, expectedFormat, details);
};

/**
 * 创建并抛出存储配额错误
 * @param {number} requestedSize - 请求大小
 * @param {number} availableSize - 可用大小
 * @param {Object} details - 详细信息
 */
export const throwStorageQuotaError = (requestedSize, availableSize, details = {}) => {
  throw new StorageQuotaError(requestedSize, availableSize, details);
};

/**
 * 安全执行函数（捕获并处理错误）
 * @param {Function} fn - 要执行的函数
 * @param {Object} context - 上下文信息
 * @returns {any} 函数返回值或null（如果发生错误）
 */
export const safeExecute = async (fn, context = {}) => {
  try {
    return await fn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
};

/**
 * 初始化错误处理系统
 */
export const initializeErrorHandling = () => {
  globalErrorHandler.initialize();
  console.log('货车配送错误处理系统已初始化');
};

export default {
  // 错误类
  TruckDeliveryError,
  FSAConflictError,
  ValidationError,
  StorageQuotaError,
  
  // 全局处理器
  GlobalErrorHandler,
  globalErrorHandler,
  
  // 便捷函数
  handleError,
  throwFSAConflictError,
  throwValidationError,
  throwStorageQuotaError,
  safeExecute,
  initializeErrorHandling,
  
  // 常量
  ERROR_TYPES,
  ERROR_SEVERITY
};