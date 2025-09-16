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
      enableLocalCache: false, // 禁用本地缓存，强制使用数据库
      enableAutoSync: true, // 启用自动同步到数据库
      syncIntervalMs: 1000, // 1秒自动同步，更快响应
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
    // 不再从localStorage恢复缓存，直接从数据库获取
    // this.restoreLocalCache(); // 移除localStorage依赖

    // 始终从数据库获取最新数据
    try {
      // 检查是否需要初始化 regions（仅在 FSA 系统中使用）
      // 卡车配送系统不需要这个
      const pathname = window.location.pathname;
      const isFSASystem = pathname === '/dashboard' ||
                          pathname.startsWith('/settings/regions') ||
                          pathname.startsWith('/settings/prices') ||
                          pathname.startsWith('/settings/postal');

      if (isFSASystem) {
        console.log('正在从数据库加载数据...');
        const regions = await regionApiService.getAllRegions();

        // 直接使用数据库数据
        if (regions && Object.keys(regions).length > 0) {
          console.log('成功从数据库加载数据');

          // 清空缓存并重新加载
          this.localCache.clear();
          Object.entries(regions).forEach(([id, serverData]) => {
            this.localCache.set(id, serverData);
          });

          // 不再保存到localStorage
          // this.saveLocalCache(); // 移除localStorage保存
          console.log('数据库数据加载完成，区域数量:', this.localCache.size);
        } else {
          console.log('数据库暂无数据，需要创建区域配置');
        }
      }
    } catch (error) {
      console.error('从数据库加载数据失败:', error);
      // 不再使用localStorage作为备份
      console.error('无法连接到数据库，请检查后端服务');
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
    // 始终从数据库获取最新数据，不再依赖本地缓存
    try {
      console.log('正在从数据库获取区域数据...');
      // 从服务器获取数据
      const regions = await regionApiService.getAllRegions(true, true);

      // 更新内存缓存（仅用于性能优化，不作为数据源）
      this.localCache.clear();
      Object.entries(regions).forEach(([key, value]) => {
        this.localCache.set(key, value);
      });

      // 不再保存到localStorage
      // this.saveLocalCache(); // 移除localStorage保存

      // 通知监听器
      this.notifyListeners('refresh', regions);

      console.log('成功从数据库获取数据，区域数量:', Object.keys(regions).length);
      return regions;
    } catch (error) {
      console.error('获取区域数据失败:', error);
      // 如果内存中有缓存，返回内存缓存（仅作为临时降级方案）
      if (this.localCache.size > 0) {
        console.warn('使用内存缓存作为临时降级方案');
        const regions = {};
        this.localCache.forEach((value, key) => {
          regions[key] = value;
        });
        return regions;
      }
      // 如果没有任何数据，返回空对象
      console.error('无法获取任何数据');
      return {};
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
    try {
      // 直接调用API更新数据库
      const updatedData = await regionApiService.updateRegion(regionId, updateData);

      // 更新本地缓存（如果启用）
      if (this.config.enableLocalCache) {
        this.localCache.set(regionId, updatedData);
        this.saveLocalCache();
      }

      // 通知监听器
      this.notifyListeners('update', { regionId, data: updatedData });

      return updatedData;
    } catch (error) {
      console.error('更新区域失败:', error);

      // 如果API失败，添加到同步队列稍后重试
      this.addToSyncQueue({
        type: 'update',
        regionId,
        data: updateData,
        timestamp: Date.now()
      });

      // 返回本地数据（如果有）
      const localData = this.localCache.get(regionId);
      if (localData) {
        return { ...localData, ...updateData };
      }
      throw error;
    }
  }

  /**
   * 更新区域FSA
   * @param {string} regionId - 区域ID
   * @param {string[]} fsaCodes - FSA列表
   * @returns {Promise<void>}
   */
  async updateRegionFSAs(regionId, fsaCodes) {
    try {
      // 直接更新数据库
      const updateData = {
        postalCodes: fsaCodes,
        fsaCodes: fsaCodes,
        lastUpdated: new Date().toISOString()
      };

      await regionApiService.updateRegion(regionId, updateData);

      // 更新本地缓存（如果启用）
      if (this.config.enableLocalCache) {
        const region = this.localCache.get(regionId) || {};
        region.fsaCodes = fsaCodes;
        region.postalCodes = fsaCodes;
        region.lastUpdated = updateData.lastUpdated;
        this.localCache.set(regionId, region);
        this.saveLocalCache();
      }

      // 通知监听器
      this.notifyListeners('fsa-update', { regionId, fsaCodes });
    } catch (error) {
      console.error('更新FSA失败:', error);

      // 添加到同步队列稍后重试
      this.addToSyncQueue({
        type: 'update',
        regionId,
        data: { fsaCodes, postalCodes: fsaCodes },
        timestamp: Date.now()
      });

      throw error;
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
    try {
      // 直接更新数据库
      const updateData = {
        weightRanges: weightRanges,
        lastUpdated: new Date().toISOString()
      };

      await regionApiService.updateRegion(regionId, updateData);

      // 更新本地缓存（如果启用）
      if (this.config.enableLocalCache) {
        const region = this.localCache.get(regionId) || {};
        region.weightRanges = weightRanges;
        region.lastUpdated = updateData.lastUpdated;
        this.localCache.set(regionId, region);
        this.saveLocalCache();
      }

      // 通知监听器
      this.notifyListeners('price-update', { regionId, weightRanges });
    } catch (error) {
      console.error('更新价格失败:', error);

      // 添加到同步队列稍后重试
      this.addToSyncQueue({
        type: 'prices',
        regionId,
        data: { weightRanges },
        timestamp: Date.now()
      });

      throw error;
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