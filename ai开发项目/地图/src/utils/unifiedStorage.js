/**
 * 统一数据存储架构
 * 替代原有的双重存储机制（fsa_configurations + region_X_postal_codes）
 * 使用单一的区域配置格式存储所有数据
 */

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
 * @property {string[]} postalCodes - 邮编列表（包含FSA代码和具体邮编）
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
    postalCodes: [],
    weightRanges: [...DEFAULT_WEIGHT_RANGES],
    lastUpdated: new Date().toISOString(),
    metadata: {
      createdAt: new Date().toISOString(),
      version: '2.0.0',
      notes: '',
      totalPostalCodes: 0
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
 * @returns {Object} 区域配置对象，键为区域ID
 */
export const getAllRegionConfigs = () => {
  try {
    const stored = localStorage.getItem(UNIFIED_STORAGE_KEYS.REGION_DATA);
    if (stored) {
      return JSON.parse(stored);
    } else {
      // 如果没有数据，初始化默认配置
      const defaultRegions = initializeDefaultRegions();
      saveAllRegionConfigs(defaultRegions);
      return defaultRegions;
    }
  } catch (error) {
    console.error('读取区域配置失败:', error);
    return initializeDefaultRegions();
  }
};

/**
 * 获取单个区域配置
 * @param {string} regionId - 区域ID
 * @returns {UnifiedRegionConfig|null}
 */
export const getRegionConfig = (regionId) => {
  const allConfigs = getAllRegionConfigs();
  return allConfigs[regionId] || null;
};

/**
 * 保存单个区域配置
 * @param {string} regionId - 区域ID
 * @param {UnifiedRegionConfig} config - 区域配置
 * @returns {boolean} 保存是否成功
 */
export const saveRegionConfig = (regionId, config) => {
  try {
    // 验证配置
    const validation = validateRegionConfig(config);
    if (!validation.isValid) {
      console.error('区域配置验证失败:', validation.errors);
      return false;
    }

    // 更新元数据
    const updatedConfig = {
      ...config,
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...config.metadata,
        totalPostalCodes: config.postalCodes ? config.postalCodes.length : 0
      }
    };

    // 获取所有配置并更新
    const allConfigs = getAllRegionConfigs();
    allConfigs[regionId] = updatedConfig;

    return saveAllRegionConfigs(allConfigs);
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
 * 获取区域的邮编列表
 * @param {string} regionId - 区域ID
 * @returns {string[]} 邮编列表
 */
export const getRegionPostalCodes = (regionId) => {
  const config = getRegionConfig(regionId);
  return config ? config.postalCodes || [] : [];
};

/**
 * 设置区域的邮编列表
 * @param {string} regionId - 区域ID
 * @param {string[]} postalCodes - 邮编列表
 * @returns {boolean} 保存是否成功
 */
export const setRegionPostalCodes = (regionId, postalCodes) => {
  const config = getRegionConfig(regionId);
  if (!config) {
    console.error(`区域 ${regionId} 不存在`);
    return false;
  }

  const updatedConfig = {
    ...config,
    postalCodes: [...postalCodes] // 创建副本避免引用问题
  };

  return saveRegionConfig(regionId, updatedConfig);
};

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
      totalPostalCodes: 0,
      totalPrice: 0,
      activeWeightRanges: 0
    };
  }

  const postalCodes = config.postalCodes || [];
  const weightRanges = config.weightRanges || [];
  const activeWeightRanges = weightRanges.filter(range => range.isActive);
  const totalPrice = activeWeightRanges.reduce((sum, range) => sum + (range.price || 0), 0);

  return {
    totalFSAs: postalCodes.length,
    activeFSAs: config.isActive ? postalCodes.length : 0,
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
  let assignedFSAs = 0;

  regionIds.forEach(regionId => {
    const config = allConfigs[regionId];
    if (config) {
      totalPostalCodes += config.postalCodes ? config.postalCodes.length : 0;
      if (config.isActive) {
        activeRegions++;
      }
      if (config.postalCodes && config.postalCodes.length > 0) {
        assignedFSAs += config.postalCodes.length;
      }
    }
  });

  return {
    regionCount: regionIds.length,
    activeRegions,
    totalFSAs: totalPostalCodes,
    assignedFSAs,
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
