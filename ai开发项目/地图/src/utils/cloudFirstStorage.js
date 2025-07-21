/**
 * 云端优先存储系统
 * 主要数据源：Vercel KV存储
 * 备份数据源：localStorage（离线缓存）
 * 
 * 核心原则：
 * 1. 所有写入操作优先发送到云端
 * 2. 读取操作优先从云端获取，失败时使用本地缓存
 * 3. 本地缓存与云端数据保持同步
 * 4. 网络不可用时，应用仍能正常工作
 */

import { DEFAULT_WEIGHT_RANGES } from './unifiedStorage.js';

// 存储键名常量
export const CLOUD_STORAGE_KEYS = {
  REGION_DATA: 'unified_region_data',
  GLOBAL_SETTINGS: 'unified_global_settings',
  SYNC_STATUS: 'cloud_sync_status',
  LAST_SYNC: 'last_cloud_sync',
  OFFLINE_QUEUE: 'offline_operation_queue'
};

// 同步状态枚举
export const SYNC_STATUS = {
  SYNCED: 'synced',           // 已同步
  SYNCING: 'syncing',         // 同步中
  OFFLINE: 'offline',         // 离线模式
  ERROR: 'error',             // 同步错误
  PENDING: 'pending'          // 等待同步
};

// API配置
const API_BASE_URL = '/api';
const API_TIMEOUT = 10000; // 10秒超时

/**
 * 云端优先存储服务类
 */
export class CloudFirstStorageService {
  constructor() {
    this.syncStatus = SYNC_STATUS.OFFLINE;
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    this.lastSyncTime = null;
    
    // 监听网络状态变化
    this.setupNetworkListeners();
    
    // 初始化时检查连接状态
    this.checkConnectionAndSync();
  }

  /**
   * 设置网络状态监听器
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 网络连接已恢复');
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.syncStatus = SYNC_STATUS.OFFLINE;
      console.log('📱 进入离线模式');
      this.updateSyncStatusUI();
    });
  }

  /**
   * 检查连接状态并同步数据
   */
  async checkConnectionAndSync() {
    try {
      const response = await this.makeAPIRequest('/regions', 'GET', null, 5000);
      if (response.success) {
        this.isOnline = true;
        this.syncStatus = SYNC_STATUS.SYNCED;
        console.log('☁️ 云端连接正常');
        await this.syncFromCloud();
      }
    } catch (error) {
      this.isOnline = false;
      this.syncStatus = SYNC_STATUS.OFFLINE;
      console.log('📱 使用离线模式');
    }
    this.updateSyncStatusUI();
  }

  /**
   * 发起API请求
   */
  async makeAPIRequest(endpoint, method = 'GET', data = null, timeout = API_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      };

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  /**
   * 获取所有区域配置（云端优先）
   */
  async getAllRegionConfigs() {
    try {
      if (this.isOnline) {
        this.syncStatus = SYNC_STATUS.SYNCING;
        this.updateSyncStatusUI();

        const response = await this.makeAPIRequest('/regions');
        if (response.success && response.data) {
          // 更新本地缓存
          this.saveToLocalCache(CLOUD_STORAGE_KEYS.REGION_DATA, response.data);
          this.syncStatus = SYNC_STATUS.SYNCED;
          this.lastSyncTime = new Date().toISOString();
          this.updateSyncStatusUI();
          
          console.log('☁️ 从云端获取数据成功');
          return response.data;
        }
      }
    } catch (error) {
      console.warn('☁️ 云端获取失败，使用本地缓存:', error.message);
      this.syncStatus = SYNC_STATUS.ERROR;
      this.updateSyncStatusUI();
    }

    // 从本地缓存获取
    const localData = this.getFromLocalCache(CLOUD_STORAGE_KEYS.REGION_DATA);
    if (localData) {
      console.log('📱 使用本地缓存数据');
      return localData;
    }

    // 如果没有任何数据，返回默认配置
    console.log('🔧 使用默认配置');
    return this.initializeDefaultRegions();
  }

  /**
   * 保存所有区域配置（云端优先）
   */
  async saveAllRegionConfigs(regionConfigs) {
    const timestamp = new Date().toISOString();
    
    // 立即更新本地缓存
    this.saveToLocalCache(CLOUD_STORAGE_KEYS.REGION_DATA, regionConfigs);

    if (this.isOnline) {
      try {
        this.syncStatus = SYNC_STATUS.SYNCING;
        this.updateSyncStatusUI();

        const response = await this.makeAPIRequest('/regions', 'POST', regionConfigs);
        if (response.success) {
          this.syncStatus = SYNC_STATUS.SYNCED;
          this.lastSyncTime = timestamp;
          console.log('☁️ 数据已保存到云端');
          this.updateSyncStatusUI();
          return true;
        }
      } catch (error) {
        console.warn('☁️ 云端保存失败，已加入离线队列:', error.message);
        this.addToOfflineQueue('saveAll', { regionConfigs, timestamp });
        this.syncStatus = SYNC_STATUS.PENDING;
        this.updateSyncStatusUI();
      }
    } else {
      console.log('📱 离线模式：数据已保存到本地，等待同步');
      this.addToOfflineQueue('saveAll', { regionConfigs, timestamp });
      this.syncStatus = SYNC_STATUS.PENDING;
      this.updateSyncStatusUI();
    }

    return true;
  }

