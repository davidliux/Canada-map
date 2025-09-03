/**
 * 统一数据存储架构
 * 替代原有的双重存储机制（fsa_configurations + region_X_postal_codes）
 * 使用单一的区域配置格式存储所有数据
 */

import storageService from '../services/storageService';

// 统一存储键名常量
export const UNIFIED_STORAGE_KEYS = {
  REGION_DATA: 'unified_region_data',
  GLOBAL_SETTINGS: 'unified_global_settings',
  BACKUP_PREFIX: 'unified_backup_'
};

// 默认重量区间配置
export const DEFAULT_WEIGHT_RANGES = [
  { id: 'range_1', min: 0, max: 11.000, label: '0-11.000 KGS', price: 0, isActive: true },
  { id: 'range_2', min: 11.001, max: 15.000, label: '11.001-15.000 KGS', price: 0, isActive: true },
  { id: 'range_3', min: 15.001, max: 20.000, label: '15.001-20.000 KGS', price: 0, isActive: true },
  { id: 'range_4', min: 20.001, max: 25.000, label: '20.001-25.000 KGS', price: 0, isActive: true },
  { id: 'range_5', min: 25.001, max: 30.000, label: '25.001-30.000 KGS', price: 0, isActive: true },
  { id: 'range_6', min: 30.001, max: 35.000, label: '30.001-35.000 KGS', price: 0, isActive: true },
  { id: 'range_7', min: 35.001, max: 40.000, label: '35.001-40.000 KGS', price: 0, isActive: true },
  { id: 'range_8', min: 40.001, max: 45.000, label: '40.001-45.000 KGS', price: 0, isActive: true },
  { id: 'range_9', min: 45.001, max: 50.000, label: '45.001-50.000 KGS', price: 0, isActive: true },
  { id: 'range_10', min: 50.001, max: 55.000, label: '50.001-55.000 KGS', price: 0, isActive: true },
  { id: 'range_11', min: 55.001, max: 60.000, label: '55.001-60.000 KGS', price: 0, isActive: true },
  { id: 'range_12', min: 60.001, max: 64.000, label: '60.001-64.000 KGS', price: 0, isActive: true },
  { id: 'range_13', min: 64.001, max: Infinity, label: '64.000+ KGS', price: 0, isActive: true }
];

/**
 * 统一区域配置数据结构
 * @typedef {Object} UnifiedRegionConfig
 * @property {string} id - 区域ID (如 '1', '2', ...)
 * @property {string} name - 区域名称
 * @property {boolean} isActive - 是否启用
 * @property {string[]} fsaCodes - FSA代码列表（如 ["M5V", "M5G"]）
 * @property {Object[]} weightRanges - 重量区间价格配置
 * @property {string} lastUpdated - 最后更新时间
 * @property {Object} metadata - 元数据
 */

/**
 * 创建默认区域配置
 * @param {string} regionId - 区域ID
 * @param {string} regionName - 区域名称
 * @returns {UnifiedRegionConfig}
 */
export const createDefaultRegionConfig = (regionId, regionName = `区域${regionId}`) => {
  return {
    id: regionId,
    name: regionName,
    isActive: false,
    fsaCodes: [],
    weightRanges: [...DEFAULT_WEIGHT_RANGES],
    lastUpdated: new Date().toISOString(),
    metadata: {
      createdAt: new Date().toISOString(),
      version: '2.0.0',
      notes: '',
      totalFSAs: 0
    }
  };
};

/**
 * 初始化默认的8个区域配置
 * @returns {Object} 区域配置对象
 */
export const initializeDefaultRegions = () => {
  const regions = {};
  for (let i = 1; i <= 8; i++) {
    regions[i.toString()] = createDefaultRegionConfig(i.toString());
  }
  return regions;
};

/**
 * 获取所有区域配置
 * @param {boolean} forceRefresh - 强制从服务器刷新
 * @returns {Promise<Object>} 区域配置对象，键为区域ID
 */
