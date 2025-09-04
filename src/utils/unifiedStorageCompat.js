/**
 * 统一存储的向后兼容层
 * 提供同步风格的API以支持旧代码
 * 注意：这些函数会返回缓存数据，并在后台触发更新
 */

import storageService from '../services/storageService';
import { UNIFIED_STORAGE_KEYS, initializeDefaultRegions, getAllRegionConfigs, saveRegionConfig, getRegionStats as getRegionStatsAsync } from './unifiedStorage';
import { regionService, isSupabaseConfigured } from '../services/supabaseClient';

// 本地缓存副本
let localCache = {};
let isInitialized = false;

/**
 * 初始化兼容层
 * 应在应用启动时调用
 */
export const initCompatLayer = async () => {
  if (isInitialized) {
    console.log('兼容层已初始化，跳过');
    return;
  }
  
  try {
    // 从 Supabase 获取初始数据
    if (isSupabaseConfigured()) {
      console.log('🌐 从 Supabase 初始化兼容层...');
      localCache = await getAllRegionConfigs(true);
      isInitialized = true;
      console.log('✅ 兼容层初始化成功，加载', Object.keys(localCache).length, '个区域');
    } else {
      console.error('❌ Supabase 未配置');
      localCache = {}; // 返回空对象而不是创建默认区域
      isInitialized = true;
    }
  } catch (error) {
    console.error('兼容层初始化失败:', error);
    localCache = {}; // 返回空对象而不是创建默认区域
    isInitialized = true;
  }
};

/**
 * 同步获取所有区域配置（兼容函数）
 * @returns {Object} 区域配置对象
 */
export const getAllRegionConfigsSync = () => {
  if (!isInitialized) {
    console.warn('兼容层未初始化，触发异步初始化');
    // 触发异步初始化
    initCompatLayer();
    return localCache;
  }
  
  // 触发异步刷新以获取最新数据库数据
  getAllRegionConfigs(false).then(configs => {
    localCache = configs;
  }).catch(console.error);
  
  return { ...localCache };
};

/**
 * 同步获取单个区域配置（兼容函数）
 * @param {string} regionId - 区域ID
 * @returns {Object|null} 区域配置
 */
export const getRegionConfigSync = (regionId) => {
  if (!isInitialized) {
    console.warn('兼容层未初始化');
    initCompatLayer();
  }
  
  // 如果缓存中没有，触发异步从 Supabase 获取
  if (!localCache[regionId] && isSupabaseConfigured()) {
    regionService.getRegion(regionId).then(region => {
      if (region) {
        localCache[regionId] = region;
      }
    }).catch(console.error);
  }
  
  return localCache[regionId] || null;
};

/**
 * 同步保存区域配置（兼容函数）
 * 注意：实际保存是异步的，此函数立即返回
 * @param {string} regionId - 区域ID
 * @param {Object} config - 区域配置
 * @returns {boolean} 总是返回true（乐观更新）
 */
export const saveRegionConfigSync = (regionId, config) => {
  // 立即更新本地缓存（乐观更新）
  localCache[regionId] = {
    ...config,
    lastUpdated: new Date().toISOString()
  };
  
  // 触发异步保存到 Supabase
  saveRegionConfig(regionId, config).catch(error => {
    console.error('异步保存到 Supabase 失败:', error);
    // 可以在这里实现重试逻辑
  });
  
  return true;
};

/**
 * 同步保存所有区域配置（兼容函数）
 * @param {Object} regionConfigs - 区域配置集合
 * @returns {boolean} 总是返回true
 */
export const saveAllRegionConfigsSync = (regionConfigs) => {
  // 更新本地缓存
  localCache = { ...regionConfigs };
  
  // 触发批量更新到 Supabase
  Object.entries(regionConfigs).forEach(([regionId, config]) => {
    saveRegionConfig(regionId, config).catch(console.error);
  });
  
  return true;
};

/**
 * 获取存储统计信息（同步版本）
 * @returns {Object} 存储统计信息
 */
export const getStorageStatsSync = () => {
  const allConfigs = localCache;
  const regionIds = Object.keys(allConfigs);
  
  let totalPostalCodes = 0;
  let activeRegions = 0;
  const allAssignedFSAs = new Set();

  regionIds.forEach(regionId => {
    const config = allConfigs[regionId];
    if (config) {
      const postalCodes = config.postalCodes || [];
      totalPostalCodes += postalCodes.length;
      
      if (config.isActive) {
        activeRegions++;
      }
      
      // 提取并收集唯一的FSA
      postalCodes.forEach(code => {
        if (typeof code === 'string' && code.length >= 3) {
          const fsa = code.substring(0, 3).toUpperCase();
          allAssignedFSAs.add(fsa);
        }
      });
    }
  });

  return {
    regionCount: regionIds.length,
    activeRegions,
    totalFSAs: totalPostalCodes,  // 总邮编数
    assignedFSAs: allAssignedFSAs.size,  // 已分配的唯一FSA数量
    unassignedFSAs: 0 // 在统一架构中，所有FSA都分配给区域
  };
};

/**
 * 获取区域统计信息（同步版本）
 * @param {string} regionId - 区域ID
 * @returns {Object} 统计信息
 */
