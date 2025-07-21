/**
 * localStorage存储适配器
 * 恢复到简单稳定的localStorage存储方式
 * 兼容serverStorage接口，但使用localStorage实现
 */

import { 
  getAllRegionConfigs, 
  saveAllRegionConfigs, 
  getRegionConfig, 
  saveRegionConfig,
  getStorageStats,
  DEFAULT_WEIGHT_RANGES,
  createDefaultRegionConfig
} from './unifiedStorage.js';

// 同步状态枚举（兼容serverStorage）
export const SYNC_STATUS = {
  SYNCED: 'synced',
  SYNCING: 'syncing', 
  ERROR: 'error',
  LOADING: 'loading'
};

/**
 * localStorage存储适配器类
 * 提供与serverStorage相同的接口，但使用localStorage实现
 */
export class LocalStorageAdapter {
  constructor() {
    this.syncStatus = SYNC_STATUS.SYNCED;
    this.lastSyncTime = new Date().toISOString();
    this.cache = new Map();
    
    console.log('📱 使用localStorage存储适配器');
    this.checkAndInitialize();
  }

  /**
   * 检查并初始化数据
   */
  checkAndInitialize() {
    try {
      const configs = getAllRegionConfigs();
      console.log('📊 localStorage数据检查完成:', Object.keys(configs).length, '个区域');
      this.updateSyncStatusUI();
    } catch (error) {
      console.error('localStorage初始化失败:', error);
      this.syncStatus = SYNC_STATUS.ERROR;
      this.updateSyncStatusUI();
    }
  }

  /**
   * 检查服务器连接状态（localStorage模式下总是成功）
   */
  async checkServerConnection() {
    this.syncStatus = SYNC_STATUS.SYNCED;
    this.lastSyncTime = new Date().toISOString();
    this.updateSyncStatusUI();
    console.log('📱 localStorage模式：无需服务器连接');
  }

  /**
   * 获取所有区域配置
   */
  async getAllRegionConfigs() {
    try {
      this.syncStatus = SYNC_STATUS.SYNCING;
      this.updateSyncStatusUI();
      
      const configs = getAllRegionConfigs();
      
      this.syncStatus = SYNC_STATUS.SYNCED;
      this.lastSyncTime = new Date().toISOString();
      this.updateSyncStatusUI();
      
      console.log('📱 从localStorage获取区域配置:', Object.keys(configs).length, '个区域');
      return configs;
    } catch (error) {
      this.syncStatus = SYNC_STATUS.ERROR;
      this.updateSyncStatusUI();
      console.error('获取区域配置失败:', error);
      
      // 返回默认配置
      return this.initializeDefaultRegions();
    }
  }

  /**
   * 保存所有区域配置
   */
  async saveAllRegionConfigs(regionConfigs) {
    try {
      this.syncStatus = SYNC_STATUS.SYNCING;
      this.updateSyncStatusUI();
      
      const success = saveAllRegionConfigs(regionConfigs);
      
      if (success) {
        this.syncStatus = SYNC_STATUS.SYNCED;
        this.lastSyncTime = new Date().toISOString();
        console.log('📱 区域配置已保存到localStorage');
      } else {
        throw new Error('保存失败');
      }
      
      this.updateSyncStatusUI();
      return success;
    } catch (error) {
      this.syncStatus = SYNC_STATUS.ERROR;
      this.updateSyncStatusUI();
      console.error('保存区域配置失败:', error);
      throw error;
    }
  }

  /**
   * 保存单个区域配置
   */
  async saveRegionConfig(regionId, config) {
    try {
      this.syncStatus = SYNC_STATUS.SYNCING;
      this.updateSyncStatusUI();
      
      const success = saveRegionConfig(regionId, config);
      
      if (success) {
        this.syncStatus = SYNC_STATUS.SYNCED;
        this.lastSyncTime = new Date().toISOString();
        console.log(`📱 区域${regionId}配置已保存到localStorage`);
      } else {
        throw new Error('保存失败');
      }
      
      this.updateSyncStatusUI();
      return success;
    } catch (error) {
      this.syncStatus = SYNC_STATUS.ERROR;
      this.updateSyncStatusUI();
      console.error(`保存区域${regionId}配置失败:`, error);
      throw error;
    }
  }

  /**
   * 获取单个区域配置
   */
  async getRegionConfig(regionId) {
    try {
      const config = getRegionConfig(regionId);
      console.log(`📱 从localStorage获取区域${regionId}配置:`, config ? '成功' : '不存在');
      return config;
    } catch (error) {
      console.error(`获取区域${regionId}配置失败:`, error);
      return null;
    }
  }

  /**
   * 删除区域配置
   */
  async deleteRegionConfig(regionId) {
    try {
      const allConfigs = await this.getAllRegionConfigs();
      if (allConfigs[regionId]) {
        delete allConfigs[regionId];
        return await this.saveAllRegionConfigs(allConfigs);
      }
      return true;
    } catch (error) {
      console.error(`删除区域${regionId}配置失败:`, error);
      throw error;
    }
  }

  /**
   * 强制刷新数据（localStorage模式下立即返回）
   */
  async forceRefresh() {
    console.log('📱 localStorage模式：强制刷新');
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
   * 健康检查（localStorage模式下总是健康）
   */
  async healthCheck() {
    return {
      healthy: true,
      latency: 0,
      timestamp: new Date().toISOString(),
      storage: 'localStorage'
    };
  }

  /**
   * 初始化默认区域配置
   */
  initializeDefaultRegions() {
    const regions = {};
    for (let i = 1; i <= 8; i++) {
      regions[i.toString()] = createDefaultRegionConfig(i.toString());
    }
    
    // 自动保存默认配置
    try {
      saveAllRegionConfigs(regions);
      console.log('📱 默认区域配置已初始化到localStorage');
    } catch (error) {
      console.warn('保存默认配置失败:', error);
    }
    
    return regions;
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats() {
    try {
      const stats = getStorageStats();
      return {
        ...stats,
        storageType: 'localStorage',
        lastSyncTime: this.lastSyncTime
      };
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return {
        totalRegions: 0,
        activeRegions: 0,
        totalPostalCodes: 0,
        storageType: 'localStorage',
        lastSyncTime: this.lastSyncTime
      };
    }
  }
}

// 创建单例实例
export const localStorageAdapter = new LocalStorageAdapter();

export default localStorageAdapter;
