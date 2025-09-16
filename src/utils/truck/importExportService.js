/**
 * 卡车配送数据导入/导出服务
 * 
 * 提供完整的城市和区域配置数据的导入导出功能，包括：
 * - 导出所有城市和区域配置为JSON
 * - 导入JSON配置文件并验证
 * - 数据冲突检测和处理
 * - 支持部分导出（选定城市）
 * - 支持不同的导入模式（覆盖/跳过/合并）
 */

import { cityStorageService } from '../storage/cityStorage.js';
import { exportPriceData, importPriceData, getAllPriceTables } from '../storage/truckPriceStorage.js';
import { validateTruckDeliveryCity } from '../../types/truckDelivery.js';

/**
 * 导出数据格式定义
 * @typedef {Object} ExportData
 * @property {Object} metadata - 导出元数据
 * @property {Object[]} cities - 城市配置数组
 * @property {Object} priceTables - 价格表配置
 * @property {Object} settings - 系统设置
 */

/**
 * 导入结果定义
 * @typedef {Object} ImportResult
 * @property {Object[]} success - 成功导入的项目
 * @property {Object[]} failed - 导入失败的项目
 * @property {Object[]} skipped - 跳过的项目
 * @property {Object} summary - 统计摘要
 * @property {string[]} errors - 错误信息列表
 * @property {string[]} warnings - 警告信息列表
 */

/**
 * 导出模式枚举
 */
export const EXPORT_MODES = {
  ALL: 'all',           // 导出所有数据
  SELECTED: 'selected', // 导出选定城市
  ACTIVE_ONLY: 'active_only' // 仅导出激活的城市
};

/**
 * 导入模式枚举
 */
export const IMPORT_MODES = {
  OVERWRITE: 'overwrite', // 覆盖现有数据
  SKIP: 'skip',           // 跳过重复数据
  MERGE: 'merge'          // 合并数据
};

/**
 * 导出所有卡车配送数据
 * @param {Object} options - 导出选项
 * @param {string} options.mode - 导出模式
 * @param {string[]} options.cityIds - 选定的城市ID（仅在selected模式下使用）
 * @param {boolean} options.includePrices - 是否包含价格数据
 * @param {boolean} options.includeInactive - 是否包含非激活项目
 * @returns {Promise<ExportData>} 导出的数据
 */
export const exportTruckDeliveryData = async (options = {}) => {
  try {
    const {
      mode = EXPORT_MODES.ALL,
      cityIds = [],
      includePrices = true,
      includeInactive = true
    } = options;

    console.log('开始导出卡车配送数据:', options);

    // 获取所有城市数据
    let cities = await cityStorageService.getAllCities();
    
    // 根据导出模式筛选城市
    switch (mode) {
      case EXPORT_MODES.SELECTED:
        if (cityIds.length > 0) {
          cities = cities.filter(city => cityIds.includes(city.id));
        }
        break;
      case EXPORT_MODES.ACTIVE_ONLY:
        cities = cities.filter(city => city.isActive);
        break;
      case EXPORT_MODES.ALL:
      default:
        // 包含所有城市
        break;
    }

    // 获取完整的城市数据（包含区域信息）
    const fullCities = [];
    for (const city of cities) {
      const fullCity = await cityStorageService.getCity(city.id);
      if (fullCity) {
        // 根据includeInactive选项过滤区域
        if (!includeInactive && fullCity.regions) {
          fullCity.regions = fullCity.regions.filter(region => region.isActive !== false);
        }
        fullCities.push(fullCity);
      }
    }

    // 准备导出数据
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'truck_delivery_system',
        exportMode: mode,
        cityCount: fullCities.length,
        includePrices,
        includeInactive,
        exportedBy: 'ImportExportService'
      },
      cities: fullCities,
      priceTables: {},
      settings: {
        exportOptions: options
      }
    };

    // 导出价格表数据（如果需要）
    if (includePrices) {
      // 收集所有相关的区域ID
      const regionIds = [];
      fullCities.forEach(city => {
        if (city.regions) {
          city.regions.forEach(region => {
            if (region.id) {
              regionIds.push(region.id);
            }
          });
        }
      });

      // 导出相关的价格数据
      if (regionIds.length > 0) {
        const priceData = exportPriceData(regionIds);
        if (priceData && priceData.priceTables) {
          exportData.priceTables = priceData.priceTables;
          exportData.metadata.priceTableCount = Object.keys(priceData.priceTables).length;
        }
      }
    }

    console.log(`导出完成: ${fullCities.length} 个城市, ${Object.keys(exportData.priceTables).length} 个价格表`);
    return exportData;

  } catch (error) {
    console.error('导出卡车配送数据失败:', error);
    throw new Error(`导出失败: ${error.message}`);
  }
};

