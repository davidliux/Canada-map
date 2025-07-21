/**
 * 配送区域管理数据结构和工具函数
 * 实现基于配送区域（1-8区）的分层管理系统
 */

import { DEFAULT_WEIGHT_RANGES } from './fsaManagement.js';
import { getRegionPostalCodes } from '../utils/unifiedStorage.js';

// 默认配送区域配置（1-8区）- 使用统一存储架构的区域ID格式
export const DEFAULT_REGIONS = [
  { id: '1', name: '1区', color: '#3B82F6', description: '核心配送区域' },
  { id: '2', name: '2区', color: '#10B981', description: '主要配送区域' },
  { id: '3', name: '3区', color: '#F59E0B', description: '扩展配送区域' },
  { id: '4', name: '4区', color: '#EF4444', description: '远程配送区域' },
  { id: '5', name: '5区', color: '#8B5CF6', description: '特殊配送区域' },
  { id: '6', name: '6区', color: '#EC4899', description: '偏远配送区域' },
  { id: '7', name: '7区', color: '#6B7280', description: '边缘配送区域' },
  { id: '8', name: '8区', color: '#F97316', description: '最远配送区域' }
];

/**
 * 配送区域配置数据结构
 * @typedef {Object} RegionConfiguration
 * @property {string} regionId - 区域ID（region_1 到 region_8）
 * @property {string} regionName - 区域显示名称（1区到8区）
 * @property {string} color - 区域标识颜色
 * @property {string} description - 区域描述
 * @property {boolean} isActive - 区域启用状态
 * @property {string[]} fsaCodes - 包含的FSA列表
 * @property {WeightRangePrice[]} weightRanges - 区域级别的价格配置
 * @property {Object} metadata - 区域元数据
 * @property {string} lastUpdated - 最后更新时间
 */

/**
 * 增强的FSA配置数据结构（在原有基础上添加区域关联）
 * @typedef {Object} EnhancedFSAConfiguration
 * @property {string} fsaCode - FSA代码
 * @property {string} assignedRegion - 所属配送区域ID
 * @property {string} province - 省份代码
 * @property {string} region - 地区名称
 * @property {string[]} postalCodes - 绑定的邮编列表
 * @property {boolean} isActive - 是否启用配送
 * @property {string} lastUpdated - 最后更新时间
 * @property {Object} metadata - 元数据信息
 */

/**
 * 创建默认的区域配置
 * @param {string} regionId - 区域ID
 * @param {string} regionName - 区域名称
 * @param {string} color - 区域颜色
 * @param {string} description - 区域描述
 * @returns {RegionConfiguration}
 */
export const createDefaultRegionConfig = (regionId, regionName, color, description) => {
  return {
    regionId,
    regionName,
    color,
    description,
    isActive: true,
    fsaCodes: [],
    weightRanges: DEFAULT_WEIGHT_RANGES.map(range => ({
      ...range,
      price: 0,
      isActive: true
    })),
    metadata: {
      createdAt: new Date().toISOString(),
      version: '2.0.0',
      notes: '',
      totalFSAs: 0,
      totalPostalCodes: 0
    },
    lastUpdated: new Date().toISOString()
  };
};

/**
 * 初始化所有默认区域配置
 * @returns {Object} 区域配置对象集合
 */
export const initializeDefaultRegions = () => {
  const regions = {};
  
  DEFAULT_REGIONS.forEach(region => {
    regions[region.id] = createDefaultRegionConfig(
      region.id,
      region.name,
      region.color,
      region.description
    );
  });
  
  return regions;
};

/**
 * 验证区域配置数据
 * @param {RegionConfiguration} config - 区域配置对象
 * @returns {Object} 验证结果
 */
