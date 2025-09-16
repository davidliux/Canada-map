/**
 * 货车配送价格表存储服务
 * 专门管理货车配送的区域价格表存储、验证和历史记录
 */

import { DEFAULT_WEIGHT_RANGES } from '../../data/fsaManagement.js';
import { dataUpdateNotifier } from '../dataUpdateNotifier.js';

// 存储键名常量
export const TRUCK_PRICE_STORAGE_KEYS = {
  REGION_PRICES: 'truck_region_prices',
  PRICE_HISTORY: 'truck_price_history',
  PRICE_TEMPLATES: 'truck_price_templates',
  SETTINGS: 'truck_price_settings'
};

// 默认价格设置
export const DEFAULT_PRICE_SETTINGS = {
  currency: 'CAD',
  decimalPlaces: 2,
  enableHistory: true,
  maxHistoryRecords: 100,
  autoValidation: true,
  lastUpdated: new Date().toISOString()
};

/**
 * 价格表数据结构
 * @typedef {Object} TruckPriceTable
 * @property {string} regionId - 区域ID
 * @property {string} regionName - 区域名称
 * @property {WeightRangePrice[]} weightRanges - 重量区间价格配置
 * @property {boolean} isActive - 是否启用
 * @property {string} lastUpdated - 最后更新时间
 * @property {Object} metadata - 元数据信息
 */

/**
 * 重量区间价格配置
 * @typedef {Object} WeightRangePrice
 * @property {string} id - 区间唯一标识
 * @property {number} min - 最小重量 (KGS)
 * @property {number} max - 最大重量 (KGS)  
 * @property {string} label - 显示标签
 * @property {number} price - 配送价格 (CAD)
 * @property {boolean} isActive - 是否启用此区间
 */

/**
 * 创建默认价格表配置
 * @param {string} regionId - 区域ID
 * @param {string} regionName - 区域名称
 * @returns {TruckPriceTable}
 */
export const createDefaultPriceTable = (regionId, regionName = `区域${regionId}`) => {
  return {
    regionId,
    regionName,
    weightRanges: DEFAULT_WEIGHT_RANGES.map(range => ({
      ...range,
      price: 0,
      isActive: true
    })),
    isActive: false,
    lastUpdated: new Date().toISOString(),
    metadata: {
      createdAt: new Date().toISOString(),
      version: '1.0.0',
      notes: '',
      source: 'default_template'
    }
  };
};

/**
 * 验证价格表配置
 * @param {TruckPriceTable} priceTable - 价格表配置
 * @returns {Object} 验证结果
 */
export const validatePriceTable = (priceTable) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!priceTable.regionId || typeof priceTable.regionId !== 'string') {
    errors.push('区域ID是必填项');
  }

  if (!priceTable.regionName || typeof priceTable.regionName !== 'string') {
    errors.push('区域名称是必填项');
  }

  if (!Array.isArray(priceTable.weightRanges)) {
    errors.push('重量区间配置必须是数组');
  }

  // 重量区间验证
  if (priceTable.weightRanges && Array.isArray(priceTable.weightRanges)) {
    priceTable.weightRanges.forEach((range, index) => {
      // 数字类型验证
      if (typeof range.min !== 'number' || typeof range.max !== 'number') {
        errors.push(`重量区间 ${index + 1}: 最小值和最大值必须是数字`);
      }

      // 区间范围验证
      if (range.min >= range.max && range.max !== Infinity) {
        errors.push(`重量区间 ${index + 1}: 最小值必须小于最大值`);
      }

      // 价格验证
      if (typeof range.price !== 'number') {
        errors.push(`重量区间 ${index + 1}: 价格必须是数字`);
      } else if (range.price < 0) {
        errors.push(`重量区间 ${index + 1}: 价格不能为负数`);
      }

      // 价格合理性检查
      if (range.price > 1000) {
        warnings.push(`重量区间 ${index + 1}: 价格 ${range.price} 可能过高`);
      }

      // ID验证
      if (!range.id || typeof range.id !== 'string') {
        errors.push(`重量区间 ${index + 1}: ID是必填项`);
      }
    });

    // 检查重量区间是否有重叠
    const sortedRanges = [...priceTable.weightRanges].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const current = sortedRanges[i];
      const next = sortedRanges[i + 1];
      if (current.max >= next.min) {
        warnings.push(`重量区间重叠: ${current.label} 和 ${next.label}`);
      }
    }

    // 检查是否有启用的价格区间
    const activePriceRanges = priceTable.weightRanges.filter(range => range.isActive && range.price > 0);
    if (activePriceRanges.length === 0) {
      warnings.push('没有启用的价格区间，该区域将无法提供报价');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalRanges: priceTable.weightRanges?.length || 0,
      activeRanges: priceTable.weightRanges?.filter(r => r.isActive)?.length || 0,
      pricedRanges: priceTable.weightRanges?.filter(r => r.price > 0)?.length || 0
    }
  };
};

