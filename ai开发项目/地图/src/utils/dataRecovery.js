/**
 * 数据恢复工具
 * 用于恢复因数据同步更新而丢失的区域配置数据
 */

import { 
  getAllRegionConfigs, 
  saveAllRegionConfigs, 
  createDefaultRegionConfig,
  UNIFIED_STORAGE_KEYS 
} from './unifiedStorage';

/**
 * 检查并恢复旧的区域配置数据
 */
export const recoverLegacyData = () => {
  console.log('🔄 开始数据恢复检查...');
  
  try {
    // 检查当前统一存储数据
    const currentData = getAllRegionConfigs();
    const hasValidData = Object.keys(currentData).some(regionId => {
      const config = currentData[regionId];
      return config && config.postalCodes && config.postalCodes.length > 0;
    });

    if (hasValidData) {
      console.log('✅ 统一存储数据完整，无需恢复');
      return { success: true, message: '数据完整，无需恢复' };
    }

    console.log('⚠️ 检测到数据丢失，开始恢复...');

    // 尝试从旧的存储格式恢复数据
    const recoveredData = {};
    let totalRecovered = 0;

    // 恢复旧的FSA配置数据
    try {
      const fsaConfigs = localStorage.getItem('fsa_configurations');
      if (fsaConfigs) {
        const parsedConfigs = JSON.parse(fsaConfigs);
        console.log('📦 发现旧FSA配置数据:', parsedConfigs);
        
        Object.keys(parsedConfigs).forEach(regionId => {
          const oldConfig = parsedConfigs[regionId];
          if (oldConfig && oldConfig.fsaCodes) {
            recoveredData[regionId] = {
              ...createDefaultRegionConfig(regionId, `区域${regionId}`),
              isActive: oldConfig.isActive || false,
              postalCodes: oldConfig.fsaCodes || [],
              weightRanges: oldConfig.weightRanges || createDefaultRegionConfig(regionId).weightRanges,
              lastUpdated: oldConfig.lastUpdated || new Date().toISOString(),
              metadata: {
                ...createDefaultRegionConfig(regionId).metadata,
                recoveredFrom: 'fsa_configurations',
                recoveredAt: new Date().toISOString()
              }
            };
            totalRecovered += oldConfig.fsaCodes?.length || 0;
          }
        });
      }
    } catch (error) {
      console.warn('恢复FSA配置数据失败:', error);
    }

    // 恢复区域邮编数据
    for (let i = 1; i <= 8; i++) {
      try {
        const regionKey = `region_${i}_postal_codes`;
        const regionData = localStorage.getItem(regionKey);
        if (regionData) {
          const parsedData = JSON.parse(regionData);
          console.log(`📦 发现区域${i}邮编数据:`, parsedData);
          
          if (parsedData && Array.isArray(parsedData) && parsedData.length > 0) {
            if (!recoveredData[i.toString()]) {
              recoveredData[i.toString()] = createDefaultRegionConfig(i.toString(), `区域${i}`);
            }
            
            recoveredData[i.toString()].postalCodes = parsedData;
            recoveredData[i.toString()].isActive = true; // 有数据的区域默认激活
            recoveredData[i.toString()].metadata.recoveredFrom = regionKey;
            recoveredData[i.toString()].metadata.recoveredAt = new Date().toISOString();
            totalRecovered += parsedData.length;
          }
        }
      } catch (error) {
        console.warn(`恢复区域${i}数据失败:`, error);
      }
    }

    // 如果没有恢复到任何数据，创建默认配置
    if (Object.keys(recoveredData).length === 0) {
      console.log('📝 创建默认区域配置...');
      for (let i = 1; i <= 8; i++) {
        recoveredData[i.toString()] = createDefaultRegionConfig(i.toString(), `区域${i}`);
      }
    }

    // 保存恢复的数据
    const saveSuccess = saveAllRegionConfigs(recoveredData);
    
    if (saveSuccess) {
      console.log(`✅ 数据恢复成功！恢复了 ${totalRecovered} 个FSA配置`);
      
      // 创建备份
      const backupKey = `${UNIFIED_STORAGE_KEYS.BACKUP_PREFIX}${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(recoveredData));
      
      return {
        success: true,
        message: `数据恢复成功！恢复了 ${totalRecovered} 个FSA配置`,
        recoveredRegions: Object.keys(recoveredData).length,
        totalFSAs: totalRecovered
      };
    } else {
      throw new Error('保存恢复数据失败');
    }

  } catch (error) {
    console.error('❌ 数据恢复失败:', error);
    return {
      success: false,
      message: `数据恢复失败: ${error.message}`,
      error: error
    };
  }
};

/**
 * 强制重置所有区域配置为默认状态
 */
export const resetToDefaultConfig = () => {
  console.log('🔄 重置为默认配置...');
  
  try {
    const defaultData = {};
    for (let i = 1; i <= 8; i++) {
      defaultData[i.toString()] = createDefaultRegionConfig(i.toString(), `区域${i}`);
    }

    const success = saveAllRegionConfigs(defaultData);
    
    if (success) {
      console.log('✅ 重置为默认配置成功');
      return { success: true, message: '重置为默认配置成功' };
    } else {
      throw new Error('保存默认配置失败');
    }
  } catch (error) {
    console.error('❌ 重置配置失败:', error);
    return { success: false, message: `重置配置失败: ${error.message}` };
  }
};

/**
 * 检查数据完整性
 */
export const checkDataIntegrity = () => {
  const configs = getAllRegionConfigs();
  const report = {
    totalRegions: 0,
    activeRegions: 0,
    totalFSAs: 0,
    regionsWithData: 0,
    issues: []
  };

  Object.keys(configs).forEach(regionId => {
    const config = configs[regionId];
    report.totalRegions++;
    
    if (config.isActive) {
      report.activeRegions++;
    }
    
    if (config.postalCodes && config.postalCodes.length > 0) {
      report.regionsWithData++;
      report.totalFSAs += config.postalCodes.length;
    }
    
    // 检查配置完整性
    if (!config.weightRanges || config.weightRanges.length === 0) {
      report.issues.push(`区域${regionId}: 缺少重量区间配置`);
    }
    
    if (!config.lastUpdated) {
      report.issues.push(`区域${regionId}: 缺少更新时间`);
    }
  });

  return report;
};
