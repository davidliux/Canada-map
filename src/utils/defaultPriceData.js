/**
 * 默认价格数据配置
 * 包含预设的重量区间价格表，可直接应用到配送区域
 */

import { generateWeightRangeId, formatWeightRangeLabel } from '../data/fsaManagement.js';
import { getAllRegionConfigs, saveRegionConfig } from './unifiedStorage.js';

// 默认价格表数据（基于提供的示例数据）
export const DEFAULT_PRICE_TABLE = [
  { min: 11.000, max: 15.000, zone1: 6.21, zone2: 12.70, zone3: 12.87, zone4: 7.82, zone5: 13.54 },
  { min: 15.000, max: 20.000, zone1: 8.17, zone2: 14.65, zone3: 14.82, zone4: 9.09, zone5: 14.84 },
  { min: 20.000, max: 25.000, zone1: 10.93, zone2: 15.11, zone3: 15.28, zone4: 12.42, zone5: 15.81 },
  { min: 25.000, max: 30.000, zone1: 13.80, zone2: 18.98, zone3: 19.90, zone4: 14.95, zone5: 24.73 },
  { min: 30.000, max: 35.000, zone1: 14.95, zone2: 20.13, zone3: 21.28, zone4: 16.10, zone5: 25.88 },
  { min: 35.000, max: 40.000, zone1: 17.25, zone2: 22.43, zone3: 23.58, zone4: 18.40, zone5: 27.03 },
  { min: 40.000, max: 45.000, zone1: 18.40, zone2: 23.58, zone3: 24.73, zone4: 19.55, zone5: 28.18 },
  { min: 45.000, max: 50.000, zone1: 19.55, zone2: 24.73, zone3: 25.88, zone4: 20.70, zone5: 29.33 },
  { min: 50.000, max: 55.000, zone1: 20.70, zone2: 25.88, zone3: 27.03, zone4: 21.85, zone5: 30.48 },
  { min: 55.000, max: 60.000, zone1: 23.00, zone2: 28.18, zone3: 29.33, zone4: 24.15, zone5: 32.55 },
  { min: 60.000, max: 64.000, zone1: 26.45, zone2: 31.63, zone3: 32.78, zone4: 27.60, zone5: 34.96 },
  { min: 64.000, max: 65.000, zone1: 28.75, zone2: 33.93, zone3: 35.08, zone4: 29.90, zone5: 37.38 }
];

// 区域价格映射（Zone 1-5 对应系统区域 1-5）
export const ZONE_REGION_MAPPING = {
  zone1: '1',
  zone2: '2',
  zone3: '3',
  zone4: '4',
  zone5: '5'
};

/**
 * 将默认价格表转换为重量区间配置
 * @param {string} zoneKey - 区域键名（zone1, zone2, etc.）
 * @returns {Array} 重量区间配置数组
 */
export const convertPriceTableToWeightRanges = (zoneKey) => {
  return DEFAULT_PRICE_TABLE.map(row => ({
    id: generateWeightRangeId(row.min, row.max),
    min: row.min,
    max: row.max,
    price: row[zoneKey] || 0,
    label: formatWeightRangeLabel(row.min, row.max),
    isActive: true
  }));
};

/**
 * 应用默认价格配置到指定区域
 * @param {string} regionId - 区域ID
 * @param {string} zoneKey - 价格区域键名
 * @returns {boolean} 应用是否成功
 */
export const applyDefaultPricingToRegion = (regionId, zoneKey) => {
  try {
    const regionConfigs = getAllRegionConfigs();
    const regionConfig = regionConfigs[regionId];
    
    if (!regionConfig) {
      console.error(`区域 ${regionId} 不存在`);
      return false;
    }

    if (!DEFAULT_PRICE_TABLE.some(row => row[zoneKey] !== undefined)) {
      console.error(`价格区域 ${zoneKey} 不存在`);
      return false;
    }

    // 生成新的重量区间配置
    const newWeightRanges = convertPriceTableToWeightRanges(zoneKey);

    // 更新区域配置
    const updatedConfig = {
      ...regionConfig,
      weightRanges: newWeightRanges,
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...regionConfig.metadata,
        defaultPricingApplied: true,
        defaultPricingZone: zoneKey,
        defaultPricingDate: new Date().toISOString(),
        version: '2.1.0'
      }
    };

    // 保存配置
    const success = saveRegionConfig(regionId, updatedConfig);
    if (success) {
      console.log(`成功应用默认价格配置到区域 ${regionId} (${zoneKey})`);
      return true;
    } else {
      console.error(`保存区域 ${regionId} 配置失败`);
      return false;
    }

  } catch (error) {
    console.error('应用默认价格配置失败:', error);
    return false;
  }
};

/**
 * 批量应用默认价格配置到所有区域
 * @returns {Object} 应用结果
 */
