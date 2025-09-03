/**
 * 混合存储服务
 * 提供本地缓存和后端同步的统一接口
 */

import regionApiService from './regionApiService';

class StorageService {
  constructor() {
    this.localCache = new Map();
    this.syncQueue = [];
    this.isSyncing = false;
    this.syncInterval = null;
    this.listeners = new Set();
    
    // 配置选项
    this.config = {
      enableLocalCache: true,
      enableAutoSync: true, // 重新启用自动同步到数据库
      syncIntervalMs: 5000, // 5秒自动同步
      maxRetries: 3,
      retryDelayMs: 1000
    };
    
    // 初始化
    this.init();
  }

  /**
   * 初始化服务
   */
  async init() {
    // 先从本地存储恢复缓存作为备用
    this.restoreLocalCache();
    
    // 始终尝试从数据库获取最新数据
    try {
      const regions = await regionApiService.getAllRegions();
      
      // 如果数据库有数据，智能合并而不是覆盖
      if (regions && Object.keys(regions).length > 0) {
        console.log('从数据库加载数据，准备合并...');
        
        // 智能合并：保留更完整的数据
        Object.entries(regions).forEach(([id, serverData]) => {
          const localData = this.localCache.get(id);
          
          if (!localData) {
            // 本地没有此区域，直接使用服务器数据
            this.localCache.set(id, serverData);
          } else {
            // 合并数据：优先使用有内容的数据
            const mergedData = {
              ...serverData,
              // 如果服务器的postalCodes为空但本地有数据，保留本地数据
              postalCodes: (serverData.postalCodes && serverData.postalCodes.length > 0) 
                ? serverData.postalCodes 
                : (localData.postalCodes || []),
              // 同样处理weightRanges
              weightRanges: (serverData.weightRanges && serverData.weightRanges.length > 0)
                ? serverData.weightRanges
                : (localData.weightRanges || [])
            };
            
            this.localCache.set(id, mergedData);
            
            // 如果本地数据更完整，同步回服务器
            if (localData.postalCodes && localData.postalCodes.length > 0 && 
                (!serverData.postalCodes || serverData.postalCodes.length === 0)) {
              console.log(`区域 ${id} 本地有邮编数据但服务器无，准备同步到服务器`);
              this.addToSyncQueue({
                type: 'update',
                regionId: id,
                data: mergedData,
                timestamp: Date.now()
              });
            }
          }
        });
        
        this.saveLocalCache();
        console.log('数据合并完成，区域数量:', this.localCache.size);
      } else {
        console.log('数据库无数据，使用本地缓存');
        // 如果本地缓存也为空，触发默认数据初始化
        if (this.localCache.size === 0) {
          console.log('本地缓存也为空，需要手动创建区域配置');
        }
      }
    } catch (error) {
      console.warn('从数据库加载数据失败，使用本地缓存:', error);
      // 如果本地缓存也为空，这是一个问题
      if (this.localCache.size === 0) {
        console.error('数据库和本地缓存都无数据，系统需要初始化');
      }
    }
    
    // 启动自动同步
    if (this.config.enableAutoSync) {
      this.startAutoSync();
    }
    
    // 监听页面卸载事件，确保数据保存
    window.addEventListener('beforeunload', () => this.flushSync());
  }

  /**
   * 从localStorage恢复缓存
   */
  restoreLocalCache() {
    try {
      const cached = localStorage.getItem('unified_region_data');
      if (cached) {
        const data = JSON.parse(cached);
        Object.entries(data).forEach(([key, value]) => {
          this.localCache.set(key, value);
        });
      }
    } catch (error) {
      console.error('恢复本地缓存失败:', error);
    }
  }

  /**
   * 保存缓存到localStorage
   */
  saveLocalCache() {
    try {
      const data = {};
      this.localCache.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem('unified_region_data', JSON.stringify(data));
    } catch (error) {
      console.error('保存本地缓存失败:', error);
    }
  }

