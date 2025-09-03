/**
 * 模拟 localStorage 的服务端存储
 * 使用内存存储，适用于 Serverless 环境
 * 注意：这是临时方案，生产环境应使用数据库
 */

// 使用全局变量在函数调用之间保持数据
// Vercel 会在一定时间内重用函数实例
let memoryStorage = {};

// 初始化默认数据
const initializeDefaultData = () => {
  if (!memoryStorage.initialized) {
    memoryStorage = {
      initialized: true,
      regions: {},
      lastUpdate: new Date().toISOString()
    };
  }
};

export const serverStorage = {
  getItem: (key) => {
    initializeDefaultData();
    return memoryStorage[key] || null;
  },
  
  setItem: (key, value) => {
    initializeDefaultData();
    memoryStorage[key] = value;
    memoryStorage.lastUpdate = new Date().toISOString();
  },
  
  removeItem: (key) => {
    initializeDefaultData();
    delete memoryStorage[key];
    memoryStorage.lastUpdate = new Date().toISOString();
  },
  
  getAllRegions: () => {
    initializeDefaultData();
    return memoryStorage.regions || {};
  },
  
  getRegion: (id) => {
    initializeDefaultData();
    return memoryStorage.regions?.[id] || null;
  },
  
  setRegion: (id, data) => {
    initializeDefaultData();
    if (!memoryStorage.regions) {
      memoryStorage.regions = {};
    }
    memoryStorage.regions[id] = {
      ...data,
      id,
      lastUpdated: new Date().toISOString()
    };
    memoryStorage.lastUpdate = new Date().toISOString();
  },
  
  deleteRegion: (id) => {
    initializeDefaultData();
    if (memoryStorage.regions?.[id]) {
      delete memoryStorage.regions[id];
      memoryStorage.lastUpdate = new Date().toISOString();
      return true;
    }
    return false;
  }
};