/**
 * 统一数据存储架构
 * 替代原有的双重存储机制（fsa_configurations + region_X_postal_codes）
 * 使用单一的区域配置格式存储所有数据
 * 优先使用 Supabase，降级到 localStorage
 */

import storageService from '../services/storageService';
import { regionService, isSupabaseConfigured } from '../services/supabaseClient';

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
    // 只使用 Supabase，不再回退到本地存储
    if (isSupabaseConfigured()) {
      console.log('🌐 从 Supabase 加载数据...');
      const supabaseRegions = await regionService.getAllRegions();
      if (supabaseRegions && Object.keys(supabaseRegions).length > 0) {
        console.log('✅ 成功从 Supabase 加载', Object.keys(supabaseRegions).length, '个区域');
        return supabaseRegions;
      } else {
        // 数据库没有任何区域数据，这应该是首次使用
        // 注意：不要自动创建空区域，保持数据库现有数据
        console.log('⚠️ 数据库中暂无区域数据');
        // 返回空对象而不是创建默认区域
        return {};
      }
    } else {
      console.error('❌ Supabase 未配置');
      return {};
    }
  } catch (error) {
    console.error('获取区域配置失败:', error);
    // 返回空对象而不是默认配置
    return {};
  }
};

/**
 * 获取单个区域配置
 * @param {string} regionId - 区域ID
 * @returns {Promise<UnifiedRegionConfig|null>}
 */
export const getRegionConfig = async (regionId) => {
  try {
    // 只从 Supabase 获取
    if (isSupabaseConfigured()) {
      const region = await regionService.getRegion(regionId);
      return region;
    } else {
      console.error('❌ Supabase 未配置');
      return null;
    }
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

    // 只使用 Supabase，不再保存到本地
    if (isSupabaseConfigured()) {
      console.log('💾 保存到 Supabase...');
      const saved = await regionService.upsertRegion({
        ...config,
        id: regionId
      });
      if (saved) {
        console.log(`✅ 区域 ${regionId} 已保存到数据库`);
        return true;
      } else {
        console.error(`❌ 区域 ${regionId} 保存失败`);
        return false;
      }
    } else {
      console.error('❌ Supabase 未配置，无法保存');
      return false;
    }
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
export const saveAllRegionConfigs = async (regionConfigs) => {
  try {
    // 只保存到 Supabase
    if (isSupabaseConfigured()) {
      console.log('💾 批量保存到 Supabase...');
      for (const [id, config] of Object.entries(regionConfigs)) {
        await regionService.upsertRegion({
          ...config,
          id
        });
      }
      console.log('✅ 所有区域配置已保存到数据库');
      return true;
    } else {
      console.error('❌ Supabase 未配置，无法保存');
      return false;
    }
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
export const deleteRegionConfig = async (regionId) => {
  try {
    // 只从 Supabase 删除
    if (isSupabaseConfigured()) {
      const success = await regionService.deleteRegion(regionId);
      if (success) {
        console.log('✅ 区域配置删除成功:', regionId);
        // 触发数据更新通知
        import('./dataUpdateNotifier').then(module => {
          module.notifyRegionUpdate(regionId, 'delete');
        });
        return true;
      }
    } else {
      console.error('❌ Supabase 未配置，无法删除');
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
    // 只使用 Supabase，不再保存到本地
    if (isSupabaseConfigured()) {
      console.log(`💾 更新区域 ${regionId} 的 FSA 到 Supabase...`);
      const updated = await regionService.updateRegionFSAs(regionId, fsaCodes);
      if (updated) {
        console.log(`✅ 区域 ${regionId} FSA更新到数据库成功:`, fsaCodes.length, '个FSA');
        return true;
      } else {
        console.error(`❌ 区域 ${regionId} FSA更新失败`);
        return false;
      }
    } else {
      console.error('❌ Supabase 未配置，无法更新FSA');
      return false;
    }
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

  // postalCodes 可以是空数组，但必须是数组类型
  if (config.postalCodes !== undefined && !Array.isArray(config.postalCodes)) {
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
export const getRegionStats = async (regionId) => {
  const config = await getRegionConfig(regionId);
  if (!config) {
    return {
      totalFSAs: 0,
      activeFSAs: 0,
      totalFSAs: 0,
      totalPrice: 0,
      activeWeightRanges: 0
    };
  }

  // 支持多种字段名（Supabase 和本地存储格式）
  const fsaCodes = config.fsaCodes || config.fsa_codes || [];
  const postalCodes = config.postalCodes || config.postal_codes || [];
  const weightRanges = config.weightRanges || config.weight_ranges || [];
  
  // 计算活跃的重量区间
  const activeWeightRanges = weightRanges.filter(range => range.isActive);
  const totalPrice = activeWeightRanges.reduce((sum, range) => sum + (range.price || 0), 0);

  // 优先使用 FSA 数据
  let totalFSAs = 0;
  let uniqueFSAs = new Set();
  
  if (fsaCodes.length > 0) {
    // 如果有 FSA 数据，直接使用
    totalFSAs = fsaCodes.length;
    fsaCodes.forEach(fsa => uniqueFSAs.add(fsa));
  } else if (postalCodes.length > 0) {
    // 如果只有邮编数据，从邮编提取 FSA
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
 * 获取所有区域的存储统计信息（异步版本）
 * @param {boolean} forceRefresh - 是否强制刷新
 * @returns {Promise<Object>} 存储统计信息
 */
export const getStorageStats = async (forceRefresh = false) => {
  const allConfigs = await getAllRegionConfigs(forceRefresh);
  const regionIds = Object.keys(allConfigs);
  
  let totalFSAs = 0;
  let activeRegions = 0;
  const allAssignedFSAs = new Set();

  regionIds.forEach(regionId => {
    const config = allConfigs[regionId];
    if (config) {
      // 优先使用 fsaCodes（Supabase 格式），其次使用 postalCodes
      const fsaCodes = config.fsaCodes || config.fsa_codes || [];
      const postalCodes = config.postalCodes || config.postal_codes || [];
      
      // 计算FSA数量
      if (fsaCodes.length > 0) {
        totalFSAs += fsaCodes.length;
        fsaCodes.forEach(fsa => allAssignedFSAs.add(fsa));
      } else if (postalCodes.length > 0) {
        // 如果没有FSA，从邮编中提取
        postalCodes.forEach(code => {
          if (typeof code === 'string' && code.length >= 3) {
            const fsa = code.substring(0, 3).toUpperCase();
            allAssignedFSAs.add(fsa);
          }
        });
        totalFSAs += allAssignedFSAs.size;
      }
      
      if (config.isActive || config.is_active) {
        activeRegions++;
      }
    }
  });

  return {
    regionCount: regionIds.length,
    activeRegions,
    totalFSAs,  // 总FSA数
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
