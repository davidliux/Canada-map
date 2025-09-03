/**
 * 实时同步监控器
 * 监控数据同步状态，提供实时反馈和性能统计
 */

import { getAllRegionConfigs } from './unifiedStorage.js';
import { dataConflictResolver } from './dataConflictResolver.js';

/**
 * 同步状态枚举
 */
export const SYNC_STATUS = {
  IDLE: 'idle',                    // 空闲
  SYNCING: 'syncing',             // 同步中
  SUCCESS: 'success',             // 同步成功
  ERROR: 'error',                 // 同步错误
  CONFLICT: 'conflict',           // 存在冲突
  OFFLINE: 'offline'              // 离线状态
};

/**
 * 同步事件类型
 */
export const SYNC_EVENTS = {
  STATUS_CHANGED: 'status_changed',
  SYNC_STARTED: 'sync_started',
  SYNC_COMPLETED: 'sync_completed',
  SYNC_FAILED: 'sync_failed',
  CONFLICT_DETECTED: 'conflict_detected',
  CONFLICT_RESOLVED: 'conflict_resolved',
  PERFORMANCE_UPDATE: 'performance_update'
};

/**
 * 实时同步监控器类
 */
export class SyncMonitor {
  constructor() {
    this.status = SYNC_STATUS.IDLE;
    this.lastSyncTime = null;
    this.syncCount = 0;
    this.errorCount = 0;
    this.conflictCount = 0;
    this.performanceMetrics = {
      averageSyncTime: 0,
      totalSyncTime: 0,
      fastestSync: Infinity,
      slowestSync: 0,
      successRate: 100
    };
    
    this.eventListeners = new Map();
    this.syncHistory = [];
    this.maxHistorySize = 100;
    
    this.isOnline = navigator.onLine;
    this.setupNetworkMonitoring();
  }

