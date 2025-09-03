/**
 * 跨浏览器持久化修复工具
 * 解决数据在不同浏览器间无法同步的问题
 */

import {
  getAllRegionConfigs,
  getAllRegionConfigsSync,
  saveAllRegionConfigs,
  createDefaultRegionConfig
} from './unifiedStorage.js';
import { dataConflictResolver } from './dataConflictResolver.js';
import { syncMonitor, SYNC_STATUS, SYNC_EVENTS } from './syncMonitor.js';

/**
 * 浏览器存储键名
 */
const STORAGE_KEYS = {
  REGION_DATA: 'unified_region_data',
  SYNC_TIMESTAMP: 'data_sync_timestamp',
  BROWSER_ID: 'browser_session_id',
  CROSS_BROWSER_DATA: 'cross_browser_region_data'
};

/**
 * 生成浏览器会话ID
 */
const generateBrowserId = () => {
  return `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 获取或创建浏览器ID
 */
const getBrowserId = () => {
  let browserId = localStorage.getItem(STORAGE_KEYS.BROWSER_ID);
  if (!browserId) {
    browserId = generateBrowserId();
    localStorage.setItem(STORAGE_KEYS.BROWSER_ID, browserId);
  }
  return browserId;
};

/**
 * 跨浏览器数据同步机制
 * 使用LocalStorage + IndexedDB + 云存储的多层同步策略
 */
export class CrossBrowserPersistence {
  constructor() {
    this.browserId = getBrowserId();
    this.syncInterval = null;
    this.lastSyncTime = 0;
  }

  /**
   * 初始化跨浏览器持久化
   */
  async initialize() {
    console.log('🔄 初始化跨浏览器持久化...');
    
    try {
      // 1. 检查现有数据
      const existingData = await this.loadFromAllSources();
      
      // 2. 合并和验证数据
      const mergedData = this.mergeDataSources(existingData);
      
      // 3. 保存到所有存储层
      await this.saveToAllSources(mergedData);
      
      // 4. 启动定期同步
      this.startPeriodicSync();
      
      console.log('✅ 跨浏览器持久化初始化完成');
      return true;
    } catch (error) {
      console.error('❌ 跨浏览器持久化初始化失败:', error);
      return false;
    }
  }

  /**
   * 从所有存储源加载数据
   */
  async loadFromAllSources() {
    const sources = {
      localStorage: null,
      indexedDB: null,
      fileSystem: null,
      cloudStorage: null
    };

    // 1. 从LocalStorage加载
    try {
      const localData = localStorage.getItem(STORAGE_KEYS.REGION_DATA);
      if (localData) {
        sources.localStorage = JSON.parse(localData);
      }
    } catch (error) {
      console.warn('LocalStorage加载失败:', error);
    }

    // 2. 从IndexedDB加载
    try {
      sources.indexedDB = await this.loadFromIndexedDB();
    } catch (error) {
      console.warn('IndexedDB加载失败:', error);
    }

    // 3. 从文件系统加载（如果在Electron环境）
    try {
      if (window.electronAPI) {
        const { readFromFile } = await import('./persistentStorage.js');
        sources.fileSystem = await readFromFile();
      }
    } catch (error) {
      console.warn('文件系统加载失败:', error);
    }

    // 4. 从云存储加载（未来扩展）
    // sources.cloudStorage = await this.loadFromCloudStorage();

    return sources;
  }

  /**
   * 保存到所有存储源
   */
  async saveToAllSources(data) {
    const results = {
      localStorage: false,
      indexedDB: false,
      fileSystem: false,
      cloudStorage: false
    };

    // 1. 保存到LocalStorage
    try {
      localStorage.setItem(STORAGE_KEYS.REGION_DATA, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.SYNC_TIMESTAMP, Date.now().toString());
      results.localStorage = true;
    } catch (error) {
      console.warn('LocalStorage保存失败:', error);
    }

    // 2. 保存到IndexedDB
    try {
      results.indexedDB = await this.saveToIndexedDB(data);
    } catch (error) {
      console.warn('IndexedDB保存失败:', error);
    }

    // 3. 保存到文件系统
    try {
      if (window.electronAPI) {
        const { writeToFile } = await import('./persistentStorage.js');
        results.fileSystem = await writeToFile(data);
      }
    } catch (error) {
      console.warn('文件系统保存失败:', error);
    }

    // 4. 保存到云存储（未来扩展）
    // results.cloudStorage = await this.saveToCloudStorage(data);

    return results;
  }

  /**
   * 合并多个数据源
   */
  mergeDataSources(sources) {
    const { localStorage: local, indexedDB, fileSystem, cloudStorage } = sources;
    
    // 优先级：fileSystem > indexedDB > localStorage > cloudStorage
    let mergedData = null;
    
    if (fileSystem && Object.keys(fileSystem).length > 0) {
      mergedData = fileSystem;
      console.log('使用文件系统数据作为主数据源');
    } else if (indexedDB && Object.keys(indexedDB).length > 0) {
      mergedData = indexedDB;
      console.log('使用IndexedDB数据作为主数据源');
    } else if (local && Object.keys(local).length > 0) {
      mergedData = local;
      console.log('使用LocalStorage数据作为主数据源');
    } else if (cloudStorage && Object.keys(cloudStorage).length > 0) {
      mergedData = cloudStorage;
      console.log('使用云存储数据作为主数据源');
    }

    // 如果没有任何数据，创建默认数据
    if (!mergedData) {
      console.log('没有找到现有数据，创建默认数据');
      mergedData = this.createDefaultData();
    }

    // 验证和清理数据
    return this.validateAndCleanData(mergedData);
  }

  /**
   * 创建默认数据
   */
  createDefaultData() {
    const defaultData = {};
    for (let i = 1; i <= 8; i++) {
      defaultData[i.toString()] = createDefaultRegionConfig(i.toString());
    }
    return defaultData;
  }

  /**
   * 验证和清理数据
   */
  validateAndCleanData(data) {
    if (!data || typeof data !== 'object') {
      return this.createDefaultData();
    }

    const cleanedData = {};
    
    // 确保有8个区域
    for (let i = 1; i <= 8; i++) {
      const regionId = i.toString();
      if (data[regionId] && typeof data[regionId] === 'object') {
        cleanedData[regionId] = {
          ...createDefaultRegionConfig(regionId, `区域${regionId}`, false),
          ...data[regionId],
          id: regionId,
          lastUpdated: new Date().toISOString()
        };
      } else {
        cleanedData[regionId] = createDefaultRegionConfig(regionId);
      }
    }

    return cleanedData;
  }

  /**
   * IndexedDB操作
   */
  async loadFromIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CanadaPostalDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['regionData'], 'readonly');
        const store = transaction.objectStore('regionData');
        const getRequest = store.get('regions');
        
        getRequest.onsuccess = () => {
          resolve(getRequest.result ? getRequest.result.data : null);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('regionData')) {
          db.createObjectStore('regionData', { keyPath: 'id' });
        }
      };
    });
  }

  async saveToIndexedDB(data) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CanadaPostalDB', 1);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['regionData'], 'readwrite');
        const store = transaction.objectStore('regionData');
        
        const putRequest = store.put({
          id: 'regions',
          data: data,
          timestamp: Date.now(),
          browserId: this.browserId
        });
        
        putRequest.onsuccess = () => resolve(true);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('regionData')) {
          db.createObjectStore('regionData', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * 启动定期同步
   */
  startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // 每30秒同步一次
    this.syncInterval = setInterval(async () => {
      try {
        await this.performSync();
      } catch (error) {
        console.warn('定期同步失败:', error);
      }
    }, 30000);
  }

  /**
   * 执行同步
   */
  async performSync() {
    const now = Date.now();
    if (now - this.lastSyncTime < 10000) {
      return; // 避免频繁同步
    }

    this.lastSyncTime = now;
    
    try {
      const currentData = await getAllRegionConfigs();
      await this.saveToAllSources(currentData);
      console.log('🔄 数据同步完成');
    } catch (error) {
      console.warn('数据同步失败:', error);
    }
  }

  /**
   * 停止同步
   */
  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * 手动触发同步
   */
  async manualSync() {
    console.log('🔄 手动触发数据同步...');
    await this.performSync();
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      browserId: this.browserId,
      lastSyncTime: this.lastSyncTime,
      isAutoSyncEnabled: !!this.syncInterval,
      syncInterval: this.syncInterval ? 30000 : 0
    };
  }
}

// 创建全局实例
export const crossBrowserPersistence = new CrossBrowserPersistence();

// 导出到全局对象
if (typeof window !== 'undefined') {
  window.crossBrowserPersistence = crossBrowserPersistence;
}