export const validateRegionConfig = (config) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!config.regionId || typeof config.regionId !== 'string') {
    errors.push('区域ID是必填项');
  }

  if (!config.regionName || typeof config.regionName !== 'string') {
    errors.push('区域名称是必填项');
  }

  if (!Array.isArray(config.fsaCodes)) {
    errors.push('FSA代码列表必须是数组');
  }

  if (!Array.isArray(config.weightRanges)) {
    errors.push('重量区间配置必须是数组');
  }

  // 区域ID格式验证
  if (config.regionId && !/^region_[1-8]$/.test(config.regionId)) {
    errors.push('区域ID格式不正确，应为 region_1 到 region_8');
  }

  // 重量区间验证
  if (config.weightRanges) {
    config.weightRanges.forEach((range, index) => {
      if (typeof range.min !== 'number' || typeof range.max !== 'number') {
        errors.push(`重量区间 ${index + 1}: 最小值和最大值必须是数字`);
      }
      
      if (range.min >= range.max && range.max !== Infinity) {
        errors.push(`重量区间 ${index + 1}: 最小值必须小于最大值`);
      }

      if (typeof range.price !== 'number' || range.price < 0) {
        errors.push(`重量区间 ${index + 1}: 价格必须是非负数字`);
      }
    });
  }

  // FSA代码格式验证
  if (config.fsaCodes) {
    config.fsaCodes.forEach((code, index) => {
      if (typeof code !== 'string' || !/^[A-Z]\d[A-Z]$/.test(code)) {
        warnings.push(`FSA代码 ${index + 1}: ${code} 格式可能不正确`);
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
 * 获取区域显示信息
 * @param {string} regionId - 区域ID
 * @returns {Object} 区域显示信息
 */
export const getRegionDisplayInfo = (regionId) => {
  const region = DEFAULT_REGIONS.find(r => r.id === regionId);
  return region || {
    id: regionId,
    name: '未知区域',
    color: '#6B7280',
    description: '未定义的配送区域'
  };
};

/**
 * 从FSA代码获取所属区域（统一架构版本）
 * @param {string} fsaCode - FSA代码
 * @returns {string|null} 区域ID或null
 */
export const getRegionByFSA = (fsaCode) => {
  // 使用统一存储架构查找FSA属于哪个区域
  for (let regionId = 1; regionId <= 8; regionId++) {
    try {
      const postalCodes = getRegionPostalCodes(regionId.toString());
      if (postalCodes.includes(fsaCode)) {
        return regionId.toString();
      }
    } catch (error) {
      console.error(`检查区域 ${regionId} 邮编数据失败:`, error);
    }
  }
  return null;
};

/**
 * 从FSA代码获取所属区域（兼容旧架构）
 * @param {string} fsaCode - FSA代码
 * @param {Object} regionConfigs - 区域配置集合
 * @returns {string|null} 区域ID或null
 */
export const getRegionByFSALegacy = (fsaCode, regionConfigs) => {
  for (const [regionId, config] of Object.entries(regionConfigs)) {
    if (config.fsaCodes && config.fsaCodes.includes(fsaCode)) {
      return regionId;
    }
  }
  return null;
};

// 删除旧的getRegionStats函数 - 现在使用统一存储架构中的getRegionStats

/**
 * 获取区域统计信息（兼容旧架构）
 * @param {RegionConfiguration} regionConfig - 区域配置
 * @param {Object} fsaConfigs - FSA配置集合
 * @returns {Object} 统计信息
 */
export const getRegionStatsLegacy = (regionConfig, fsaConfigs = {}) => {
  const stats = {
    totalFSAs: regionConfig.fsaCodes?.length || 0,
    activeFSAs: 0,
    totalPostalCodes: 0,
    totalPrice: 0,
    activeWeightRanges: 0
  };

  // 统计FSA信息
  if (regionConfig.fsaCodes) {
    regionConfig.fsaCodes.forEach(fsaCode => {
      const fsaConfig = fsaConfigs[fsaCode];
      if (fsaConfig) {
        if (fsaConfig.isActive) {
          stats.activeFSAs++;
        }
        stats.totalPostalCodes += fsaConfig.postalCodes?.length || 0;
      }
    });
  }

  // 统计价格信息
  if (regionConfig.weightRanges) {
    regionConfig.weightRanges.forEach(range => {
      if (range.isActive) {
        stats.activeWeightRanges++;
        stats.totalPrice += range.price;
      }
    });
  }

  return stats;
};

/**
 * 复制区域价格配置
 * @param {RegionConfiguration} sourceRegion - 源区域配置
 * @param {RegionConfiguration} targetRegion - 目标区域配置
 * @returns {RegionConfiguration} 更新后的目标区域配置
 */
export const copyRegionPricing = (sourceRegion, targetRegion) => {
  return {
    ...targetRegion,
    weightRanges: sourceRegion.weightRanges.map(range => ({ ...range })),
    lastUpdated: new Date().toISOString()
  };
};

/**
 * 批量调整区域价格
 * @param {RegionConfiguration} regionConfig - 区域配置
 * @param {number} percentage - 调整百分比（如 10 表示增加10%）
 * @param {string[]} rangeIds - 要调整的区间ID列表，为空则调整所有
 * @returns {RegionConfiguration} 更新后的区域配置
 */
export const adjustRegionPricing = (regionConfig, percentage, rangeIds = []) => {
  const multiplier = 1 + (percentage / 100);
  
  const updatedWeightRanges = regionConfig.weightRanges.map(range => {
    if (rangeIds.length === 0 || rangeIds.includes(range.id)) {
      return {
        ...range,
        price: Math.round(range.price * multiplier * 100) / 100 // 保留两位小数
      };
    }
    return range;
  });

  return {
    ...regionConfig,
    weightRanges: updatedWeightRanges,
    lastUpdated: new Date().toISOString()
  };
};

/**
 * 分配FSA到区域
 * @param {string} fsaCode - FSA代码
 * @param {string} fromRegionId - 源区域ID
 * @param {string} toRegionId - 目标区域ID
 * @param {Object} regionConfigs - 区域配置集合
 * @returns {Object} 更新后的区域配置集合
 */
export const assignFSAToRegion = (fsaCode, fromRegionId, toRegionId, regionConfigs) => {
  const updatedConfigs = { ...regionConfigs };

  // 从源区域移除FSA
  if (fromRegionId && updatedConfigs[fromRegionId]) {
    updatedConfigs[fromRegionId] = {
      ...updatedConfigs[fromRegionId],
      fsaCodes: updatedConfigs[fromRegionId].fsaCodes.filter(code => code !== fsaCode),
      lastUpdated: new Date().toISOString()
    };
  }

  // 添加FSA到目标区域
  if (toRegionId && updatedConfigs[toRegionId]) {
    const targetFSAs = new Set(updatedConfigs[toRegionId].fsaCodes);
    targetFSAs.add(fsaCode);
    
    updatedConfigs[toRegionId] = {
      ...updatedConfigs[toRegionId],
      fsaCodes: Array.from(targetFSAs),
      lastUpdated: new Date().toISOString()
    };
  }

  return updatedConfigs;
};

/**
 * 批量分配FSA到区域
 * @param {string[]} fsaCodes - FSA代码列表
 * @param {string} toRegionId - 目标区域ID
 * @param {Object} regionConfigs - 区域配置集合
 * @returns {Object} 更新后的区域配置集合和操作结果
 */
export const batchAssignFSAsToRegion = (fsaCodes, toRegionId, regionConfigs) => {
  let updatedConfigs = { ...regionConfigs };
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  fsaCodes.forEach(fsaCode => {
    try {
      // 找到FSA当前所属区域
      const currentRegion = getRegionByFSA(fsaCode, updatedConfigs);
      
      // 执行分配
      updatedConfigs = assignFSAToRegion(fsaCode, currentRegion, toRegionId, updatedConfigs);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`分配 ${fsaCode} 失败: ${error.message}`);
    }
  });

  return {
    regionConfigs: updatedConfigs,
    results
  };
};

/**
 * 获取未分配的FSA列表
 * @param {string[]} allFSACodes - 所有FSA代码列表
 * @param {Object} regionConfigs - 区域配置集合
 * @returns {string[]} 未分配的FSA代码列表
 */
export const getUnassignedFSAs = (allFSACodes, regionConfigs) => {
  const assignedFSAs = new Set();
  
  Object.values(regionConfigs).forEach(config => {
    config.fsaCodes.forEach(code => assignedFSAs.add(code));
  });
  
  return allFSACodes.filter(code => !assignedFSAs.has(code));
};

/**
 * 生成区域配置报告
 * @param {Object} regionConfigs - 区域配置集合
 * @param {Object} fsaConfigs - FSA配置集合
 * @returns {Object} 配置报告
 */
export const generateRegionReport = (regionConfigs, fsaConfigs = {}) => {
  const report = {
    totalRegions: Object.keys(regionConfigs).length,
    activeRegions: 0,
    totalFSAs: 0,
    totalPostalCodes: 0,
    regionDetails: {}
  };

  Object.entries(regionConfigs).forEach(([regionId, config]) => {
    if (config.isActive) {
      report.activeRegions++;
    }

    const stats = getRegionStats(config, fsaConfigs);
    report.totalFSAs += stats.totalFSAs;
    report.totalPostalCodes += stats.totalPostalCodes;

    report.regionDetails[regionId] = {
      ...getRegionDisplayInfo(regionId),
      isActive: config.isActive,
      stats
    };
  });

  return report;
};
