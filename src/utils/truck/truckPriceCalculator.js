/**
 * 卡车配送价格计算服务
 * 提供基于重量的价格查找和批量计算功能
 */

import { 
  getAllPriceTables,
  getPriceTable,
  validatePriceTable 
} from '../storage/truckPriceStorage.js';
import { validateWeightRangePrice } from '../../types/truckDelivery.js';

/**
 * 价格查找结果类型定义
 * @typedef {Object} PriceResult
 * @property {string} regionId - 区域ID
 * @property {string} regionName - 区域名称
 * @property {number} weight - 重量(kg)
 * @property {number} price - 价格(CAD)
 * @property {Object} range - 匹配的重量区间信息
 * @property {string} currency - 货币单位
 * @property {string} calculatedAt - 计算时间
 * @property {boolean} isValid - 结果是否有效
 */

/**
 * 批量价格计算结果
 * @typedef {Object} BatchPriceResult
 * @property {PriceResult[]} results - 计算结果数组
 * @property {Object} summary - 统计摘要
 * @property {string[]} errors - 错误信息
 */

/**
 * 根据重量查找单个区域的价格
 * @param {string} regionId - 区域ID
 * @param {number} weight - 重量(kg)
 * @returns {PriceResult|null} 价格结果，未找到时返回null
 */
export const findPriceByWeight = (regionId, weight) => {
  try {
    // 验证输入参数
    if (!regionId || typeof regionId !== 'string') {
      console.warn('区域ID无效:', regionId);
      return null;
    }

    if (typeof weight !== 'number' || weight < 0) {
      console.warn('重量参数无效:', weight);
      return null;
    }

    // 获取区域价格表
    const priceTable = getPriceTable(regionId);
    if (!priceTable) {
      console.warn(`区域 ${regionId} 的价格表不存在`);
      return null;
    }

    // 检查价格表是否激活
    if (!priceTable.isActive) {
      console.warn(`区域 ${regionId} 的价格表未激活`);
      return null;
    }

    // 验证价格表
    const validation = validatePriceTable(priceTable);
    if (!validation.isValid) {
      console.warn(`区域 ${regionId} 的价格表验证失败:`, validation.errors);
      return null;
    }

    // 获取激活的重量区间
    const activeRanges = priceTable.weightRanges?.filter(range => 
      range.isActive && range.price >= 0
    ) || [];

    if (activeRanges.length === 0) {
      console.warn(`区域 ${regionId} 没有有效的价格区间`);
      return null;
    }

    // 查找匹配的重量区间
    let matchedRange = null;
    for (const range of activeRanges) {
      // 处理无穷大的情况
      const maxWeight = range.max === Infinity ? Number.MAX_SAFE_INTEGER : range.max;
      
      if (weight >= range.min && weight <= maxWeight) {
        matchedRange = range;
        break;
      }
    }

    if (!matchedRange) {
      console.warn(`重量 ${weight}kg 不在区域 ${regionId} 的任何价格区间内`);
      return null;
    }

    // 验证匹配的区间
    const rangeValidation = validateWeightRangePrice(matchedRange);
    if (!rangeValidation.isValid) {
      console.warn(`匹配的重量区间无效:`, rangeValidation.errors);
      return null;
    }

    // 返回价格结果
    return {
      regionId,
      regionName: priceTable.regionName || `区域${regionId}`,
      weight,
      price: matchedRange.price,
      range: {
        id: matchedRange.id,
        min: matchedRange.min,
        max: matchedRange.max,
        label: matchedRange.label
      },
      currency: 'CAD',
      calculatedAt: new Date().toISOString(),
      isValid: true
    };

  } catch (error) {
    console.error(`计算区域 ${regionId} 重量 ${weight}kg 的价格时发生错误:`, error);
    return null;
  }
};

/**
 * 批量计算多个重量的价格
 * @param {string} regionId - 区域ID
 * @param {number[]} weights - 重量数组(kg)
 * @returns {BatchPriceResult} 批量计算结果
 */