/**
 * 获取所有区域价格表
 * @returns {Object} 区域价格表集合
 */
export const getAllPriceTables = () => {
  try {
    const stored = localStorage.getItem(TRUCK_PRICE_STORAGE_KEYS.REGION_PRICES);
    if (stored) {
      return JSON.parse(stored);
    }
    return {};
  } catch (error) {
    console.error('获取价格表失败:', error);
    return {};
  }
};

/**
 * 获取单个区域价格表
 * @param {string} regionId - 区域ID
 * @returns {TruckPriceTable|null} 价格表配置
 */
export const getPriceTable = (regionId) => {
  try {
    const allTables = getAllPriceTables();
    return allTables[regionId] || null;
  } catch (error) {
    console.error(`获取区域 ${regionId} 价格表失败:`, error);
    return null;
  }
};

/**
 * 保存单个区域价格表
 * @param {string} regionId - 区域ID
 * @param {TruckPriceTable} priceTable - 价格表配置
 * @returns {boolean} 保存是否成功
 */
export const savePriceTable = (regionId, priceTable) => {
  try {
    // 验证配置
    const validation = validatePriceTable(priceTable);
    if (!validation.isValid) {
      console.error('价格表配置验证失败:', validation.errors);
      return false;
    }

    // 记录历史（如果启用）
    const settings = getPriceSettings();
    if (settings.enableHistory) {
      recordPriceHistory(regionId, priceTable, 'update');
    }

    // 更新价格表
    const allTables = getAllPriceTables();
    const updatedTable = {
      ...priceTable,
      regionId,
      lastUpdated: new Date().toISOString()
    };

    allTables[regionId] = updatedTable;
    
    // 保存到存储
    localStorage.setItem(TRUCK_PRICE_STORAGE_KEYS.REGION_PRICES, JSON.stringify(allTables));
    
    // 触发数据更新通知
    dataUpdateNotifier.notifyRegionUpdate(regionId, 'priceUpdate', {
      regionId,
      type: 'truck_price_update',
      validation
    });

    console.log(`区域 ${regionId} 价格表保存成功`);
    return true;
  } catch (error) {
    console.error('保存价格表失败:', error);
    return false;
  }
};

/**
 * 批量更新价格表
 * @param {Object} priceTables - 价格表集合
 * @returns {Object} 更新结果
 */
export const batchUpdatePriceTables = (priceTables) => {
  const results = {
    success: [],
    failed: [],
    summary: {
      total: Object.keys(priceTables).length,
      successCount: 0,
      failedCount: 0
    }
  };

  Object.entries(priceTables).forEach(([regionId, priceTable]) => {
    try {
      const success = savePriceTable(regionId, priceTable);
      if (success) {
        results.success.push({
          regionId,
          regionName: priceTable.regionName,
          rangeCount: priceTable.weightRanges?.length || 0
        });
        results.summary.successCount++;
      } else {
        results.failed.push({
          regionId,
          regionName: priceTable.regionName,
          error: '验证失败'
        });
        results.summary.failedCount++;
      }
    } catch (error) {
      results.failed.push({
        regionId,
        regionName: priceTable.regionName || '未知',
        error: error.message
      });
      results.summary.failedCount++;
    }
  });

  console.log('批量更新价格表完成:', results);
  return results;
};

/**
 * 删除区域价格表
 * @param {string} regionId - 区域ID
 * @returns {boolean} 删除是否成功
 */