  /**
   * 设置网络监控
   */
  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.updateStatus(SYNC_STATUS.IDLE);
      this.emit(SYNC_EVENTS.STATUS_CHANGED, { 
        status: this.status, 
        online: true 
      });
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.updateStatus(SYNC_STATUS.OFFLINE);
      this.emit(SYNC_EVENTS.STATUS_CHANGED, { 
        status: this.status, 
        online: false 
      });
    });
  }

  /**
   * 开始同步监控
   */
  startSync(syncId = null) {
    if (!this.isOnline) {
      this.updateStatus(SYNC_STATUS.OFFLINE);
      return false;
    }

    const sync = {
      id: syncId || `sync_${Date.now()}`,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      status: SYNC_STATUS.SYNCING,
      conflicts: [],
      errors: [],
      dataSize: 0
    };

    this.currentSync = sync;
    this.updateStatus(SYNC_STATUS.SYNCING);
    
    this.emit(SYNC_EVENTS.SYNC_STARTED, { syncId: sync.id });
    
    return sync.id;
  }

  /**
   * 完成同步监控
   */
  completeSync(syncId, result = {}) {
    if (!this.currentSync || this.currentSync.id !== syncId) {
      console.warn('同步ID不匹配或没有活动同步');
      return;
    }

    const sync = this.currentSync;
    sync.endTime = Date.now();
    sync.duration = sync.endTime - sync.startTime;
    sync.dataSize = result.dataSize || 0;
    sync.conflicts = result.conflicts || [];
    sync.errors = result.errors || [];

    // 更新统计信息
    this.syncCount++;
    this.performanceMetrics.totalSyncTime += sync.duration;
    this.performanceMetrics.averageSyncTime = 
      this.performanceMetrics.totalSyncTime / this.syncCount;
    
    if (sync.duration < this.performanceMetrics.fastestSync) {
      this.performanceMetrics.fastestSync = sync.duration;
    }
    
    if (sync.duration > this.performanceMetrics.slowestSync) {
      this.performanceMetrics.slowestSync = sync.duration;
    }

    // 确定最终状态
    if (sync.errors.length > 0) {
      sync.status = SYNC_STATUS.ERROR;
      this.errorCount++;
    } else if (sync.conflicts.length > 0) {
      sync.status = SYNC_STATUS.CONFLICT;
      this.conflictCount++;
    } else {
      sync.status = SYNC_STATUS.SUCCESS;
    }

    // 更新成功率
    this.performanceMetrics.successRate = 
      ((this.syncCount - this.errorCount) / this.syncCount) * 100;

    this.updateStatus(sync.status);
    this.lastSyncTime = sync.endTime;

    // 添加到历史记录
    this.addToHistory(sync);

    // 发送事件
    if (sync.status === SYNC_STATUS.SUCCESS) {
      this.emit(SYNC_EVENTS.SYNC_COMPLETED, { 
        syncId: sync.id, 
        duration: sync.duration,
        dataSize: sync.dataSize
      });
    } else if (sync.status === SYNC_STATUS.ERROR) {
      this.emit(SYNC_EVENTS.SYNC_FAILED, { 
        syncId: sync.id, 
        errors: sync.errors 
      });
    } else if (sync.status === SYNC_STATUS.CONFLICT) {
      this.emit(SYNC_EVENTS.CONFLICT_DETECTED, { 
        syncId: sync.id, 
        conflicts: sync.conflicts 
      });
    }

    this.emit(SYNC_EVENTS.PERFORMANCE_UPDATE, this.performanceMetrics);

    this.currentSync = null;
  }

  /**
   * 记录同步错误
   */
  recordError(syncId, error) {
    if (this.currentSync && this.currentSync.id === syncId) {
      this.currentSync.errors.push({
        timestamp: Date.now(),
        message: error.message || error,
        stack: error.stack
      });
    }
  }

  /**
   * 记录冲突
   */
  recordConflict(syncId, conflict) {
    if (this.currentSync && this.currentSync.id === syncId) {
      this.currentSync.conflicts.push({
        timestamp: Date.now(),
        type: conflict.type,
        regionId: conflict.regionId,
        description: conflict.description
      });
    }
  }

  /**
   * 更新状态
   */
  updateStatus(newStatus) {
    if (this.status !== newStatus) {
      const oldStatus = this.status;
      this.status = newStatus;
      
      this.emit(SYNC_EVENTS.STATUS_CHANGED, { 
        oldStatus, 
        newStatus, 
        timestamp: Date.now() 
      });
    }
  }

  /**
   * 添加到历史记录
   */
  addToHistory(sync) {
    this.syncHistory.unshift(sync);
    
    // 限制历史记录大小
    if (this.syncHistory.length > this.maxHistorySize) {
      this.syncHistory = this.syncHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * 获取同步状态
   */
  getStatus() {
    return {
      current: this.status,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      syncCount: this.syncCount,
      errorCount: this.errorCount,
      conflictCount: this.conflictCount,
      currentSync: this.currentSync ? {
        id: this.currentSync.id,
        startTime: this.currentSync.startTime,
        duration: this.currentSync.startTime ? Date.now() - this.currentSync.startTime : 0
      } : null
    };
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      syncCount: this.syncCount,
      errorCount: this.errorCount,
      conflictCount: this.conflictCount,
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }

  /**
   * 获取同步历史
   */
  getSyncHistory(limit = 10) {
    return this.syncHistory.slice(0, limit);
  }

  /**
   * 获取详细统计
   */
  getDetailedStats() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;

    const recentSyncs = this.syncHistory.filter(
      sync => now - sync.endTime < oneHour
    );
    
    const todaySyncs = this.syncHistory.filter(
      sync => now - sync.endTime < oneDay
    );

    return {
      overall: {
        totalSyncs: this.syncCount,
        successRate: this.performanceMetrics.successRate,
        averageDuration: this.performanceMetrics.averageSyncTime,
        fastestSync: this.performanceMetrics.fastestSync,
        slowestSync: this.performanceMetrics.slowestSync
      },
      recent: {
        lastHour: {
          count: recentSyncs.length,
          successCount: recentSyncs.filter(s => s.status === SYNC_STATUS.SUCCESS).length,
          errorCount: recentSyncs.filter(s => s.status === SYNC_STATUS.ERROR).length,
          conflictCount: recentSyncs.filter(s => s.status === SYNC_STATUS.CONFLICT).length
        },
        today: {
          count: todaySyncs.length,
          successCount: todaySyncs.filter(s => s.status === SYNC_STATUS.SUCCESS).length,
          errorCount: todaySyncs.filter(s => s.status === SYNC_STATUS.ERROR).length,
          conflictCount: todaySyncs.filter(s => s.status === SYNC_STATUS.CONFLICT).length
        }
      },
      current: this.getStatus()
    };
  }

  /**
   * 事件监听器管理
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('事件监听器执行错误:', error);
        }
      });
    }
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.syncCount = 0;
    this.errorCount = 0;
    this.conflictCount = 0;
    this.performanceMetrics = {
      averageSyncTime: 0,
      totalSyncTime: 0,
      fastestSync: Infinity,
      slowestSync: 0,
      successRate: 100
    };
    this.syncHistory = [];
    this.startTime = Date.now();
  }

  /**
   * 导出统计数据
   */
  exportStats() {
    return {
      timestamp: new Date().toISOString(),
      status: this.getStatus(),
      performance: this.getPerformanceMetrics(),
      detailedStats: this.getDetailedStats(),
      history: this.getSyncHistory(50)
    };
  }

  /**
   * 健康检查
   */
  healthCheck() {
    const stats = this.getDetailedStats();
    const health = {
      overall: 'healthy',
      issues: [],
      recommendations: []
    };

    // 检查成功率
    if (stats.overall.successRate < 90) {
      health.overall = 'warning';
      health.issues.push('同步成功率低于90%');
      health.recommendations.push('检查网络连接和存储系统');
    }

    // 检查平均同步时间
    if (stats.overall.averageDuration > 5000) {
      health.overall = 'warning';
      health.issues.push('平均同步时间超过5秒');
      health.recommendations.push('优化数据大小或网络性能');
    }

    // 检查最近错误
    if (stats.recent.lastHour.errorCount > 3) {
      health.overall = 'critical';
      health.issues.push('最近一小时错误次数过多');
      health.recommendations.push('立即检查系统状态');
    }

    return health;
  }
}

// 创建全局实例
export const syncMonitor = new SyncMonitor();

// 导出到全局对象
if (typeof window !== 'undefined') {
  window.syncMonitor = syncMonitor;
}