/**
 * 导入卡车配送数据
 * @param {ExportData} importData - 要导入的数据
 * @param {Object} options - 导入选项
 * @param {string} options.mode - 导入模式
 * @param {boolean} options.validateData - 是否验证数据
 * @param {boolean} options.importPrices - 是否导入价格数据
 * @param {Function} options.onProgress - 进度回调函数
 * @returns {Promise<ImportResult>} 导入结果
 */
export const importTruckDeliveryData = async (importData, options = {}) => {
  try {
    const {
      mode = IMPORT_MODES.SKIP,
      validateData = true,
      importPrices = true,
      onProgress = () => {}
    } = options;

    console.log('开始导入卡车配送数据:', { mode, validateData, importPrices });

    const result = {
      success: [],
      failed: [],
      skipped: [],
      summary: {
        totalCities: 0,
        totalPriceTables: 0,
        successCities: 0,
        failedCities: 0,
        skippedCities: 0,
        successPriceTables: 0,
        failedPriceTables: 0,
        skippedPriceTables: 0
      },
      errors: [],
      warnings: []
    };

    // 验证导入数据格式
    if (!importData || typeof importData !== 'object') {
      result.errors.push('导入数据格式错误');
      return result;
    }

    if (!Array.isArray(importData.cities)) {
      result.errors.push('导入数据中缺少城市数组');
      return result;
    }

    result.summary.totalCities = importData.cities.length;
    result.summary.totalPriceTables = importData.priceTables ? Object.keys(importData.priceTables).length : 0;

    // 导入城市数据
    let processedCities = 0;
    for (const cityData of importData.cities) {
      try {
        // 进度回调
        onProgress({
          type: 'city',
          current: processedCities + 1,
          total: importData.cities.length,
          item: cityData.name
        });

        // 数据验证（如果启用）
        if (validateData) {
          const validation = validateTruckDeliveryCity(cityData);
          if (!validation.isValid) {
            result.failed.push({
              type: 'city',
              id: cityData.id,
              name: cityData.name,
              error: `数据验证失败: ${validation.errors.join(', ')}`
            });
            result.summary.failedCities++;
            continue;
          }

          // 记录警告
          if (validation.warnings && validation.warnings.length > 0) {
            result.warnings.push(`城市 ${cityData.name}: ${validation.warnings.join(', ')}`);
          }
        }

        // 检查是否已存在
        const existingCity = await cityStorageService.getCity(cityData.id);
        
        if (existingCity && mode === IMPORT_MODES.SKIP) {
          result.skipped.push({
            type: 'city',
            id: cityData.id,
            name: cityData.name,
            reason: '城市已存在，跳过导入'
          });
          result.summary.skippedCities++;
          continue;
        }

        // 处理合并模式
        let finalCityData = cityData;
        if (existingCity && mode === IMPORT_MODES.MERGE) {
          finalCityData = await _mergeCityData(existingCity, cityData);
          result.warnings.push(`城市 ${cityData.name}: 已与现有数据合并`);
        }

        // 保存城市数据
        const saveSuccess = await cityStorageService.saveCity(finalCityData);
        
        if (saveSuccess) {
          result.success.push({
            type: 'city',
            id: cityData.id,
            name: cityData.name,
            action: existingCity ? '更新' : '新增',
            regionCount: cityData.regions?.length || 0
          });
          result.summary.successCities++;
        } else {
          result.failed.push({
            type: 'city',
            id: cityData.id,
            name: cityData.name,
            error: '保存城市数据失败'
          });
          result.summary.failedCities++;
        }

      } catch (error) {
        result.failed.push({
          type: 'city',
          id: cityData.id || 'unknown',
          name: cityData.name || '未知城市',
          error: error.message
        });
        result.summary.failedCities++;
      }

      processedCities++;
    }

    // 导入价格表数据（如果需要且存在）
    if (importPrices && importData.priceTables && Object.keys(importData.priceTables).length > 0) {
      try {
        const priceImportResult = importPriceData(
          { priceTables: importData.priceTables },
          mode === IMPORT_MODES.OVERWRITE
        );

        // 合并价格导入结果
        result.summary.successPriceTables = priceImportResult.summary.successCount;
        result.summary.failedPriceTables = priceImportResult.summary.failedCount;
        result.summary.skippedPriceTables = priceImportResult.summary.skippedCount;

        // 添加成功的价格表信息
        priceImportResult.success.forEach(item => {
          result.success.push({
            type: 'priceTable',
            id: item.regionId,
            name: item.regionName,
            action: '价格表导入',
            rangeCount: item.rangeCount
          });
        });

        // 添加失败的价格表信息
        priceImportResult.failed.forEach(item => {
          result.failed.push({
            type: 'priceTable',
            id: item.regionId,
            name: item.regionName,
            error: item.error
          });
        });

        // 添加跳过的价格表信息
        priceImportResult.skipped.forEach(item => {
          result.skipped.push({
            type: 'priceTable',
            id: item.regionId,
            name: item.regionName,
            reason: item.reason
          });
        });

      } catch (error) {
        result.errors.push(`价格表导入失败: ${error.message}`);
      }
    }

    console.log('导入完成:', result.summary);
    return result;

  } catch (error) {
    console.error('导入卡车配送数据失败:', error);
    return {
      success: [],
      failed: [],
      skipped: [],
      summary: {
        totalCities: 0,
        totalPriceTables: 0,
        successCities: 0,
        failedCities: 0,
        skippedCities: 0,
        successPriceTables: 0,
        failedPriceTables: 0,
        skippedPriceTables: 0
      },
      errors: [`导入过程发生错误: ${error.message}`],
      warnings: []
    };
  }
};