  /**
   * 获取所有区域配置
   * @param {boolean} forceRefresh - 强制从服务器刷新
   * @returns {Promise<Object>} 区域配置
   */
  async getAllRegions(forceRefresh = false) {
    // 如果不强制刷新且有缓存，返回缓存
    if (!forceRefresh && this.localCache.size > 0) {
      const regions = {};
      this.localCache.forEach((value, key) => {
        regions[key] = value;
      });
      return regions;
    }

    try {
      // 从服务器获取数据
      const regions = await regionApiService.getAllRegions(true, true);
      
      // 更新本地缓存
      this.localCache.clear();
      Object.entries(regions).forEach(([key, value]) => {
        this.localCache.set(key, value);
      });
      
      // 保存到localStorage
      this.saveLocalCache();
      
      // 通知监听器
      this.notifyListeners('refresh', regions);
      
      return regions;
    } catch (error) {
      console.error('获取区域数据失败，使用本地缓存:', error);
      // 如果API失败，返回本地缓存
      const regions = {};
      this.localCache.forEach((value, key) => {
        regions[key] = value;
      });
      return regions;
    }
  }

  /**
   * 获取单个区域配置
   * @param {string} regionId - 区域ID
   * @returns {Promise<Object>} 区域配置
   */
  async getRegion(regionId) {
    // 先检查缓存
    if (this.localCache.has(regionId)) {
      return this.localCache.get(regionId);
    }

    try {
      // 从服务器获取
      const region = await regionApiService.getRegionById(regionId);
      
      // 更新缓存
      this.localCache.set(regionId, region);
      this.saveLocalCache();
      
      return region;
    } catch (error) {
      console.error(`获取区域 ${regionId} 失败:`, error);
      return null;
    }
  }

  /**
   * 更新区域配置
   * @param {string} regionId - 区域ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的区域
   */
  async updateRegion(regionId, updateData) {
    // 先更新本地缓存（乐观更新）
    const currentData = this.localCache.get(regionId) || {};
    const updatedData = { ...currentData, ...updateData, lastUpdated: new Date().toISOString() };
    this.localCache.set(regionId, updatedData);
    this.saveLocalCache();
    
    // 通知监听器
    this.notifyListeners('update', { regionId, data: updatedData });
    
    // 添加到同步队列
    this.addToSyncQueue({
      type: 'update',
      regionId,
      data: updateData,
      timestamp: Date.now()
    });
    
    // 触发同步（如果启用）
    if (this.config.enableAutoSync) {
      this.triggerSync();
    }
    
    return updatedData;
  }

  /**
   * 更新区域FSA
   * @param {string} regionId - 区域ID
   * @param {string[]} fsaCodes - FSA列表
   * @returns {Promise<void>}
   */
  async updateRegionFSAs(regionId, fsaCodes) {
    const region = this.localCache.get(regionId) || {};
    region.fsaCodes = fsaCodes;
    region.lastUpdated = new Date().toISOString();
    
    this.localCache.set(regionId, region);
    this.saveLocalCache();
    
    // 通知监听器
    this.notifyListeners('fsa-update', { regionId, fsaCodes });
    
    // 添加到同步队列 - 只更新fsaCodes字段
    this.addToSyncQueue({
      type: 'update',
      regionId,
      data: { fsaCodes },
      timestamp: Date.now()
    });
    
    // 触发同步（如果启用）
    if (this.config.enableAutoSync) {
      this.triggerSync();
    }
  }

  /**
   * 更新区域邮编
   * @param {string} regionId - 区域ID
   * @param {string[]} postalCodes - 邮编列表
   * @returns {Promise<void>}
   */
  async updateRegionPostalCodes(regionId, postalCodes) {
    const region = this.localCache.get(regionId) || {};
    region.postalCodes = postalCodes;
    region.lastUpdated = new Date().toISOString();
    
    this.localCache.set(regionId, region);
    this.saveLocalCache();
    
    // 通知监听器
    this.notifyListeners('postal-update', { regionId, postalCodes });
    
    // 添加到同步队列
    this.addToSyncQueue({
      type: 'postal-codes',
      regionId,
      data: { postalCodes },
      timestamp: Date.now()
    });
    
    // 触发同步（如果启用）
    if (this.config.enableAutoSync) {
      this.triggerSync();
    }
  }

  /**
   * 更新区域价格
   * @param {string} regionId - 区域ID
   * @param {Array} weightRanges - 重量区间配置
   * @returns {Promise<void>}
   */
  async updateRegionPrices(regionId, weightRanges) {
    const region = this.localCache.get(regionId) || {};
    region.weightRanges = weightRanges;
    region.lastUpdated = new Date().toISOString();
    
    this.localCache.set(regionId, region);
    this.saveLocalCache();
    
    // 通知监听器
    this.notifyListeners('price-update', { regionId, weightRanges });
    
    // 添加到同步队列
    this.addToSyncQueue({
      type: 'prices',
      regionId,
      data: { weightRanges },
      timestamp: Date.now()
    });
    
    // 触发同步（如果启用）
    if (this.config.enableAutoSync) {
      this.triggerSync();
    }
  }