export const deletePriceTable = (regionId) => {
  try {
    const allTables = getAllPriceTables();
    if (allTables[regionId]) {
      // 记录历史
      const settings = getPriceSettings();
      if (settings.enableHistory) {
        recordPriceHistory(regionId, allTables[regionId], 'delete');
      }

      delete allTables[regionId];
      localStorage.setItem(TRUCK_PRICE_STORAGE_KEYS.REGION_PRICES, JSON.stringify(allTables));
      
      // 触发数据更新通知
      dataUpdateNotifier.notifyRegionUpdate(regionId, 'priceDelete', {
        regionId,
        type: 'truck_price_delete'
      });

      console.log(`区域 ${regionId} 价格表删除成功`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('删除价格表失败:', error);
    return false;
  }
};

/**
 * 计算指定重量的配送价格
 * @param {string} regionId - 区域ID
 * @param {number} weight - 重量 (KGS)
 * @returns {Object|null} 价格信息或null
 */
export const calculatePrice = (regionId, weight) => {
  try {
    const priceTable = getPriceTable(regionId);
    if (!priceTable || !priceTable.isActive || !priceTable.weightRanges) {
      return null;
    }

    const activeRanges = priceTable.weightRanges.filter(range => range.isActive);
    
    for (const range of activeRanges) {
      if (weight >= range.min && weight <= range.max) {
        return {
          regionId,
          regionName: priceTable.regionName,
          weight,
          price: range.price,
          range: {
            id: range.id,
            min: range.min,
            max: range.max,
            label: range.label
          },
          currency: 'CAD',
          calculatedAt: new Date().toISOString()
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`计算价格失败:`, error);
    return null;
  }
};

/**
 * 获取价格设置
 * @returns {Object} 价格设置
 */
export const getPriceSettings = () => {
  try {
    const stored = localStorage.getItem(TRUCK_PRICE_STORAGE_KEYS.SETTINGS);
    if (stored) {
      return { ...DEFAULT_PRICE_SETTINGS, ...JSON.parse(stored) };
    }
    return DEFAULT_PRICE_SETTINGS;
  } catch (error) {
    console.error('获取价格设置失败:', error);
    return DEFAULT_PRICE_SETTINGS;
  }
};

/**
 * 保存价格设置
 * @param {Object} settings - 设置对象
 * @returns {boolean} 保存是否成功
 */
export const savePriceSettings = (settings) => {
  try {
    const updatedSettings = {
      ...getPriceSettings(),
      ...settings,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(TRUCK_PRICE_STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
    console.log('价格设置保存成功');
    return true;
  } catch (error) {
    console.error('保存价格设置失败:', error);
    return false;
  }
};

/**
 * 记录价格历史记录
 * @param {string} regionId - 区域ID
 * @param {TruckPriceTable} priceTable - 价格表
 * @param {string} action - 操作类型
 * @returns {boolean} 记录是否成功
 */
export const recordPriceHistory = (regionId, priceTable, action = 'update') => {
  try {
    const settings = getPriceSettings();
    if (!settings.enableHistory) {
      return false;
    }

    const historyKey = TRUCK_PRICE_STORAGE_KEYS.PRICE_HISTORY;
    const stored = localStorage.getItem(historyKey);
    let history = stored ? JSON.parse(stored) : {};

    if (!history[regionId]) {
      history[regionId] = [];
    }

    // 添加历史记录
    const record = {
      id: `${regionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      regionId,
      action,
      priceTable: JSON.parse(JSON.stringify(priceTable)), // 深拷贝
      timestamp: new Date().toISOString(),
      version: priceTable.metadata?.version || '1.0.0'
    };

    history[regionId].unshift(record);

    // 限制历史记录数量
    if (history[regionId].length > settings.maxHistoryRecords) {
      history[regionId] = history[regionId].slice(0, settings.maxHistoryRecords);
    }

    localStorage.setItem(historyKey, JSON.stringify(history));
    console.log(`价格历史记录添加成功: ${regionId} - ${action}`);
    return true;
  } catch (error) {
    console.error('记录价格历史失败:', error);
    return false;
  }
};

/**
 * 获取区域价格历史记录
 * @param {string} regionId - 区域ID
 * @param {number} limit - 记录数量限制
 * @returns {Array} 历史记录数组
 */
export const getPriceHistory = (regionId, limit = 50) => {
  try {
    const stored = localStorage.getItem(TRUCK_PRICE_STORAGE_KEYS.PRICE_HISTORY);
    if (!stored) {
      return [];
    }

    const history = JSON.parse(stored);
    const regionHistory = history[regionId] || [];
    
    return regionHistory.slice(0, limit);
  } catch (error) {
    console.error('获取价格历史失败:', error);
    return [];
  }
};

/**
 * 清除区域价格历史记录
 * @param {string} regionId - 区域ID
 * @returns {boolean} 清除是否成功
 */
export const clearPriceHistory = (regionId) => {
  try {
    const stored = localStorage.getItem(TRUCK_PRICE_STORAGE_KEYS.PRICE_HISTORY);
    if (!stored) {
      return true;
    }

    const history = JSON.parse(stored);
    if (history[regionId]) {
      delete history[regionId];
      localStorage.setItem(TRUCK_PRICE_STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(history));
      console.log(`区域 ${regionId} 价格历史清除成功`);
    }
    return true;
  } catch (error) {
    console.error('清除价格历史失败:', error);
    return false;
  }
};

/**
 * 获取价格存储统计信息
 * @returns {Object} 统计信息
 */
export const getPriceStorageStats = () => {
  try {
    const allTables = getAllPriceTables();
    const regionIds = Object.keys(allTables);
    
    let totalRanges = 0;
    let activeRanges = 0;
    let pricedRanges = 0;
    let activeRegions = 0;
    let totalPrice = 0;

    regionIds.forEach(regionId => {
      const table = allTables[regionId];
      if (table) {
        if (table.isActive) {
          activeRegions++;
        }
        
        if (table.weightRanges) {
          totalRanges += table.weightRanges.length;
          table.weightRanges.forEach(range => {
            if (range.isActive) {
              activeRanges++;
            }
            if (range.price > 0) {
              pricedRanges++;
              totalPrice += range.price;
            }
          });
        }
      }
    });

    return {
      regionCount: regionIds.length,
      activeRegions,
      totalRanges,
      activeRanges,
      pricedRanges,
      totalPrice,
      averagePrice: pricedRanges > 0 ? (totalPrice / pricedRanges).toFixed(2) : 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('获取价格存储统计失败:', error);
    return {
      regionCount: 0,
      activeRegions: 0,
      totalRanges: 0,
      activeRanges: 0,
      pricedRanges: 0,
      totalPrice: 0,
      averagePrice: 0,
      lastUpdated: new Date().toISOString()
    };
  }
};

/**
 * 导出价格表数据
 * @param {string[]} regionIds - 区域ID列表，为空时导出所有
 * @returns {Object} 导出数据
 */
export const exportPriceData = (regionIds = []) => {
  try {
    const allTables = getAllPriceTables();
    const targetRegions = regionIds.length > 0 ? regionIds : Object.keys(allTables);
    
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'truck_price_storage',
        regionCount: targetRegions.length
      },
      settings: getPriceSettings(),
      priceTables: {}
    };

    targetRegions.forEach(regionId => {
      if (allTables[regionId]) {
        exportData.priceTables[regionId] = allTables[regionId];
      }
    });

    return exportData;
  } catch (error) {
    console.error('导出价格数据失败:', error);
    return null;
  }
};

/**
 * 导入价格表数据
 * @param {Object} importData - 导入数据
 * @param {boolean} overwrite - 是否覆盖现有数据
 * @returns {Object} 导入结果
 */
export const importPriceData = (importData, overwrite = false) => {
  try {
    const results = {
      success: [],
      failed: [],
      skipped: [],
      summary: {
        total: 0,
        successCount: 0,
        failedCount: 0,
        skippedCount: 0
      }
    };

    if (!importData.priceTables || typeof importData.priceTables !== 'object') {
      return {
        ...results,
        error: '导入数据格式错误：缺少价格表数据'
      };
    }

    const existingTables = getAllPriceTables();
    const importRegions = Object.keys(importData.priceTables);
    results.summary.total = importRegions.length;

    importRegions.forEach(regionId => {
      try {
        const priceTable = importData.priceTables[regionId];
        
        // 检查是否已存在
        if (existingTables[regionId] && !overwrite) {
          results.skipped.push({
            regionId,
            regionName: priceTable.regionName,
            reason: '已存在且未选择覆盖'
          });
          results.summary.skippedCount++;
          return;
        }

        // 保存价格表
        const success = savePriceTable(regionId, priceTable);
        if (success) {
          results.success.push({
            regionId,
            regionName: priceTable.regionName,
            rangeCount: priceTable.weightRanges?.length || 0
          });
          results.summary.successCount++;
        } else {
          results.failed.push({
            regionId,
            regionName: priceTable.regionName,
            error: '保存失败'
          });
          results.summary.failedCount++;
        }
      } catch (error) {
        results.failed.push({
          regionId,
          regionName: importData.priceTables[regionId]?.regionName || '未知',
          error: error.message
        });
        results.summary.failedCount++;
      }
    });

    console.log('导入价格数据完成:', results);
    return results;
  } catch (error) {
    console.error('导入价格数据失败:', error);
    return {
      success: [],
      failed: [],
      skipped: [],
      summary: { total: 0, successCount: 0, failedCount: 1, skippedCount: 0 },
      error: error.message
    };
  }
};

export default {
  // 核心函数
  createDefaultPriceTable,
  validatePriceTable,
  getAllPriceTables,
  getPriceTable,
  savePriceTable,
  batchUpdatePriceTables,
  deletePriceTable,
  calculatePrice,
  
  // 设置管理
  getPriceSettings,
  savePriceSettings,
  
  // 历史记录
  recordPriceHistory,
  getPriceHistory,
  clearPriceHistory,
  
  // 统计和导入导出
  getPriceStorageStats,
  exportPriceData,
  importPriceData,
  
  // 常量
  TRUCK_PRICE_STORAGE_KEYS,
  DEFAULT_PRICE_SETTINGS
};