export const getRegionStatsSync = (regionId) => {
  const config = localCache[regionId];
  if (!config) {
    return {
      totalFSAs: 0,
      activeFSAs: 0,
      totalPostalCodes: 0,
      totalPrice: 0,
      activeWeightRanges: 0
    };
  }

  // 支持多种字段名（Supabase 和本地存储格式）
  const fsaCodes = config.fsaCodes || config.fsa_codes || [];
  const postalCodes = config.postalCodes || config.postal_codes || [];
  const weightRanges = config.weightRanges || config.weight_ranges || [];
  const activeWeightRanges = weightRanges.filter(range => range.isActive);
  const totalPrice = activeWeightRanges.reduce((sum, range) => sum + (range.price || 0), 0);

  // 优先使用 FSA 数据
  let totalFSAs = 0;
  if (fsaCodes.length > 0) {
    // 如果有 FSA 数据，直接使用
    totalFSAs = fsaCodes.length;
  } else if (postalCodes.length > 0) {
    // 如果只有邮编数据，从邮编提取 FSA
    const uniqueFSAs = new Set();
    postalCodes.forEach(code => {
      if (typeof code === 'string' && code.length >= 3) {
        const fsa = code.substring(0, 3).toUpperCase();
        uniqueFSAs.add(fsa);
      }
    });
    totalFSAs = uniqueFSAs.size;
  }

  const isActive = config.isActive || config.is_active;

  return {
    totalFSAs: totalFSAs,
    activeFSAs: isActive ? totalFSAs : 0,
    totalPostalCodes: postalCodes.length,
    totalPrice,
    activeWeightRanges: activeWeightRanges.length
  };
};

/**
 * 同步获取区域邮编（兼容函数）
 * @param {string} regionId - 区域ID
 * @returns {string[]} 邮编列表
 */
export const getRegionPostalCodesSync = (regionId) => {
  const config = getRegionConfigSync(regionId);
  // 优先返回 FSA 数据
  return config ? (config.fsaCodes || config.fsa_codes || config.postalCodes || config.postal_codes || []) : [];
};

/**
 * 同步设置区域邮编（兼容函数）
 * @param {string} regionId - 区域ID
 * @param {string[]} postalCodes - 邮编列表
 * @returns {boolean} 总是返回true
 */
export const setRegionPostalCodesSync = (regionId, postalCodes) => {
  if (!localCache[regionId]) {
    localCache[regionId] = {
      id: regionId,
      name: `区域${regionId}`,
      fsaCodes: [],
      postalCodes: []
    };
  }
  
  // 更新本地缓存 - 保存为 FSA 数据
  localCache[regionId].fsaCodes = [...postalCodes];
  localCache[regionId].fsa_codes = [...postalCodes]; // 兼容两种格式
  localCache[regionId].lastUpdated = new Date().toISOString();
  
  // 触发异步更新到 Supabase
  if (isSupabaseConfigured()) {
    regionService.updateRegionFSAs(regionId, postalCodes).catch(console.error);
  }
  
  return true;
};

/**
 * 添加邮编到区域（兼容函数）
 * @param {string} regionId - 区域ID
 * @param {string[]} newCodes - 要添加的邮编
 * @returns {boolean} 总是返回true
 */
export const addPostalCodesToRegionSync = (regionId, newCodes) => {
  const currentCodes = getRegionPostalCodesSync(regionId);
  const uniqueNewCodes = newCodes.filter(code => !currentCodes.includes(code));
  const updatedCodes = [...currentCodes, ...uniqueNewCodes];
  
  return setRegionPostalCodesSync(regionId, updatedCodes);
};

/**
 * 从区域移除邮编（兼容函数）
 * @param {string} regionId - 区域ID
 * @param {string[]} codesToRemove - 要移除的邮编
 * @returns {boolean} 总是返回true
 */
export const removePostalCodesFromRegionSync = (regionId, codesToRemove) => {
  const currentCodes = getRegionPostalCodesSync(regionId);
  const updatedCodes = currentCodes.filter(code => !codesToRemove.includes(code));
  
  return setRegionPostalCodesSync(regionId, updatedCodes);
};

/**
 * 获取所有FSA配置（兼容函数）
 * 注意：这是为了支持旧的FSA管理界面
 * @returns {Object} FSA配置对象
 */
export const getAllFSAConfigsSync = () => {
  const fsaConfigs = {};
  
  Object.values(localCache).forEach(region => {
    if (region && region.postalCodes) {
      region.postalCodes.forEach(code => {
        // 提取FSA代码（前3位）
        const fsa = code.substring(0, 3);
        if (!fsaConfigs[fsa]) {
          fsaConfigs[fsa] = {
            fsaCode: fsa,
            assignedRegion: region.id,
            postalCodes: []
          };
        }
        fsaConfigs[fsa].postalCodes.push(code);
      });
    }
  });
  
  return fsaConfigs;
};

// 导出初始化函数供应用启动时调用
export default {
  init: initCompatLayer,
  getAllRegionConfigs: getAllRegionConfigsSync,
  getAllRegionConfigsSync,
  getRegionConfig: getRegionConfigSync,
  getRegionConfigSync,
  saveRegionConfig: saveRegionConfigSync,
  saveRegionConfigSync,
  saveAllRegionConfigs: saveAllRegionConfigsSync,
  saveAllRegionConfigsSync,
  getRegionPostalCodes: getRegionPostalCodesSync,
  setRegionPostalCodes: setRegionPostalCodesSync,
  addPostalCodesToRegion: addPostalCodesToRegionSync,
  removePostalCodesFromRegion: removePostalCodesFromRegionSync,
  getStorageStats: getStorageStatsSync,
  getStorageStatsSync,
  getRegionStats: getRegionStatsSync,
  getRegionStatsSync,
  getAllFSAConfigs: getAllFSAConfigsSync
};