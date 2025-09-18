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
 * FSA组配置数据结构
 * @typedef {Object} FSAGroup
 * @property {string} id - 组ID (UUID)
 * @property {string} name - 组名称 (1-50字符)
 * @property {string[]} fsaCodes - FSA代码列表
 * @property {Object} customPricing - 自定义价格配置（可选）
 * @property {boolean} customPricing.enabled - 是否启用自定义价格
 * @property {Object[]} customPricing.weightRanges - 重量区间价格配置
 * @property {string} displayColor - 显示颜色（从区域主题派生）
 * @property {Object} metadata - 元数据
 * @property {string} metadata.createdAt - 创建时间
 * @property {string} metadata.updatedAt - 更新时间
 */

/**
 * 统一区域配置数据结构
 * @typedef {Object} UnifiedRegionConfig
 * @property {string} id - 区域ID (如 '1', '2', ...)
 * @property {string} name - 区域名称
 * @property {boolean} isActive - 是否启用
 * @property {string[]} fsaCodes - FSA代码列表（如 ["M5V", "M5G"]）
 * @property {Object[]} weightRanges - 重量区间价格配置
 * @property {FSAGroup[]} fsaGroups - FSA组列表（可选）
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
    postalCodes: [],  // 添加postalCodes字段，确保验证通过
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
    // 检查是否是卡车配送区域ID（UUID格式）
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(regionId);

    if (isUUID) {
      try {
        // 对于卡车配送区域，尝试从API获取
        const { apiGet } = await import('./apiClient');
        const zone = await apiGet(`/truck-delivery/zones/${regionId}`);

        // 转换为统一的区域配置格式
        if (zone) {
          // 转换fsa_groups格式（从snake_case到camelCase）
          const fsaGroups = (zone.fsa_groups || []).map(group => ({
            id: group.id,
            name: group.name,
            fsaCodes: group.fsa_codes || [],
            customPricing: group.custom_pricing || null,
            displayColor: group.display_color || null
          }));

          // 优先使用zone直接的fsa_codes字段，如果不存在或为空，则从分组计算
          let regionFSAs = [];

          // 方法1：使用后端计算的FSA数据（最准确）
          if (zone.calculated_fsa_codes && Array.isArray(zone.calculated_fsa_codes) && zone.calculated_fsa_codes.length > 0) {
            regionFSAs = zone.calculated_fsa_codes;
            console.log(`📊 区域 ${regionId} 使用后端计算FSA数据: ${regionFSAs.length} 个FSA`);
          }
          // 方法2：直接使用zone的fsa_codes字段
          else if (zone.fsa_codes && Array.isArray(zone.fsa_codes) && zone.fsa_codes.length > 0) {
            regionFSAs = zone.fsa_codes;
            console.log(`📊 区域 ${regionId} 使用直接FSA数据: ${regionFSAs.length} 个FSA`);
          }
          // 方法3：从fsa_groups计算
          else if (fsaGroups && fsaGroups.length > 0) {
            regionFSAs = calculateRegionFSAsFromGroups(fsaGroups);
            if (regionFSAs.length > 0) {
              console.log(`📊 区域 ${regionId} 从分组计算FSA: ${regionFSAs.length} 个FSA`);
            } else {
              console.warn(`⚠️ 区域 ${regionId} 的分组没有FSA数据`);
            }
          }
          // 方法4：如果都没有数据，记录警告
          else {
            console.warn(`⚠️ 区域 ${regionId} 没有可用的FSA数据（既无直接数据也无分组数据）`);
          }

          const regionConfig = {
            id: zone.id,
            name: zone.name,
            fsaCodes: regionFSAs, // 使用处理后的FSA列表
            postalCodes: regionFSAs, // 兼容旧字段
            fsaGroups: fsaGroups,
            weightRanges: zone.weight_ranges || [],
            customPricing: zone.custom_pricing || null,
            level: zone.level,
            cityId: zone.city_id,
            displayColor: zone.color || zone.display_color
          };

          // 缓存成功的数据，供离线使用
          try {
            const cacheKey = `region_cache_${regionId}`;
            localStorage.setItem(cacheKey, JSON.stringify(regionConfig));
          } catch (e) {
            console.warn('缓存区域数据失败:', e);
          }

          return regionConfig;
        }
      } catch (apiError) {
        // API失败时，尝试从本地存储获取或创建默认配置
        console.warn(`⚠️ API获取区域 ${regionId} 失败，使用本地备用方案:`, apiError.message);

        // 尝试从localStorage获取缓存的数据
        const cacheKey = `region_cache_${regionId}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
          try {
            const cached = JSON.parse(cachedData);
            console.log(`📦 使用缓存的区域数据: ${cached.fsaCodes?.length || 0} 个FSA`);
            return cached;
          } catch (e) {
            console.warn('缓存数据解析失败:', e);
          }
        }

        // 尝试从storageService获取本地存储的数据
        try {
          const localRegion = await storageService.getRegion(regionId);
          if (localRegion && localRegion.fsaCodes) {
            console.log(`📦 使用本地存储的区域数据: ${localRegion.fsaCodes.length} 个FSA`);
            return localRegion;
          }
        } catch (e) {
          console.warn('本地存储获取失败:', e);
        }

        // 返回空的默认配置，但标记为需要同步
        console.error(`❌ 区域 ${regionId} 无法获取任何数据，返回默认配置`);
        return {
          id: regionId,
          name: `区域 ${regionId}（数据待同步）`,
          fsaCodes: [],
          postalCodes: [],
          fsaGroups: [],
          weightRanges: [],
          customPricing: null,
          level: 1,
          cityId: null,
          displayColor: '#999999',
          needsSync: true // 标记需要同步
        };
      }
      return null;
    } else {
      // 对于旧的区域配置，使用原有逻辑
      const region = await storageService.getRegion(regionId);
      return region;
    }
  } catch (error) {
    console.error(`获取区域 ${regionId} 配置失败:`, error);
    return null;
  }
};

/**
 * 更新区域配置
 * @param {string} regionId - 区域ID
 * @param {UnifiedRegionConfig} config - 区域配置
 * @returns {Promise<boolean>} 更新是否成功
 */
