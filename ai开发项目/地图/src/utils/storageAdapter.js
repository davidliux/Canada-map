/**
 * 存储适配器 - 统一localStorage和API存储
 * 根据环境自动选择使用localStorage还是Vercel KV API
 */

import { UnifiedStorageAPI } from './apiClient.js';
import { shouldUseAPIStorage, getEnvironmentConfig, logEnvironmentConfig } from './envConfig.js';

// 获取环境配置
const envConfig = getEnvironmentConfig();
const shouldUseAPI = shouldUseAPIStorage();

// 输出配置信息
logEnvironmentConfig();

/**
 * 存储适配器类
 * 提供统一的存储接口，自动选择localStorage或API
 */
export class StorageAdapter {
  constructor() {
    this.useAPI = shouldUseAPI;
    this.fallbackToLocalStorage = true; // API失败时是否回退到localStorage
  }

  /**
   * 获取所有区域配置
   */
  async getAllRegionConfigs() {
    if (this.useAPI) {
      try {
        console.log('使用API获取区域配置...');
        const configs = await UnifiedStorageAPI.getAllRegionConfigs();
        console.log('API获取成功:', Object.keys(configs).length, '个区域');
        return configs;
      } catch (error) {
        console.error('API获取失败:', error);
        if (this.fallbackToLocalStorage) {
          console.log('回退到localStorage...');
          return this.getLocalStorageConfigs();
        }
        throw error;
      }
    } else {
      console.log('使用localStorage获取区域配置...');
      return this.getLocalStorageConfigs();
    }
  }

  /**
   * 保存区域配置
   */
  async saveRegionConfig(regionId, config) {
    if (this.useAPI) {
      try {
        console.log(`使用API保存区域${regionId}配置...`);
        const result = await UnifiedStorageAPI.saveRegionConfig(regionId, config);
        console.log('API保存成功');
        
        // 同时保存到localStorage作为备份
        if (this.fallbackToLocalStorage) {
          this.saveLocalStorageConfig(regionId, config);
        }
        
        return result;
      } catch (error) {
        console.error('API保存失败:', error);
        if (this.fallbackToLocalStorage) {
          console.log('回退到localStorage保存...');
          return this.saveLocalStorageConfig(regionId, config);
        }
        throw error;
      }
    } else {
      console.log(`使用localStorage保存区域${regionId}配置...`);
      return this.saveLocalStorageConfig(regionId, config);
    }
  }

  /**
   * 批量保存区域配置
   */
  async saveAllRegionConfigs(configs) {
    if (this.useAPI) {
      try {
        console.log('使用API批量保存区域配置...', Object.keys(configs).length, '个区域');
        const result = await UnifiedStorageAPI.saveAllRegionConfigs(configs);
        console.log('API批量保存成功');
        
        // 同时保存到localStorage作为备份
        if (this.fallbackToLocalStorage) {
          this.saveLocalStorageConfigs(configs);
        }
        
        return result;
      } catch (error) {
        console.error('API批量保存失败:', error);
        if (this.fallbackToLocalStorage) {
          console.log('回退到localStorage批量保存...');
          return this.saveLocalStorageConfigs(configs);
        }
        throw error;
      }
    } else {
      console.log('使用localStorage批量保存区域配置...');
      return this.saveLocalStorageConfigs(configs);
    }
  }

  /**
   * 删除区域配置
   */
  async deleteRegionConfig(regionId) {
    if (this.useAPI) {
      try {
        console.log(`使用API删除区域${regionId}配置...`);
        const result = await UnifiedStorageAPI.deleteRegionConfig(regionId);
        console.log('API删除成功');
        
        // 同时从localStorage删除
        if (this.fallbackToLocalStorage) {
          this.deleteLocalStorageConfig(regionId);
        }
        
        return result;
      } catch (error) {
        console.error('API删除失败:', error);
        if (this.fallbackToLocalStorage) {
          console.log('回退到localStorage删除...');
          return this.deleteLocalStorageConfig(regionId);
        }
        throw error;
      }
    } else {
      console.log(`使用localStorage删除区域${regionId}配置...`);
      return this.deleteLocalStorageConfig(regionId);
    }
  }

  /**
   * 检查数据完整性
   */
  async checkDataIntegrity() {
    if (this.useAPI) {
      try {
        return await UnifiedStorageAPI.checkDataIntegrity();
      } catch (error) {
        console.error('API数据完整性检查失败:', error);
        if (this.fallbackToLocalStorage) {
          return this.checkLocalStorageIntegrity();
        }
        throw error;
      }
    } else {
      return this.checkLocalStorageIntegrity();
    }
  }