/**
 * 验证导入数据的完整性和格式
 * @param {Object} importData - 要验证的导入数据
 * @returns {Object} 验证结果
 */
export const validateImportData = (importData) => {
  const errors = [];
  const warnings = [];
  const stats = {
    cityCount: 0,
    priceTableCount: 0,
    regionCount: 0,
    fsaCount: 0
  };

  try {
    // 基本格式验证
    if (!importData || typeof importData !== 'object') {
      errors.push('导入数据必须是一个对象');
      return { isValid: false, errors, warnings, stats };
    }

    // 元数据验证
    if (!importData.metadata) {
      warnings.push('缺少导出元数据信息');
    } else {
      if (!importData.metadata.version) {
        warnings.push('缺少版本信息');
      }
      if (!importData.metadata.exportedAt) {
        warnings.push('缺少导出时间信息');
      }
    }

    // 城市数据验证
    if (!Array.isArray(importData.cities)) {
      errors.push('城市数据必须是数组格式');
    } else {
      stats.cityCount = importData.cities.length;
      
      importData.cities.forEach((city, index) => {
        if (!city.id || typeof city.id !== 'string') {
          errors.push(`城市 ${index + 1}: 缺少有效的ID`);
        }
        if (!city.name || typeof city.name !== 'string') {
          errors.push(`城市 ${index + 1}: 缺少有效的名称`);
        }
        
        if (city.regions && Array.isArray(city.regions)) {
          stats.regionCount += city.regions.length;
          
          city.regions.forEach(region => {
            if (region.fsaCodes && Array.isArray(region.fsaCodes)) {
              stats.fsaCount += region.fsaCodes.length;
            }
          });
        }
      });
    }

    // 价格表数据验证
    if (importData.priceTables && typeof importData.priceTables === 'object') {
      stats.priceTableCount = Object.keys(importData.priceTables).length;
      
      Object.entries(importData.priceTables).forEach(([regionId, priceTable]) => {
        if (!priceTable.regionId) {
          warnings.push(`价格表 ${regionId}: 缺少区域ID`);
        }
        if (!Array.isArray(priceTable.weightRanges)) {
          errors.push(`价格表 ${regionId}: 重量区间必须是数组`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`验证过程发生错误: ${error.message}`],
      warnings,
      stats
    };
  }
};

/**
 * 生成导出文件名
 * @param {string} prefix - 文件名前缀
 * @param {string} mode - 导出模式
 * @returns {string} 生成的文件名
 */
export const generateExportFileName = (prefix = 'truck_delivery', mode = 'all') => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  return `${prefix}_${mode}_${timestamp}.json`;
};

/**
 * 下载JSON数据文件
 * @param {Object} data - 要下载的数据
 * @param {string} filename - 文件名
 */
export const downloadJsonFile = (data, filename) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`文件下载成功: ${filename}`);
  } catch (error) {
    console.error('下载文件失败:', error);
    throw error;
  }
};