export const updateRegionConfig = async (regionId, config) => {
  return await saveRegionConfig(regionId, config);
};

/**
 * 保存单个区域配置
 * @param {string} regionId - 区域ID
 * @param {UnifiedRegionConfig} config - 区域配置
 * @returns {Promise<boolean>} 保存是否成功
 */
export const saveRegionConfig = async (regionId, config) => {
  try {
    // 确保数据格式正确（兼容处理）
    if (config.fsaCodes && !config.postalCodes) {
      config.postalCodes = config.fsaCodes;
    }

    // 验证配置
    const validation = validateRegionConfig(config);
    if (!validation.isValid) {
      console.error('区域配置验证失败:', validation.errors);
      return false;
    }

    // 检查是否是卡车配送区域ID（UUID格式）
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(regionId);

    if (isUUID) {
      // 对于卡车配送区域，使用专门的API
      const { apiPut } = await import('./apiClient');

      // 从分组自动计算FSA列表
      const calculatedFSAs = calculateRegionFSAsFromGroups(config.fsaGroups || []);

      // 转换为API格式
      const zoneData = {
        name: config.name,
        fsa_codes: calculatedFSAs, // 使用从分组计算的FSA列表
        fsa_groups: config.fsaGroups || [],
        // weight_ranges 字段在数据库中不存在，不发送
        // custom_pricing 字段在数据库中不存在，不发送
        level: config.level,
        display_color: config.displayColor  // 使用正确的字段名
      };

      await apiPut(`/truck-delivery/zones/${regionId}`, zoneData);
      console.log(`卡车配送区域 ${regionId} 配置已保存到数据库`);
    } else {
      // 对于旧的区域配置，使用原有逻辑
      await storageService.updateRegion(regionId, config);
      console.log(`区域 ${regionId} 配置已保存到数据库`);
    }

    return true;
  } catch (error) {
    console.error('保存区域配置到数据库失败:', error);
    return false;
  }
};

/**
 * 保存所有区域配置到数据库
 * @param {Object} regionConfigs - 区域配置对象集合
 * @returns {Promise<boolean>} 保存是否成功
 */
