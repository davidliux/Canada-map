/**
 * 数据持久化管理
 * 解决数据丢失问题，提供多种数据存储和恢复方案
 * 支持localStorage和Vercel KV API存储
 */

import { storageAdapter } from './storageAdapter.js';

// 数据存储键名
const STORAGE_KEYS = {
  REGION_CONFIGS: 'regionConfigs',
  DATA_BACKUP: 'dataBackup',
  AUTO_BACKUP: 'autoBackup',
  LAST_BACKUP_TIME: 'lastBackupTime'
};

/**
 * 自动备份数据
 * 定期备份数据到存储系统
 */
export const autoBackupData = async () => {
  try {
    const backupName = `自动备份_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0]}`;
    const backupResult = await storageAdapter.createBackup(backupName, 'auto');

    console.log('📦 自动备份完成:', new Date().toLocaleString());
    return backupResult;
  } catch (error) {
    console.error('❌ 自动备份失败:', error);
    return false;
  }
};

/**
 * 手动备份数据
 * 创建完整的数据备份
 */
export const manualBackupData = async () => {
  try {
    const backupName = `手动备份_${new Date().toISOString().split('T')[0]}_${new Date().toTimeString().split(' ')[0]}`;
    const backupResult = await storageAdapter.createBackup(backupName, 'manual');

    console.log('💾 手动备份完成:', backupResult);
    return backupResult;
  } catch (error) {
    console.error('❌ 手动备份失败:', error);
    return null;
  }
};

/**
 * 导出数据到文件
 * 下载JSON格式的备份文件
 */
export const exportDataToFile = async () => {
  try {
    return await storageAdapter.exportDataToFile();
  } catch (error) {
    console.error('❌ 数据导出失败:', error);
    return false;
  }
};

/**
 * 从文件导入数据
 * 恢复JSON格式的备份文件
 */
export const importDataFromFile = async (file) => {
  try {
    return await storageAdapter.importDataFromFile(file);
  } catch (error) {
    console.error('❌ 数据导入失败:', error);
    throw error;
  }
};

/**
 * 恢复区域配置数据
 * 将备份数据恢复到系统中
 */
export const restoreRegionConfigs = (regionConfigs) => {
  try {
    let restoredCount = 0;
    let errorCount = 0;
    const errors = [];

    Object.entries(regionConfigs).forEach(([regionId, config]) => {
      try {
        // 验证和修复配置数据
        const validatedConfig = validateAndFixConfig(config, regionId);
        
        // 保存配置
        const success = saveRegionConfig(regionId, validatedConfig);
        if (success) {
          restoredCount++;
        } else {
          errorCount++;
          errors.push(`区域${regionId}保存失败`);
        }
      } catch (error) {
        errorCount++;
        errors.push(`区域${regionId}: ${error.message}`);
      }
    });

    const result = {
      success: restoredCount > 0,
      restoredCount,
      errorCount,
      errors,
      totalRegions: Object.keys(regionConfigs).length
    };

    console.log('🔄 数据恢复完成:', result);
    return result;
  } catch (error) {
    console.error('❌ 数据恢复失败:', error);
    throw error;
  }
};

/**
 * 验证和修复配置数据
 * 确保配置数据的完整性和正确性
 */
const validateAndFixConfig = (config, regionId) => {
  const fixedConfig = { ...config };

  // 确保基本字段存在
  if (!fixedConfig.regionId) {
    fixedConfig.regionId = regionId;
  }
  
  if (!fixedConfig.regionName) {
    fixedConfig.regionName = `${regionId}区`;
  }

  if (fixedConfig.isActive === undefined) {
    fixedConfig.isActive = true;
  }

  if (!fixedConfig.postalCodes) {
    fixedConfig.postalCodes = [];
  }

  if (!fixedConfig.weightRanges) {
    fixedConfig.weightRanges = [];
  }

  if (!fixedConfig.lastUpdated) {
    fixedConfig.lastUpdated = new Date().toISOString();
  }

  if (!fixedConfig.metadata) {
    fixedConfig.metadata = {
      version: '2.1.0',
      restoredAt: new Date().toISOString()
    };
  }

  // 验证重量区间数据
  if (fixedConfig.weightRanges) {
    fixedConfig.weightRanges = fixedConfig.weightRanges.map(range => ({
      ...range,
      isActive: range.isActive !== false, // 默认为true
      price: typeof range.price === 'number' ? range.price : 0
    }));
  }

  return fixedConfig;
};

/**
 * 计算数据统计信息
 */
const calculateDataStats = (regionConfigs) => {
  let totalRegions = 0;
  let activeRegions = 0;
  let totalFSAs = 0;
  let regionsWithPricing = 0;
  let totalWeightRanges = 0;

  Object.values(regionConfigs).forEach(config => {
    totalRegions++;
    
    if (config.isActive) {
      activeRegions++;
    }
    
    if (config.postalCodes) {
      totalFSAs += config.postalCodes.length;
    }
    
    if (config.weightRanges) {
      totalWeightRanges += config.weightRanges.length;
      if (config.weightRanges.some(r => r.isActive && r.price > 0)) {
        regionsWithPricing++;
      }
    }
  });

  return {
    totalRegions,
    activeRegions,
    totalFSAs,
    regionsWithPricing,
    totalWeightRanges
  };
};

/**
 * 检查数据完整性
 * 验证当前数据是否完整
 */
export const checkDataIntegrity = async () => {
  try {
    return await storageAdapter.checkDataIntegrity();
  } catch (error) {
    console.error('❌ 数据完整性检查失败:', error);
    return {
      isHealthy: false,
      stats: null,
      issues: [`检查失败: ${error.message}`],
      lastCheck: new Date().toISOString()
    };
  }
};

/**
 * 恢复默认演示数据
 * 当数据丢失时恢复基本的演示数据
 */
export const restoreDefaultDemoData = async () => {
  try {
    return await storageAdapter.restoreDefaultDemoData();
  } catch (error) {
    console.error('❌ 恢复默认演示数据失败:', error);
    throw error;
  }
};

/**
 * 启动自动备份
 * 定期自动备份数据
 */
export const startAutoBackup = (intervalMinutes = 30) => {
  // 立即执行一次备份
  autoBackupData();
  
  // 设置定期备份
  const intervalMs = intervalMinutes * 60 * 1000;
  const backupInterval = setInterval(autoBackupData, intervalMs);
  
  console.log(`🔄 自动备份已启动，间隔: ${intervalMinutes} 分钟`);
  
  // 返回清理函数
  return () => {
    clearInterval(backupInterval);
    console.log('🛑 自动备份已停止');
  };
};

export default {
  autoBackupData,
  manualBackupData,
  exportDataToFile,
  importDataFromFile,
  restoreRegionConfigs,
  checkDataIntegrity,
  restoreDefaultDemoData,
  startAutoBackup
};