/**
 * 读取上传的JSON文件
 * @param {File} file - 上传的文件对象
 * @returns {Promise<Object>} 解析后的JSON数据
 */
export const readJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('未选择文件'));
      return;
    }

    if (!file.type || !file.type.includes('json')) {
      reject(new Error('文件类型必须是JSON格式'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error(`JSON格式错误: ${error.message}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsText(file);
  });
};

/**
 * 获取导入/导出统计信息
 * @returns {Promise<Object>} 统计信息
 */
export const getImportExportStats = async () => {
  try {
    const cities = await cityStorageService.getAllCities();
    const allPriceTables = getAllPriceTables();
    
    const activeCities = cities.filter(city => city.isActive);
    const activePriceTables = Object.values(allPriceTables).filter(table => table.isActive);
    
    return {
      cities: {
        total: cities.length,
        active: activeCities.length,
        inactive: cities.length - activeCities.length
      },
      priceTables: {
        total: Object.keys(allPriceTables).length,
        active: activePriceTables.length,
        inactive: Object.keys(allPriceTables).length - activePriceTables.length
      },
      storage: {
        totalFSAs: cities.reduce((sum, city) => sum + (city.totalFSAs || 0), 0),
        totalRegions: cities.reduce((sum, city) => sum + (city.regionCount || 0), 0)
      },
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return {
      cities: { total: 0, active: 0, inactive: 0 },
      priceTables: { total: 0, active: 0, inactive: 0 },
      storage: { totalFSAs: 0, totalRegions: 0 },
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }
};

// === 私有辅助函数 ===

/**
 * 合并城市数据
 * @private
 * @param {Object} existingCity - 现有城市数据
 * @param {Object} newCity - 新城市数据
 * @returns {Promise<Object>} 合并后的城市数据
 */
const _mergeCityData = async (existingCity, newCity) => {
  try {
    // 基本信息优先使用新数据
    const mergedCity = {
      ...existingCity,
      ...newCity,
      id: existingCity.id, // 保持原有ID
      metadata: {
        ...existingCity.metadata,
        ...newCity.metadata,
        mergedAt: new Date().toISOString(),
        originalVersion: existingCity.metadata?.version || '1.0.0'
      }
    };

    // 合并区域数据
    if (newCity.regions && Array.isArray(newCity.regions)) {
      const existingRegionMap = new Map();
      if (existingCity.regions) {
        existingCity.regions.forEach(region => {
          existingRegionMap.set(region.id, region);
        });
      }

      // 合并区域，新区域覆盖同ID的旧区域
      const mergedRegions = [];
      newCity.regions.forEach(newRegion => {
        mergedRegions.push(newRegion);
        existingRegionMap.delete(newRegion.id);
      });

      // 添加未被覆盖的现有区域
      existingRegionMap.forEach(region => {
        mergedRegions.push(region);
      });

      mergedCity.regions = mergedRegions;
    }

    return mergedCity;
  } catch (error) {
    console.error('合并城市数据失败:', error);
    // 出错时返回新数据
    return newCity;
  }
};

// 导出所有功能
export default {
  // 核心功能
  exportTruckDeliveryData,
  importTruckDeliveryData,
  validateImportData,
  
  // 辅助功能
  generateExportFileName,
  downloadJsonFile,
  readJsonFile,
  getImportExportStats,
  
  // 常量
  EXPORT_MODES,
  IMPORT_MODES
};