export const saveAllRegionConfigs = async (regionConfigs) => {
  try {
    // 批量更新到数据库
    for (const [regionId, config] of Object.entries(regionConfigs)) {
      await storageService.updateRegion(regionId, config);
    }
    console.log('所有区域配置已保存到数据库:', Object.keys(regionConfigs).length, '个区域');
    return true;
  } catch (error) {
    console.error('保存区域配置到数据库失败:', error);
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
    console.log(`🔍 开始获取区域 ${regionId} 的FSA数据...`);
    const config = await getRegionConfig(regionId);

    if (!config) {
      console.warn(`⚠️ 区域 ${regionId} 配置为空`);
      return [];
    }

    const fsaCodes = config.fsaCodes || [];
    console.log(`✅ 区域 ${regionId} FSA数据: ${fsaCodes.length} 个FSA`,
      fsaCodes.length > 0 ? `前5个: ${fsaCodes.slice(0, 5).join(', ')}...` : '');

    return fsaCodes;
  } catch (error) {
    console.error(`❌ 获取区域 ${regionId} FSA失败:`, error);
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
    // 直接更新到数据库
    await storageService.updateRegionFSAs(regionId, fsaCodes);
    console.log(`区域 ${regionId} FSA已保存到数据库:`, fsaCodes.length, '个FSA');
    return true;
  } catch (error) {
    console.error(`保存区域 ${regionId} FSA到数据库失败:`, error);
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

  // 兼容postalCodes和fsaCodes两种字段名
  if (!Array.isArray(config.postalCodes) && !Array.isArray(config.fsaCodes)) {
    errors.push('邮编列表必须是数组');
  }

  if (!Array.isArray(config.weightRanges)) {
    errors.push('重量区间配置必须是数组');
  }

  // 邮编格式验证（同时检查两种字段）
  const codes = config.postalCodes || config.fsaCodes;
  if (codes && Array.isArray(codes)) {
    codes.forEach((code, index) => {
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

// ============ FSA组管理功能 ============

/**
 * 生成UUID
 * @returns {string} UUID
 */
const generateUUID = () => {
  return 'group-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

/**
 * 生成组的显示颜色（基于区域主题色的变体）
 * @param {string} baseColor - 基础颜色
 * @param {number} index - 组索引
 * @returns {string} 显示颜色
 */
const generateGroupColor = (baseColor = '#4F46E5', index = 0) => {
  // 简单的颜色变体生成逻辑
  const colors = [
    '#6366F1', // indigo-500
    '#7C3AED', // violet-600
    '#8B5CF6', // violet-500
    '#A78BFA', // violet-400
    '#C084FC', // purple-400
    '#D8B4FE', // purple-300
  ];
  return colors[index % colors.length];
};

/**
 * 从分组自动计算区域的FSA列表
 * @param {Array} fsaGroups - FSA分组列表
 * @returns {Array} 所有分组中的FSA去重后的列表
 */
export const calculateRegionFSAsFromGroups = (fsaGroups = []) => {
  const allFSAs = new Set();
  fsaGroups.forEach(group => {
    if (group.fsaCodes && Array.isArray(group.fsaCodes)) {
      group.fsaCodes.forEach(fsa => allFSAs.add(fsa));
    }
  });
  return Array.from(allFSAs).sort();
};

/**
 * 创建新的FSA组
 * @param {string} regionId - 区域ID
 * @param {Object} groupData - 组数据
 * @param {string} groupData.name - 组名称
 * @param {string[]} groupData.fsaCodes - FSA代码列表
 * @returns {Promise<FSAGroup|null>} 创建的组或null
 */
export const createFSAGroup = async (regionId, groupData) => {
  try {
    let config = await getRegionConfig(regionId);
    if (!config) {
      // 如果区域不存在，创建一个新的区域配置
      console.log(`区域 ${regionId} 不存在，创建新区域配置`);
      config = {
        id: regionId,
        name: `区域 ${regionId}`,
        fsaCodes: [],
        postalCodes: [],
        fsaGroups: [],
        weightRanges: [],
        customPricing: null,
        isActive: true
      };
      // 保存新创建的区域配置
      await updateRegionConfig(regionId, config);
    }

    // 初始化fsaGroups数组（如果不存在）
    if (!config.fsaGroups) {
      config.fsaGroups = [];
    }

    // 确保每个现有组的fsaCodes字段是数组
    config.fsaGroups = config.fsaGroups.map(g => ({
      ...g,
      fsaCodes: Array.isArray(g.fsaCodes) ? g.fsaCodes : []
    }));

    // 验证组名称唯一性
    const nameExists = config.fsaGroups.some(g => g.name === groupData.name);
    if (nameExists) {
      console.error(`组名称 "${groupData.name}" 已存在`);
      return null;
    }

    console.log(`创建FSA分组：${groupData.name}，包含 ${groupData.fsaCodes.length} 个FSA`);

    // 检查FSA是否已在其他组中
    const conflictingFSAs = [];
    if (Array.isArray(groupData.fsaCodes)) {
      groupData.fsaCodes.forEach(fsa => {
        const existingGroup = config.fsaGroups.find(g =>
          Array.isArray(g.fsaCodes) && g.fsaCodes.includes(fsa)
        );
        if (existingGroup) {
          conflictingFSAs.push({ fsa, groupName: existingGroup.name });
        }
      });
    }
    if (conflictingFSAs.length > 0) {
      console.error('FSA冲突:', conflictingFSAs);
      return null;
    }

    // 创建新组
    const newGroup = {
      id: generateUUID(),
      name: groupData.name,
      fsaCodes: groupData.fsaCodes || [],
      customPricing: {
        enabled: false,
        weightRanges: [...DEFAULT_WEIGHT_RANGES]
      },
      displayColor: generateGroupColor('#4F46E5', config.fsaGroups.length),
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };

    // 添加到配置
    config.fsaGroups.push(newGroup);

    // 自动更新区域的FSA列表（从所有分组汇总）
    config.fsaCodes = calculateRegionFSAsFromGroups(config.fsaGroups);
    config.lastUpdated = new Date().toISOString();

    // 保存配置
    const success = await saveRegionConfig(regionId, config);
    if (success) {
      // 触发更新通知
      import('./dataUpdateNotifier').then(module => {
        module.notifyRegionUpdate(regionId, 'groupCreate', {
          group: newGroup,
          regionFSAs: config.fsaCodes
        });
      });
      return newGroup;
    }

    return null;
  } catch (error) {
    console.error('创建FSA组失败:', error);
    return null;
  }
};

/**
 * 更新FSA组
 * @param {string} regionId - 区域ID
 * @param {string} groupId - 组ID
 * @param {Object} updates - 更新内容
 * @returns {Promise<boolean>} 是否成功
 */
export const updateFSAGroup = async (regionId, groupId, updates) => {
  try {
    const config = await getRegionConfig(regionId);
    if (!config || !config.fsaGroups) {
      console.error(`区域 ${regionId} 或FSA组不存在`);
      return false;
    }

    const groupIndex = config.fsaGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      console.error(`组 ${groupId} 不存在`);
      return false;
    }

    const group = config.fsaGroups[groupIndex];

    // 如果更新名称，检查唯一性
    if (updates.name && updates.name !== group.name) {
      const nameExists = config.fsaGroups.some(g => g.id !== groupId && g.name === updates.name);
      if (nameExists) {
        console.error(`组名称 "${updates.name}" 已存在`);
        return false;
      }
    }

    // 如果更新FSA列表，验证冲突
    if (updates.fsaCodes) {
      // 不再验证FSA是否属于区域，因为区域FSA是从分组汇总的
      // 只检查与其他组的冲突
      const conflictingFSAs = [];
      updates.fsaCodes.forEach(fsa => {
        const existingGroup = config.fsaGroups.find(g => g.id !== groupId && g.fsaCodes.includes(fsa));
        if (existingGroup) {
          conflictingFSAs.push({ fsa, groupName: existingGroup.name });
        }
      });
      if (conflictingFSAs.length > 0) {
        console.error('FSA冲突:', conflictingFSAs);
        return false;
      }
    }

    // 应用更新
    config.fsaGroups[groupIndex] = {
      ...group,
      ...updates,
      metadata: {
        ...group.metadata,
        updatedAt: new Date().toISOString()
      }
    };

    // 自动更新区域的FSA列表（从所有分组汇总）
    config.fsaCodes = calculateRegionFSAsFromGroups(config.fsaGroups);
    config.lastUpdated = new Date().toISOString();

    // 保存配置
    const success = await saveRegionConfig(regionId, config);
    if (success) {
      // 触发更新通知
      import('./dataUpdateNotifier').then(module => {
        module.notifyRegionUpdate(regionId, 'groupUpdate', {
          groupId,
          updates,
          group: config.fsaGroups[groupIndex],
          regionFSAs: config.fsaCodes
        });
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('更新FSA组失败:', error);
    return false;
  }
};

/**
 * 删除FSA组
 * @param {string} regionId - 区域ID
 * @param {string} groupId - 组ID
 * @returns {Promise<boolean>} 是否成功
 */
export const deleteFSAGroup = async (regionId, groupId) => {
  try {
    const config = await getRegionConfig(regionId);
    if (!config || !config.fsaGroups) {
      console.error(`区域 ${regionId} 或FSA组不存在`);
      return false;
    }

    const groupIndex = config.fsaGroups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      console.error(`组 ${groupId} 不存在`);
      return false;
    }

    const deletedGroup = config.fsaGroups[groupIndex];

    // 移除组
    config.fsaGroups.splice(groupIndex, 1);

    // 自动更新区域的FSA列表（从所有分组汇总）
    config.fsaCodes = calculateRegionFSAsFromGroups(config.fsaGroups);
    config.lastUpdated = new Date().toISOString();

    // 保存配置
    const success = await saveRegionConfig(regionId, config);
    if (success) {
      // 触发更新通知
      import('./dataUpdateNotifier').then(module => {
        module.notifyRegionUpdate(regionId, 'groupDelete', {
          groupId,
          deletedGroup,
          regionFSAs: config.fsaCodes
        });
      });
      return true;
    }

    return false;
  } catch (error) {
    console.error('删除FSA组失败:', error);
    return false;
  }
};

/**
 * 获取区域的所有FSA组
 * @param {string} regionId - 区域ID
 * @returns {Promise<FSAGroup[]>} FSA组列表
 */
export const getRegionFSAGroups = async (regionId) => {
  try {
    const config = await getRegionConfig(regionId);
    const groups = config?.fsaGroups || [];

    // 确保每个组的fsaCodes字段是数组
    return groups.map(g => ({
      ...g,
      fsaCodes: Array.isArray(g.fsaCodes) ? g.fsaCodes : []
    }));
  } catch (error) {
    console.error(`获取区域 ${regionId} FSA组失败:`, error);
    return [];
  }
};

/**
 * 获取FSA所属的组
 * @param {string} regionId - 区域ID
 * @param {string} fsaCode - FSA代码
 * @returns {Promise<FSAGroup|null>} FSA所属的组或null
 */
export const getFSAGroup = async (regionId, fsaCode) => {
  try {
    const groups = await getRegionFSAGroups(regionId);
    return groups.find(g => g.fsaCodes.includes(fsaCode)) || null;
  } catch (error) {
    console.error(`获取FSA ${fsaCode} 所属组失败:`, error);
    return null;
  }
};

/**
 * 更新FSA组的自定义价格配置
 * @param {string} regionId - 区域ID
 * @param {string} groupId - 组ID
 * @param {Object} pricingConfig - 价格配置
 * @returns {Promise<boolean>} 是否成功
 */
export const updateGroupPricing = async (regionId, groupId, pricingConfig) => {
  try {
    return await updateFSAGroup(regionId, groupId, {
      customPricing: pricingConfig
    });
  } catch (error) {
    console.error('更新组价格配置失败:', error);
    return false;
  }
};

/**
 * 验证FSA组配置
 * @param {FSAGroup} group - 组配置
 * @param {UnifiedRegionConfig} regionConfig - 区域配置
 * @returns {Object} 验证结果
 */
export const validateFSAGroup = (group, regionConfig) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!group.id) {
    errors.push('组ID是必填项');
  }

  if (!group.name || typeof group.name !== 'string') {
    errors.push('组名称是必填项');
  } else if (group.name.length < 1 || group.name.length > 50) {
    errors.push('组名称长度必须在1-50字符之间');
  }

  // FSA代码验证
  if (!Array.isArray(group.fsaCodes)) {
    errors.push('FSA代码列表必须是数组');
  } else {
    // 检查FSA是否属于区域
    const invalidFSAs = group.fsaCodes.filter(fsa => !regionConfig.fsaCodes.includes(fsa));
    if (invalidFSAs.length > 0) {
      errors.push(`以下FSA不属于该区域: ${invalidFSAs.join(', ')}`);
    }
  }

  // 价格配置验证
  if (group.customPricing && group.customPricing.enabled) {
    if (!Array.isArray(group.customPricing.weightRanges)) {
      errors.push('启用自定义价格时必须提供重量区间配置');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};