export const calculateBatchPrices = (regionId, weights) => {
  const results = [];
  const errors = [];
  const summary = {
    total: weights.length,
    successful: 0,
    failed: 0,
    totalPrice: 0,
    averagePrice: 0,
    minPrice: Number.MAX_SAFE_INTEGER,
    maxPrice: 0
  };

  try {
    // 验证输入
    if (!regionId || typeof regionId !== 'string') {
      errors.push('区域ID无效');
      return { results, summary, errors };
    }

    if (!Array.isArray(weights) || weights.length === 0) {
      errors.push('重量数组无效或为空');
      return { results, summary, errors };
    }

    // 批量计算价格
    weights.forEach((weight, index) => {
      try {
        const result = findPriceByWeight(regionId, weight);
        
        if (result && result.isValid) {
          results.push(result);
          summary.successful++;
          summary.totalPrice += result.price;
          summary.minPrice = Math.min(summary.minPrice, result.price);
          summary.maxPrice = Math.max(summary.maxPrice, result.price);
        } else {
          summary.failed++;
          errors.push(`重量 ${weight}kg (索引 ${index}) 计算失败`);
          
          // 添加失败记录
          results.push({
            regionId,
            regionName: `区域${regionId}`,
            weight,
            price: 0,
            range: null,
            currency: 'CAD',
            calculatedAt: new Date().toISOString(),
            isValid: false,
            error: `无法找到重量 ${weight}kg 对应的价格区间`
          });
        }
      } catch (error) {
        summary.failed++;
        errors.push(`重量 ${weight}kg (索引 ${index}) 计算异常: ${error.message}`);
        
        results.push({
          regionId,
          regionName: `区域${regionId}`,
          weight,
          price: 0,
          range: null,
          currency: 'CAD',
          calculatedAt: new Date().toISOString(),
          isValid: false,
          error: error.message
        });
      }
    });

    // 计算平均价格
    if (summary.successful > 0) {
      summary.averagePrice = Math.round(summary.totalPrice / summary.successful * 100) / 100;
    }

    // 处理最小价格
    if (summary.minPrice === Number.MAX_SAFE_INTEGER) {
      summary.minPrice = 0;
    }

    console.log(`区域 ${regionId} 批量计算完成:`, summary);
    return { results, summary, errors };

  } catch (error) {
    console.error('批量价格计算时发生错误:', error);
    errors.push(`批量计算异常: ${error.message}`);
    return { results, summary, errors };
  }
};

/**
 * 计算多个区域的价格
 * @param {string[]} regionIds - 区域ID数组
 * @param {number} weight - 重量(kg)
 * @returns {Object} 多区域价格结果
 */
export const calculateMultiRegionPrices = (regionIds, weight) => {
  const results = {};
  const errors = [];
  const summary = {
    totalRegions: regionIds.length,
    successfulRegions: 0,
    failedRegions: 0,
    prices: []
  };

  try {
    regionIds.forEach(regionId => {
      try {
        const result = findPriceByWeight(regionId, weight);
        
        if (result && result.isValid) {
          results[regionId] = result;
          summary.successfulRegions++;
          summary.prices.push(result.price);
        } else {
          summary.failedRegions++;
          errors.push(`区域 ${regionId} 计算失败`);
          results[regionId] = {
            regionId,
            regionName: `区域${regionId}`,
            weight,
            price: 0,
            range: null,
            currency: 'CAD',
            calculatedAt: new Date().toISOString(),
            isValid: false,
            error: '价格计算失败'
          };
        }
      } catch (error) {
        summary.failedRegions++;
        errors.push(`区域 ${regionId} 计算异常: ${error.message}`);
        results[regionId] = {
          regionId,
          regionName: `区域${regionId}`,
          weight,
          price: 0,
          range: null,
          currency: 'CAD',
          calculatedAt: new Date().toISOString(),
          isValid: false,
          error: error.message
        };
      }
    });

    // 计算价格统计
    if (summary.prices.length > 0) {
      summary.minPrice = Math.min(...summary.prices);
      summary.maxPrice = Math.max(...summary.prices);
      summary.avgPrice = Math.round(
        summary.prices.reduce((sum, p) => sum + p, 0) / summary.prices.length * 100
      ) / 100;
    }

    console.log(`多区域计算完成 (重量 ${weight}kg):`, summary);
    return { results, summary, errors };

  } catch (error) {
    console.error('多区域价格计算时发生错误:', error);
    return {
      results: {},
      summary: {
        totalRegions: regionIds.length,
        successfulRegions: 0,
        failedRegions: regionIds.length
      },
      errors: [`多区域计算异常: ${error.message}`]
    };
  }
};

/**
 * 获取区域价格区间信息
 * @param {string} regionId - 区域ID
 * @returns {Object|null} 价格区间信息
 */
export const getRegionPriceRanges = (regionId) => {
  try {
    const priceTable = getPriceTable(regionId);
    if (!priceTable || !priceTable.isActive) {
      return null;
    }

    const activeRanges = priceTable.weightRanges?.filter(range => range.isActive) || [];
    const pricedRanges = activeRanges.filter(range => range.price > 0);

    return {
      regionId,
      regionName: priceTable.regionName,
      totalRanges: priceTable.weightRanges?.length || 0,
      activeRanges: activeRanges.length,
      pricedRanges: pricedRanges.length,
      minWeight: activeRanges.length > 0 ? Math.min(...activeRanges.map(r => r.min)) : 0,
      maxWeight: activeRanges.length > 0 ? 
        Math.max(...activeRanges.map(r => r.max === Infinity ? 1000 : r.max)) : 0,
      minPrice: pricedRanges.length > 0 ? Math.min(...pricedRanges.map(r => r.price)) : 0,
      maxPrice: pricedRanges.length > 0 ? Math.max(...pricedRanges.map(r => r.price)) : 0,
      ranges: activeRanges.map(range => ({
        id: range.id,
        min: range.min,
        max: range.max,
        label: range.label,
        price: range.price,
        isActive: range.isActive
      })),
      lastUpdated: priceTable.lastUpdated
    };

  } catch (error) {
    console.error(`获取区域 ${regionId} 价格区间信息失败:`, error);
    return null;
  }
};

