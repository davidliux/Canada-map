/**
 * 数据迁移工具
 * 处理从LocalStorage到文件系统的数据迁移
 * 确保数据兼容性和完整性
 */

import { 
  getAllRegionConfigs, 
  saveAllRegionConfigs,
  createDefaultRegionConfig 
} from './unifiedStorage.js';
import { readFromFile, writeToFile } from './persistentStorage.js';

/**
 * 执行完整的数据迁移
 * @returns {Object} 迁移结果
 */
export const performDataMigration = async () => {
  console.log('🔄 开始数据迁移...');
  
  const migrationResult = {
    success: false,
    migratedRegions: 0,
    totalPostalCodes: 0,
    errors: [],
    warnings: []
  };

  try {
    // 1. 检查是否已有文件系统数据
    const existingFileData = await readFromFile();
    if (existingFileData && Object.keys(existingFileData).length > 0) {
      console.log('✅ 文件系统已有数据，跳过迁移');
      migrationResult.success = true;
      migrationResult.message = '文件系统已有数据，无需迁移';
      return migrationResult;
    }

    // 2. 从LocalStorage读取现有数据
    const localStorageData = readFromLocalStorage();
    
    // 3. 迁移旧格式数据
    const migratedData = await migrateFromLegacyFormats();
    
    // 4. 合并数据
    const finalData = mergeDataSources(localStorageData, migratedData);
    
    // 5. 验证和清理数据
    const cleanedData = validateAndCleanData(finalData);
    
    // 6. 保存到文件系统
    if (Object.keys(cleanedData).length > 0) {
      const saveSuccess = await writeToFile(cleanedData);
      if (saveSuccess) {
        migrationResult.success = true;
        migrationResult.migratedRegions = Object.keys(cleanedData).length;
        migrationResult.totalPostalCodes = Object.values(cleanedData)
          .reduce((total, region) => total + (region.postalCodes?.length || 0), 0);
        
        console.log(`✅ 数据迁移成功: ${migrationResult.migratedRegions} 个区域, ${migrationResult.totalPostalCodes} 个邮编`);
      } else {
        migrationResult.errors.push('保存到文件系统失败');
      }
    } else {
      // 如果没有数据，创建默认配置
      const defaultData = createDefaultRegionConfigs();
      const saveSuccess = await writeToFile(defaultData);
      if (saveSuccess) {
        migrationResult.success = true;
        migrationResult.message = '创建默认配置成功';
      }
    }

  } catch (error) {
    console.error('数据迁移失败:', error);
    migrationResult.errors.push(error.message);
  }

  return migrationResult;
};

/**
 * 从LocalStorage读取数据
 */
const readFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('unified_region_data');
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.warn('从LocalStorage读取失败:', error);
    return {};
  }
};

/**
 * 迁移旧格式数据
 */
const migrateFromLegacyFormats = async () => {
  const migratedData = {};
  
  try {
    // 迁移旧的FSA配置
    const fsaConfigs = localStorage.getItem('fsa_configurations');
    if (fsaConfigs) {
      const parsedConfigs = JSON.parse(fsaConfigs);
      console.log('📦 发现旧FSA配置数据');
      
      Object.keys(parsedConfigs).forEach(regionId => {
        const oldConfig = parsedConfigs[regionId];
        if (oldConfig && oldConfig.fsaCodes) {
          migratedData[regionId] = {
            ...createDefaultRegionConfig(regionId, `区域${regionId}`),
            isActive: oldConfig.isActive || false,
            postalCodes: oldConfig.fsaCodes || [],
            weightRanges: oldConfig.weightRanges || createDefaultRegionConfig(regionId).weightRanges,
            lastUpdated: oldConfig.lastUpdated || new Date().toISOString(),
            metadata: {
              ...createDefaultRegionConfig(regionId).metadata,
              migratedFrom: 'fsa_configurations',
              migratedAt: new Date().toISOString()
            }
          };
        }
      });
    }

    // 迁移区域邮编数据
    for (let i = 1; i <= 8; i++) {
      const regionKey = `region_${i}_postal_codes`;
      const regionData = localStorage.getItem(regionKey);
      if (regionData) {
        const parsedData = JSON.parse(regionData);
        console.log(`📦 发现区域${i}邮编数据`);
        
        if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
          if (!migratedData[i.toString()]) {
            migratedData[i.toString()] = createDefaultRegionConfig(i.toString(), `区域${i}`);
          }
          
          // 合并邮编数据
          const existingCodes = migratedData[i.toString()].postalCodes || [];
          const newCodes = parsedData.filter(code => !existingCodes.includes(code));
          migratedData[i.toString()].postalCodes = [...existingCodes, ...newCodes];
          migratedData[i.toString()].isActive = true;
          migratedData[i.toString()].metadata.migratedFrom = regionKey;
          migratedData[i.toString()].metadata.migratedAt = new Date().toISOString();
        }
      }
    }

  } catch (error) {
    console.warn('迁移旧格式数据失败:', error);
  }

  return migratedData;
};