  /**
   * 保存单个区域配置
   */
  async saveRegionConfig(regionId, config) {
    const allConfigs = await this.getAllRegionConfigs();
    allConfigs[regionId] = {
      ...config,
      id: regionId,
      lastUpdated: new Date().toISOString()
    };
    
    return await this.saveAllRegionConfigs(allConfigs);
  }

  /**
   * 获取单个区域配置
   */
  async getRegionConfig(regionId) {
    const allConfigs = await this.getAllRegionConfigs();
    return allConfigs[regionId] || null;
  }

  /**
   * 从云端同步数据到本地
   */
  async syncFromCloud() {
    try {
      const response = await this.makeAPIRequest('/regions');
      if (response.success && response.data) {
        this.saveToLocalCache(CLOUD_STORAGE_KEYS.REGION_DATA, response.data);
        this.lastSyncTime = new Date().toISOString();
        this.saveToLocalCache(CLOUD_STORAGE_KEYS.LAST_SYNC, this.lastSyncTime);
        console.log('🔄 云端数据同步完成');
        return true;
      }
    } catch (error) {
      console.error('🔄 云端同步失败:', error);
      return false;
    }
  }

  /**
   * 添加操作到离线队列
   */
  addToOfflineQueue(operation, data) {
    this.offlineQueue.push({
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      data,
      timestamp: new Date().toISOString()
    });
    
    this.saveToLocalCache(CLOUD_STORAGE_KEYS.OFFLINE_QUEUE, this.offlineQueue);
  }

  /**
   * 处理离线队列
   */
  async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    console.log(`🔄 处理 ${this.offlineQueue.length} 个离线操作`);
    this.syncStatus = SYNC_STATUS.SYNCING;
    this.updateSyncStatusUI();

    const processedOperations = [];
    
    for (const operation of this.offlineQueue) {
      try {
        if (operation.operation === 'saveAll') {
          const response = await this.makeAPIRequest('/regions', 'POST', operation.data.regionConfigs);
          if (response.success) {
            processedOperations.push(operation.id);
            console.log(`✅ 离线操作已同步: ${operation.id}`);
          }
        }
      } catch (error) {
        console.warn(`❌ 离线操作同步失败: ${operation.id}`, error);
        break; // 停止处理，保留剩余操作
      }
    }

    // 移除已处理的操作
    this.offlineQueue = this.offlineQueue.filter(op => !processedOperations.includes(op.id));
    this.saveToLocalCache(CLOUD_STORAGE_KEYS.OFFLINE_QUEUE, this.offlineQueue);

    if (this.offlineQueue.length === 0) {
      this.syncStatus = SYNC_STATUS.SYNCED;
      console.log('🎉 所有离线操作已同步完成');
    } else {
      this.syncStatus = SYNC_STATUS.PENDING;
      console.log(`⏳ 还有 ${this.offlineQueue.length} 个操作等待同步`);
    }
    
    this.updateSyncStatusUI();
  }

  /**
   * 本地缓存操作
   */
  saveToLocalCache(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('本地缓存保存失败:', error);
      return false;
    }
  }

  getFromLocalCache(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('本地缓存读取失败:', error);
      return null;
    }
  }

  /**
   * 初始化默认区域配置
   */
  initializeDefaultRegions() {
    const regions = {};
    for (let i = 1; i <= 8; i++) {
      regions[i.toString()] = {
        id: i.toString(),
        name: `区域${i}`,
        isActive: false,
        postalCodes: [],
        weightRanges: [...DEFAULT_WEIGHT_RANGES],
        lastUpdated: new Date().toISOString(),
        metadata: {
          createdAt: new Date().toISOString(),
          version: '3.0.0',
          source: 'default'
        }
      };
    }
    return regions;
  }

  /**
   * 更新同步状态UI
   */
  updateSyncStatusUI() {
    // 触发自定义事件，让UI组件监听
    window.dispatchEvent(new CustomEvent('cloudSyncStatusChanged', {
      detail: {
        status: this.syncStatus,
        isOnline: this.isOnline,
        lastSyncTime: this.lastSyncTime,
        pendingOperations: this.offlineQueue.length
      }
    }));
  }

  /**
   * 获取同步状态信息
   */
  getSyncStatus() {
    return {
      status: this.syncStatus,
      isOnline: this.isOnline,
      lastSyncTime: this.lastSyncTime,
      pendingOperations: this.offlineQueue.length
    };
  }

  /**
   * 强制同步
   */
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('网络连接不可用');
    }

    await this.syncFromCloud();
    await this.processOfflineQueue();
  }
}

// 创建单例实例
export const cloudStorage = new CloudFirstStorageService();

export default cloudStorage;