  /**
   * 添加到同步队列
   * @param {Object} item - 同步项
   */
  addToSyncQueue(item) {
    // 检查是否已有相同的待同步项
    const existingIndex = this.syncQueue.findIndex(
      q => q.type === item.type && q.regionId === item.regionId
    );
    
    if (existingIndex >= 0) {
      // 替换为最新的
      this.syncQueue[existingIndex] = item;
    } else {
      this.syncQueue.push(item);
    }
  }

  /**
   * 触发同步
   */
  async triggerSync() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return;
    }
    
    this.isSyncing = true;
    
    try {
      await this.processSyncQueue();
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 处理同步队列
   */
  async processSyncQueue() {
    const failedItems = [];
    
    while (this.syncQueue.length > 0) {
      const item = this.syncQueue.shift();
      
      try {
        await this.syncItem(item);
      } catch (error) {
        console.error('同步失败:', error);
        item.retryCount = (item.retryCount || 0) + 1;
        
        if (item.retryCount < this.config.maxRetries) {
          failedItems.push(item);
        } else {
          console.error('同步失败已达最大重试次数:', item);
          this.notifyListeners('sync-error', { item, error });
        }
      }
    }
    
    // 将失败的项重新加入队列
    this.syncQueue.push(...failedItems);
  }

  /**
   * 同步单个项
   * @param {Object} item - 同步项
   */
  async syncItem(item) {
    switch (item.type) {
      case 'update':
        await regionApiService.updateRegion(item.regionId, item.data);
        break;
      
      case 'postal-codes':
        // 将邮编更新作为区域更新的一部分
        const currentRegion = this.localCache.get(item.regionId);
        if (currentRegion && item.data.postalCodes) {
          const updateData = {
            postalCodes: item.data.postalCodes,
          };
          await regionApiService.updateRegion(item.regionId, updateData);
        }
        break;
      
      case 'prices':
        // 将价格更新作为区域更新的一部分
        const region = this.localCache.get(item.regionId);
        if (region && item.data.weightRanges) {
          const updateData = {
            ...region,
            weightRanges: item.data.weightRanges
          };
          await regionApiService.updateRegion(item.regionId, updateData);
        }
        break;
      
      default:
        console.warn('未知的同步类型:', item.type);
    }
    
    this.notifyListeners('sync-success', { item });
  }

  /**
   * 强制立即同步
   */
  async flushSync() {
    await this.triggerSync();
  }

  /**
   * 后台同步数据（不覆盖本地缓存）
   */
  async backgroundSync() {
    try {
      // 静默尝试从后端获取数据，用于后续同步比较
      // 但不覆盖本地缓存，只记录服务器状态
      await regionApiService.getAllRegions();
      console.log('后台同步检查成功，服务器可达');
    } catch (error) {
      console.log('后台同步检查失败，服务器不可达:', error.message);
    }
  }

  /**
   * 启动自动同步
   */
  startAutoSync() {
    if (this.syncInterval) {
      return;
    }
    
    this.syncInterval = setInterval(() => {
      this.triggerSync();
    }, this.config.syncIntervalMs);
  }

  /**
   * 停止自动同步
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 添加事件监听器
   * @param {Function} listener - 监听器函数
   * @returns {Function} 取消订阅函数
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   * @param {string} event - 事件类型
   * @param {*} data - 事件数据
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener({ event, data, timestamp: Date.now() });
      } catch (error) {
        console.error('监听器执行错误:', error);
      }
    });
  }

  /**
   * 清除所有缓存
   */
  clearCache() {
    this.localCache.clear();
    localStorage.removeItem('unified_region_data');
    this.syncQueue = [];
    this.notifyListeners('cache-cleared', {});
  }

  /**
   * 获取同步状态
   * @returns {Object} 同步状态
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      queueLength: this.syncQueue.length,
      cacheSize: this.localCache.size,
      autoSyncEnabled: this.config.enableAutoSync
    };
  }
}

// 创建单例实例
const storageService = new StorageService();

// 导出服务实例
export default storageService;

// 也导出类
export { StorageService };