/**
 * 合并多个数据源
 */
const mergeDataSources = (localStorageData, legacyData) => {
  const merged = { ...legacyData };
  
  // LocalStorage数据优先级更高
  Object.keys(localStorageData).forEach(regionId => {
    if (localStorageData[regionId]) {
      merged[regionId] = localStorageData[regionId];
    }
  });
  
  return merged;
};

/**
 * 验证和清理数据
 */
const validateAndCleanData = (data) => {
  const cleaned = {};
  
  Object.keys(data).forEach(regionId => {
    const regionData = data[regionId];
    
    if (regionData && typeof regionData === 'object') {
      // 确保必要字段存在
      const cleanedRegion = {
        id: regionId,
        name: regionData.name || `区域${regionId}`,
        isActive: Boolean(regionData.isActive),
        postalCodes: Array.isArray(regionData.postalCodes) ? 
          regionData.postalCodes.filter(code => code && typeof code === 'string') : [],
        weightRanges: Array.isArray(regionData.weightRanges) ? 
          regionData.weightRanges : createDefaultRegionConfig(regionId).weightRanges,
        lastUpdated: regionData.lastUpdated || new Date().toISOString(),
        metadata: {
          createdAt: regionData.metadata?.createdAt || new Date().toISOString(),
          version: '2.0.0',
          notes: regionData.metadata?.notes || '',
          totalPostalCodes: 0,
          ...regionData.metadata
        }
      };
      
      // 更新邮编计数
      cleanedRegion.metadata.totalPostalCodes = cleanedRegion.postalCodes.length;
      
      cleaned[regionId] = cleanedRegion;
    }
  });
  
  return cleaned;
};

/**
 * 创建默认区域配置
 */
const createDefaultRegionConfigs = () => {
  const configs = {};
  for (let i = 1; i <= 8; i++) {
    configs[i.toString()] = createDefaultRegionConfig(i.toString(), `区域${i}`);
  }
  return configs;
};

/**
 * 检查迁移状态
 */
export const checkMigrationStatus = async () => {
  try {
    // 检查文件系统是否有数据
    const fileData = await readFromFile();
    const hasFileData = fileData && Object.keys(fileData).length > 0;
    
    // 检查LocalStorage是否有数据
    const localData = readFromLocalStorage();
    const hasLocalData = localData && Object.keys(localData).length > 0;
    
    // 检查旧格式数据
    const hasLegacyData = checkForLegacyData();
    
    return {
      hasFileData,
      hasLocalData,
      hasLegacyData,
      needsMigration: !hasFileData && (hasLocalData || hasLegacyData)
    };
  } catch (error) {
    console.error('检查迁移状态失败:', error);
    return {
      hasFileData: false,
      hasLocalData: false,
      hasLegacyData: false,
      needsMigration: false,
      error: error.message
    };
  }
};

/**
 * 检查是否存在旧格式数据
 */
const checkForLegacyData = () => {
  try {
    // 检查旧的FSA配置
    const fsaConfigs = localStorage.getItem('fsa_configurations');
    if (fsaConfigs) return true;
    
    // 检查区域邮编数据
    for (let i = 1; i <= 8; i++) {
      const regionKey = `region_${i}_postal_codes`;
      if (localStorage.getItem(regionKey)) return true;
    }
    
    return false;
  } catch (error) {
    console.warn('检查旧格式数据失败:', error);
    return false;
  }
};

/**
 * 清理旧数据（迁移完成后调用）
 */
export const cleanupLegacyData = () => {
  try {
    const keysToRemove = ['fsa_configurations'];
    
    // 添加区域邮编键
    for (let i = 1; i <= 8; i++) {
      keysToRemove.push(`region_${i}_postal_codes`);
    }
    
    keysToRemove.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`清理旧数据: ${key}`);
      }
    });
    
    console.log('✅ 旧数据清理完成');
    return true;
  } catch (error) {
    console.error('清理旧数据失败:', error);
    return false;
  }
};