export const applyDefaultPricingToAllRegions = () => {
  try {
    const results = {
      success: [],
      failed: [],
      summary: {
        totalRegions: 0,
        successCount: 0,
        failedCount: 0
      }
    };

    // 应用Zone 1-5到区域1-5
    Object.entries(ZONE_REGION_MAPPING).forEach(([zoneKey, regionId]) => {
      results.summary.totalRegions++;
      
      const success = applyDefaultPricingToRegion(regionId, zoneKey);
      if (success) {
        results.success.push({
          regionId,
          regionName: `${regionId}区`,
          zoneKey,
          rangeCount: DEFAULT_PRICE_TABLE.length
        });
        results.summary.successCount++;
      } else {
        results.failed.push({
          regionId,
          regionName: `${regionId}区`,
          zoneKey,
          error: '配置应用失败'
        });
        results.summary.failedCount++;
      }
    });

    console.log('批量应用默认价格配置完成:', results);
    return results;

  } catch (error) {
    console.error('批量应用默认价格配置失败:', error);
    return {
      success: [],
      failed: [],
      summary: { totalRegions: 0, successCount: 0, failedCount: 1 },
      error: error.message
    };
  }
};

/**
 * 获取默认价格表的统计信息
 * @returns {Object} 统计信息
 */
export const getDefaultPriceTableStats = () => {
  const stats = {
    totalRanges: DEFAULT_PRICE_TABLE.length,
    weightRange: {
      min: Math.min(...DEFAULT_PRICE_TABLE.map(row => row.min)),
      max: Math.max(...DEFAULT_PRICE_TABLE.map(row => row.max))
    },
    priceRanges: {}
  };

  // 计算每个区域的价格范围
  Object.keys(ZONE_REGION_MAPPING).forEach(zoneKey => {
    const prices = DEFAULT_PRICE_TABLE.map(row => row[zoneKey]).filter(p => p > 0);
    stats.priceRanges[zoneKey] = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: prices.reduce((sum, p) => sum + p, 0) / prices.length
    };
  });

  return stats;
};

/**
 * 检查区域是否已应用默认价格配置
 * @param {string} regionId - 区域ID
 * @returns {boolean} 是否已应用
 */
export const hasDefaultPricingApplied = (regionId) => {
  try {
    const regionConfigs = getAllRegionConfigs();
    const regionConfig = regionConfigs[regionId];
    
    return regionConfig?.metadata?.defaultPricingApplied === true;
  } catch (error) {
    console.error('检查默认价格配置状态失败:', error);
    return false;
  }
};

/**
 * 重置区域价格配置（清除默认配置）
 * @param {string} regionId - 区域ID
 * @returns {boolean} 重置是否成功
 */
export const resetRegionPricing = (regionId) => {
  try {
    const regionConfigs = getAllRegionConfigs();
    const regionConfig = regionConfigs[regionId];
    
    if (!regionConfig) {
      console.error(`区域 ${regionId} 不存在`);
      return false;
    }

    // 重置重量区间为空价格
    const resetWeightRanges = (regionConfig.weightRanges || []).map(range => ({
      ...range,
      price: 0,
      isActive: false
    }));

    // 更新区域配置
    const updatedConfig = {
      ...regionConfig,
      weightRanges: resetWeightRanges,
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...regionConfig.metadata,
        defaultPricingApplied: false,
        defaultPricingZone: null,
        resetDate: new Date().toISOString()
      }
    };

    // 保存配置
    const success = saveRegionConfig(regionId, updatedConfig);
    if (success) {
      console.log(`成功重置区域 ${regionId} 的价格配置`);
      return true;
    } else {
      console.error(`重置区域 ${regionId} 配置失败`);
      return false;
    }

  } catch (error) {
    console.error('重置区域价格配置失败:', error);
    return false;
  }
};

/**
 * 导出默认价格表为CSV格式
 * @returns {string} CSV格式的价格表
 */
export const exportDefaultPriceTableAsCSV = () => {
  const headers = ['KGS↑', 'KGS↓', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5'];
  const csvRows = [headers.join(',')];
  
  DEFAULT_PRICE_TABLE.forEach(row => {
    const csvRow = [
      row.min,
      row.max,
      row.zone1,
      row.zone2,
      row.zone3,
      row.zone4,
      row.zone5
    ].join(',');
    csvRows.push(csvRow);
  });
  
  return csvRows.join('\n');
};

export default {
  DEFAULT_PRICE_TABLE,
  ZONE_REGION_MAPPING,
  convertPriceTableToWeightRanges,
  applyDefaultPricingToRegion,
  applyDefaultPricingToAllRegions,
  getDefaultPriceTableStats,
  hasDefaultPricingApplied,
  resetRegionPricing,
  exportDefaultPriceTableAsCSV
};