/**
 * 验证价格计算可用性
 * @param {string} regionId - 区域ID
 * @returns {Object} 验证结果
 */
export const validatePriceCalculationAvailability = (regionId) => {
  try {
    const priceTable = getPriceTable(regionId);
    
    if (!priceTable) {
      return {
        available: false,
        reason: '价格表不存在',
        details: `区域 ${regionId} 没有配置价格表`
      };
    }

    if (!priceTable.isActive) {
      return {
        available: false,
        reason: '价格表未激活',
        details: '价格表存在但未激活，无法进行价格计算'
      };
    }

    const validation = validatePriceTable(priceTable);
    if (!validation.isValid) {
      return {
        available: false,
        reason: '价格表配置无效',
        details: `价格表验证失败: ${validation.errors.join(', ')}`
      };
    }

    const activeRanges = priceTable.weightRanges?.filter(range => 
      range.isActive && range.price >= 0
    ) || [];

    if (activeRanges.length === 0) {
      return {
        available: false,
        reason: '没有有效价格区间',
        details: '价格表中没有激活且已定价的重量区间'
      };
    }

    // 检查是否有价格区间覆盖间隙
    const sortedRanges = [...activeRanges].sort((a, b) => a.min - b.min);
    const gaps = [];
    
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const current = sortedRanges[i];
      const next = sortedRanges[i + 1];
      if (current.max < next.min) {
        gaps.push(`${current.max}kg - ${next.min}kg`);
      }
    }

    return {
      available: true,
      reason: '价格计算可用',
      details: '价格表配置正常，可以进行价格计算',
      statistics: {
        totalRanges: priceTable.weightRanges?.length || 0,
        activeRanges: activeRanges.length,
        pricedRanges: activeRanges.filter(r => r.price > 0).length,
        weightCoverage: {
          min: sortedRanges[0]?.min || 0,
          max: sortedRanges[sortedRanges.length - 1]?.max || 0
        },
        gaps: gaps.length > 0 ? gaps : null
      },
      warnings: validation.warnings || []
    };

  } catch (error) {
    console.error(`验证区域 ${regionId} 价格计算可用性时发生错误:`, error);
    return {
      available: false,
      reason: '验证过程发生错误',
      details: error.message
    };
  }
};

/**
 * 获取价格计算统计信息
 * @returns {Object} 整体统计信息
 */
export const getPriceCalculationStats = () => {
  try {
    const allTables = getAllPriceTables();
    const regionIds = Object.keys(allTables);
    
    const stats = {
      totalRegions: regionIds.length,
      availableRegions: 0,
      unavailableRegions: 0,
      totalRanges: 0,
      activeRanges: 0,
      pricedRanges: 0,
      averageRangesPerRegion: 0,
      regionDetails: {}
    };

    regionIds.forEach(regionId => {
      const availability = validatePriceCalculationAvailability(regionId);
      stats.regionDetails[regionId] = availability;
      
      if (availability.available) {
        stats.availableRegions++;
        const regionStats = availability.statistics;
        if (regionStats) {
          stats.totalRanges += regionStats.totalRanges;
          stats.activeRanges += regionStats.activeRanges;
          stats.pricedRanges += regionStats.pricedRanges;
        }
      } else {
        stats.unavailableRegions++;
      }
    });

    if (stats.availableRegions > 0) {
      stats.averageRangesPerRegion = Math.round(stats.totalRanges / stats.availableRegions * 100) / 100;
    }

    return stats;

  } catch (error) {
    console.error('获取价格计算统计信息失败:', error);
    return {
      totalRegions: 0,
      availableRegions: 0,
      unavailableRegions: 0,
      totalRanges: 0,
      activeRanges: 0,
      pricedRanges: 0,
      averageRangesPerRegion: 0,
      regionDetails: {},
      error: error.message
    };
  }
};

// 导出所有功能
export default {
  findPriceByWeight,
  calculateBatchPrices,
  calculateMultiRegionPrices,
  getRegionPriceRanges,
  validatePriceCalculationAvailability,
  getPriceCalculationStats
};