export const getAllRegionConfigs = async (forceRefresh = false) => {
  try {
    // 使用存储服务获取数据（自动处理缓存和API调用）
    const regions = await storageService.getAllRegions(forceRefresh);
    return regions;
  } catch (error) {
    console.error('获取区域配置失败:', error);
    // 如果API失败，尝试从localStorage获取
    try {
      const stored = localStorage.getItem(UNIFIED_STORAGE_KEYS.REGION_DATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (localError) {
      console.error('本地存储也失败:', localError);
    }
    // 返回默认配置
    return initializeDefaultRegions();
  }
};

/**
 * 获取单个区域配置
 * @param {string} regionId - 区域ID
 * @returns {Promise<UnifiedRegionConfig|null>}
 */
export const getRegionConfig = async (regionId) => {
  try {
    const region = await storageService.getRegion(regionId);
    return region;
  } catch (error) {
    console.error(`获取区域 ${regionId} 配置失败:`, error);
    return null;
  }
};

/**
 * 保存单个区域配置
 * @param {string} regionId - 区域ID
 * @param {UnifiedRegionConfig} config - 区域配置
 * @returns {Promise<boolean>} 保存是否成功
 */
export const saveRegionConfig = async (regionId, config) => {
  try {
    // 验证配置
    const validation = validateRegionConfig(config);
    if (!validation.isValid) {
      console.error('区域配置验证失败:', validation.errors);
      return false;
    }

    // 使用存储服务更新区域（自动处理本地缓存和API同步）
    await storageService.updateRegion(regionId, config);
    
    console.log(`区域 ${regionId} 配置保存成功`);
    return true;
  } catch (error) {
    console.error('保存区域配置失败:', error);
    return false;
  }
};

/**
 * 保存所有区域配置
 * @param {Object} regionConfigs - 区域配置对象集合
 * @returns {boolean} 保存是否成功
 */
export const saveAllRegionConfigs = (regionConfigs) => {
  try {
    localStorage.setItem(UNIFIED_STORAGE_KEYS.REGION_DATA, JSON.stringify(regionConfigs));
    console.log('区域配置保存成功:', regionConfigs);
    return true;
  } catch (error) {
    console.error('保存区域配置失败:', error);
    return false;
  }
};

/**
 * 删除区域配置
 * @param {string} regionId - 区域ID
 * @returns {boolean} 删除是否成功
 */
export const deleteRegionConfig = (regionId) => {
  try {
    const regionConfigs = getAllRegionConfigs();
    if (regionConfigs && regionConfigs[regionId]) {
      delete regionConfigs[regionId];
      const success = saveAllRegionConfigs(regionConfigs);
      if (success) {
        console.log('区域配置删除成功:', regionId);
        // 触发数据更新通知
        import('./dataUpdateNotifier').then(module => {
          module.notifyRegionUpdate(regionId, 'delete');
        });
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('删除区域配置失败:', error);
    return false;
  }
};

/**
 * 获取区域的FSA列表
 * @param {string} regionId - 区域ID
 * @returns {Promise<string[]>} FSA列表
 */
export const getRegionFSAs = async (regionId) => {
  try {
    const config = await getRegionConfig(regionId);
    return config ? config.fsaCodes || [] : [];
  } catch (error) {
    console.error(`获取区域 ${regionId} FSA失败:`, error);
    return [];
  }
};

// 保留旧名称以保持向后兼容
export const getRegionPostalCodes = getRegionFSAs;

/**
 * 设置区域的FSA列表
 * @param {string} regionId - 区域ID
 * @param {string[]} fsaCodes - FSA列表
 * @returns {Promise<boolean>} 保存是否成功
 */
export const setRegionFSAs = async (regionId, fsaCodes) => {
  try {
    // 使用存储服务更新FSA
    await storageService.updateRegionFSAs(regionId, fsaCodes);
    console.log(`区域 ${regionId} FSA更新成功:`, fsaCodes.length, '个FSA');
    return true;
  } catch (error) {
    console.error(`设置区域 ${regionId} FSA失败:`, error);
    return false;
  }
};

// 保留旧名称以保持向后兼容
export const setRegionPostalCodes = setRegionFSAs;

/**
 * 验证区域配置
 * @param {UnifiedRegionConfig} config - 区域配置
 * @returns {Object} 验证结果
 */
export const validateRegionConfig = (config) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!config.id || typeof config.id !== 'string') {
    errors.push('区域ID是必填项');
  }

  if (!config.name || typeof config.name !== 'string') {
    errors.push('区域名称是必填项');
  }

  if (!Array.isArray(config.postalCodes)) {
    errors.push('邮编列表必须是数组');
  }

  if (!Array.isArray(config.weightRanges)) {
    errors.push('重量区间配置必须是数组');
  }

  // 邮编格式验证
  if (config.postalCodes) {
    config.postalCodes.forEach((code, index) => {
      if (typeof code !== 'string' || code.trim() === '') {
        warnings.push(`邮编列表第${index + 1}项格式无效`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 获取区域统计信息
 * @param {string} regionId - 区域ID
 * @returns {Object} 统计信息
 */
export const getRegionStats = (regionId) => {
  const config = getRegionConfig(regionId);
  if (!config) {
    return {
      totalFSAs: 0,
      activeFSAs: 0,
      totalFSAs: 0,
      totalPrice: 0,
      activeWeightRanges: 0
    };
  }

  const postalCodes = config.postalCodes || [];
  const weightRanges = config.weightRanges || [];
  const activeWeightRanges = weightRanges.filter(range => range.isActive);
  const totalPrice = activeWeightRanges.reduce((sum, range) => sum + (range.price || 0), 0);

  // 计算唯一的FSA数量（邮编前3个字符）
  const uniqueFSAs = new Set();
  postalCodes.forEach(code => {
    if (typeof code === 'string' && code.length >= 3) {
      // 提取FSA（前3个字符）
      const fsa = code.substring(0, 3).toUpperCase();
      uniqueFSAs.add(fsa);
    }
  });

  return {
    totalFSAs: uniqueFSAs.size,
    activeFSAs: config.isActive ? uniqueFSAs.size : 0,
    totalPostalCodes: postalCodes.length,
    totalPrice,
    activeWeightRanges: activeWeightRanges.length
  };
};

/**
 * 获取所有区域的存储统计信息
 * @returns {Object} 存储统计信息
 */
export const getStorageStats = () => {
  const allConfigs = getAllRegionConfigs();
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
 * 计算指定重量的配送价格
 * @param {string} regionId - 区域ID
 * @param {number} weight - 重量 (KGS)
 * @returns {number|null} 价格或null（如果没有匹配的区间）
 */
export const calculateShippingPrice = (regionId, weight) => {
  const config = getRegionConfig(regionId);
  if (!config || !config.weightRanges) {
    return null;
  }

  const activeRanges = config.weightRanges.filter(range => range.isActive);
  
  for (const range of activeRanges) {
    if (weight >= range.min && weight <= range.max) {
      return range.price;
    }
  }
  
  return null;
};