  /**
   * 创建备份
   */
  async createBackup(name, type = 'manual') {
    if (this.useAPI) {
      try {
        return await UnifiedStorageAPI.createBackup(name, type);
      } catch (error) {
        console.error('API创建备份失败:', error);
        throw error;
      }
    } else {
      // localStorage环境下的备份逻辑
      const configs = this.getLocalStorageConfigs();
      const backupData = {
        regionConfigs: configs,
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        type
      };
      
      const backupKey = `backup_${Date.now()}_${name}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      return {
        id: backupKey,
        name,
        ...backupData
      };
    }
  }

  /**
   * 恢复默认演示数据
   */
  async restoreDefaultDemoData() {
    if (this.useAPI) {
      try {
        return await UnifiedStorageAPI.restoreDefaultDemoData();
      } catch (error) {
        console.error('API恢复默认数据失败:', error);
        if (this.fallbackToLocalStorage) {
          return this.restoreLocalStorageDefaultData();
        }
        throw error;
      }
    } else {
      return this.restoreLocalStorageDefaultData();
    }
  }

  /**
   * 导出数据
   */
  async exportDataToFile() {
    if (this.useAPI) {
      try {
        return await UnifiedStorageAPI.exportDataToFile();
      } catch (error) {
        console.error('API导出数据失败:', error);
        if (this.fallbackToLocalStorage) {
          return this.exportLocalStorageData();
        }
        throw error;
      }
    } else {
      return this.exportLocalStorageData();
    }
  }

  /**
   * 从文件导入数据
   */
  async importDataFromFile(file) {
    if (this.useAPI) {
      try {
        return await UnifiedStorageAPI.importDataFromFile(file);
      } catch (error) {
        console.error('API导入数据失败:', error);
        if (this.fallbackToLocalStorage) {
          return this.importLocalStorageData(file);
        }
        throw error;
      }
    } else {
      return this.importLocalStorageData(file);
    }
  }

  // ========== localStorage 实现方法 ==========

  getLocalStorageConfigs() {
    try {
      const data = localStorage.getItem('regionConfigs');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('localStorage读取失败:', error);
      return {};
    }
  }

  saveLocalStorageConfig(regionId, config) {
    try {
      const allConfigs = this.getLocalStorageConfigs();
      allConfigs[regionId] = {
        ...config,
        regionId,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('regionConfigs', JSON.stringify(allConfigs));
      return allConfigs[regionId];
    } catch (error) {
      console.error('localStorage保存失败:', error);
      throw error;
    }
  }

  saveLocalStorageConfigs(configs) {
    try {
      const timestamp = new Date().toISOString();
      const processedConfigs = {};
      
      Object.entries(configs).forEach(([regionId, config]) => {
        processedConfigs[regionId] = {
          ...config,
          regionId,
          lastUpdated: timestamp
        };
      });
      
      localStorage.setItem('regionConfigs', JSON.stringify(processedConfigs));
      return processedConfigs;
    } catch (error) {
      console.error('localStorage批量保存失败:', error);
      throw error;
    }
  }

  deleteLocalStorageConfig(regionId) {
    try {
      const allConfigs = this.getLocalStorageConfigs();
      delete allConfigs[regionId];
      localStorage.setItem('regionConfigs', JSON.stringify(allConfigs));
      return true;
    } catch (error) {
      console.error('localStorage删除失败:', error);
      throw error;
    }
  }

  checkLocalStorageIntegrity() {
    try {
      const configs = this.getLocalStorageConfigs();
      let totalRegions = 0;
      let activeRegions = 0;
      let totalFSAs = 0;
      let regionsWithPricing = 0;

      Object.values(configs).forEach(config => {
        totalRegions++;
        if (config.isActive) activeRegions++;
        if (config.postalCodes) totalFSAs += config.postalCodes.length;
        if (config.weightRanges && config.weightRanges.some(r => r.isActive && r.price > 0)) {
          regionsWithPricing++;
        }
      });

      const issues = [];
      if (totalRegions === 0) issues.push('没有找到任何区域配置');
      if (totalFSAs < 10) issues.push(`FSA数量过少 (${totalFSAs})，可能数据丢失`);
      if (activeRegions === 0) issues.push('没有活跃的配送区域');
      if (regionsWithPricing === 0) issues.push('没有区域配置了价格信息');

      return {
        isHealthy: issues.length === 0,
        stats: { totalRegions, activeRegions, totalFSAs, regionsWithPricing },
        issues,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        isHealthy: false,
        stats: null,
        issues: [`检查失败: ${error.message}`],
        lastCheck: new Date().toISOString()
      };
    }
  }

  restoreLocalStorageDefaultData() {
    // 这里可以实现localStorage的默认数据恢复逻辑
    // 暂时返回一个简单的成功响应
    return {
      success: true,
      restoredCount: 0,
      message: 'localStorage环境下的默认数据恢复'
    };
  }

  exportLocalStorageData() {
    // localStorage导出逻辑
    try {
      const configs = this.getLocalStorageConfigs();
      const exportData = {
        regionConfigs: configs,
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        type: 'localStorage_export'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-data-localStorage-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('localStorage导出失败:', error);
      return false;
    }
  }

  importLocalStorageData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const configs = data.regionConfigs || data;
          this.saveLocalStorageConfigs(configs);
          resolve({
            success: true,
            restoredCount: Object.keys(configs).length
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
  }
}

// 创建单例实例
export const storageAdapter = new StorageAdapter();

export default storageAdapter;
