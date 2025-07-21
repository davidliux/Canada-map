/**
 * 服务器端存储系统
 * 所有数据直接保存到Vercel KV存储，不使用localStorage
 * 实现跨设备数据同步
 */

import { DEFAULT_WEIGHT_RANGES } from './unifiedStorage.js';

// API配置
const API_BASE_URL = '/api';
const REQUEST_TIMEOUT = 10000; // 10秒超时

// 同步状态枚举
export const SYNC_STATUS = {
  SYNCED: 'synced',           // 已同步
  SYNCING: 'syncing',         // 同步中
  ERROR: 'error',             // 同步错误
  LOADING: 'loading'          // 加载中
};

/**
 * 服务器端存储服务类
 */
export class ServerStorageService {
  constructor() {
    this.syncStatus = SYNC_STATUS.LOADING;
    this.lastSyncTime = null;
    this.cache = new Map(); // 内存缓存，提高性能
    this.cacheExpiry = new Map(); // 缓存过期时间
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
    
    // 初始化时检查服务器连接
    this.checkServerConnection();
  }

  /**
   * 检查服务器连接状态
   */
  async checkServerConnection() {
    try {
      this.syncStatus = SYNC_STATUS.LOADING;
      this.updateSyncStatusUI();
      
      const response = await this.makeAPIRequest('/regions', 'GET', null, 5000);
      if (response.success) {
        this.syncStatus = SYNC_STATUS.SYNCED;
        console.log('☁️ 服务器连接正常');
      } else {
        throw new Error('服务器响应异常');
      }
    } catch (error) {
      this.syncStatus = SYNC_STATUS.ERROR;
      console.error('❌ 服务器连接失败:', error.message);
    }
    
    this.updateSyncStatusUI();
  }

  /**
   * 发起API请求
   */
  async makeAPIRequest(endpoint, method = 'GET', data = null, timeout = REQUEST_TIMEOUT) {
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

      const result = await response.json();
      
      // 更新同步状态
      if (result.success) {
        this.syncStatus = SYNC_STATUS.SYNCED;
        this.lastSyncTime = new Date().toISOString();
      }
      
      this.updateSyncStatusUI();
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      this.syncStatus = SYNC_STATUS.ERROR;
      this.updateSyncStatusUI();
      
      if (error.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw error;
    }
  }

  /**
   * 获取所有区域配置（纯服务器端）
   */
  async getAllRegionConfigs() {
    const cacheKey = 'all_regions';
    
    // 检查缓存
    if (this.isValidCache(cacheKey)) {
      console.log('📱 使用内存缓存数据');
      return this.cache.get(cacheKey);
    }

    try {
      this.syncStatus = SYNC_STATUS.SYNCING;
      this.updateSyncStatusUI();

      const response = await this.makeAPIRequest('/regions');
      if (response.success && response.data) {
        // 更新缓存
        this.setCache(cacheKey, response.data);
        
        console.log('☁️ 从服务器获取数据成功');
        return response.data;
      } else {
        throw new Error(response.message || '服务器响应异常');
      }
    } catch (error) {
      console.error('☁️ 服务器获取失败:', error.message);
      
      // 如果有缓存数据，使用缓存
      if (this.cache.has(cacheKey)) {
        console.log('📱 使用过期缓存数据');
        return this.cache.get(cacheKey);
      }
      
      // 如果没有任何数据，返回默认配置
      console.log('🔧 使用默认配置');
      const defaultData = this.initializeDefaultRegions();
      
      // 尝试保存默认配置到服务器
      try {
        await this.saveAllRegionConfigs(defaultData);
      } catch (saveError) {
        console.warn('保存默认配置失败:', saveError.message);
      }
      
      return defaultData;
    }
  }

  /**
   * 保存所有区域配置（纯服务器端）
   */
  async saveAllRegionConfigs(regionConfigs) {
    try {
      this.syncStatus = SYNC_STATUS.SYNCING;
      this.updateSyncStatusUI();

      const response = await this.makeAPIRequest('/regions', 'POST', regionConfigs);
      if (response.success) {
        // 更新缓存
        this.setCache('all_regions', regionConfigs);
        
        console.log('☁️ 数据已保存到服务器');
        return true;
      } else {
        throw new Error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('☁️ 服务器保存失败:', error.message);
      throw error;
    }
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
   * 删除区域配置
   */
  async deleteRegionConfig(regionId) {
    const allConfigs = await this.getAllRegionConfigs();
    if (allConfigs[regionId]) {
      delete allConfigs[regionId];
      return await this.saveAllRegionConfigs(allConfigs);
    }
    return true;
  }

  /**
   * 缓存管理
   */
  setCache(key, data) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.cacheTimeout);
  }

  isValidCache(key) {
    if (!this.cache.has(key)) return false;
    const expiry = this.cacheExpiry.get(key);
    if (Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return false;
    }
    return true;
  }

  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
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
          source: 'server_default'
        }
      };
    }

    // 自动保存默认配置到服务器
    this.saveAllRegionConfigs(regions).catch(error => {
      console.warn('保存默认配置失败:', error.message);
    });

    return regions;
  }

  /**
   * 强制刷新数据
   */
  async forceRefresh() {
    this.clearCache();
    return await this.getAllRegionConfigs();
  }

  /**
   * 获取同步状态信息
   */
  getSyncStatus() {
    return {
      status: this.syncStatus,
      lastSyncTime: this.lastSyncTime,
      cacheSize: this.cache.size
    };
  }

  /**
   * 更新同步状态UI
   */
  updateSyncStatusUI() {
    // 触发自定义事件，让UI组件监听
    window.dispatchEvent(new CustomEvent('serverSyncStatusChanged', {
      detail: {
        status: this.syncStatus,
        lastSyncTime: this.lastSyncTime,
        cacheSize: this.cache.size
      }
    }));
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      const response = await this.makeAPIRequest('/regions', 'GET', null, 5000);
      const latency = Date.now() - startTime;
      
      return {
        healthy: response.success,
        latency,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建单例实例
export const serverStorage = new ServerStorageService();

export default serverStorage;
