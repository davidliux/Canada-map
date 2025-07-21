/**
 * API客户端 - 替代localStorage的服务器端数据访问
 * 统一管理所有API调用，提供与localStorage相同的接口
 */

// API基础配置
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://canada-map-oyu1.vercel.app/api'
  : '/api';

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API请求失败 [${options.method || 'GET'}] ${url}:`, error);
    throw error;
  }
}

/**
 * 区域配置API客户端
 */
export class RegionConfigAPI {
  /**
   * 获取所有区域配置
   */
  static async getAllRegionConfigs() {
    try {
      const response = await apiRequest('/regions?includeStats=true');
      return response.data.regions || {};
    } catch (error) {
      console.error('获取所有区域配置失败:', error);
      return {};
    }
  }

  /**
   * 获取单个区域配置
   */
  static async getRegionConfig(regionId) {
    try {
      const response = await apiRequest(`/regions/${regionId}`);
      return response.data;
    } catch (error) {
      console.error(`获取区域${regionId}配置失败:`, error);
      return null;
    }
  }

  /**
   * 保存区域配置
   */
  static async saveRegionConfig(regionId, config) {
    try {
      const response = await apiRequest(`/regions/${regionId}`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      return response.data;
    } catch (error) {
      console.error(`保存区域${regionId}配置失败:`, error);
      throw error;
    }
  }

  /**
   * 批量保存区域配置
   */
  static async saveAllRegionConfigs(configs) {
    try {
      const response = await apiRequest('/regions', {
        method: 'POST',
        body: JSON.stringify(configs),
      });
      return response.data.regions || configs;
    } catch (error) {
      console.error('批量保存区域配置失败:', error);
      throw error;
    }
  }

  /**
   * 删除区域配置
   */
  static async deleteRegionConfig(regionId) {
    try {
      const response = await apiRequest(`/regions/${regionId}`, {
        method: 'DELETE',
      });
      return response.success;
    } catch (error) {
      console.error(`删除区域${regionId}配置失败:`, error);
      throw error;
    }
  }

  /**
   * 获取数据统计
   */
  static async getDataStats() {
    try {
      const response = await apiRequest('/regions?includeStats=true');
      return response.data.stats || {};
    } catch (error) {
      console.error('获取数据统计失败:', error);
      return {};
    }
  }
}

/**
 * 备份恢复API客户端
 */
export class BackupAPI {
  /**
   * 获取备份列表
   */
  static async getBackupList() {
    try {
      const response = await apiRequest('/backup');
      return response.data || [];
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  /**
   * 创建备份
   */
  static async createBackup(name, type = 'manual') {
    try {
      const response = await apiRequest('/backup', {
        method: 'POST',
        body: JSON.stringify({ name, type }),
      });
      return response.data;
    } catch (error) {
      console.error('创建备份失败:', error);
      throw error;
    }
  }

  /**
   * 恢复备份
   */
  static async restoreBackup(backupId) {
    try {
      const response = await apiRequest('/backup/restore', {
        method: 'POST',
        body: JSON.stringify({ backupId, restoreType: 'backup' }),
      });
      return response.data;
    } catch (error) {
      console.error('恢复备份失败:', error);
      throw error;
    }
  }

  /**
   * 从数据恢复
   */
  static async restoreFromData(backupData) {
    try {
      const response = await apiRequest('/backup/restore', {
        method: 'POST',
        body: JSON.stringify({ backupData, restoreType: 'data' }),
      });
      return response.data;
    } catch (error) {
      console.error('从数据恢复失败:', error);
      throw error;
    }
  }

  /**
   * 恢复默认数据
   */
  static async restoreDefaultData() {
    try {
      const response = await apiRequest('/backup/restore', {
        method: 'POST',
        body: JSON.stringify({ restoreType: 'default' }),
      });
      return response.data;
    } catch (error) {
      console.error('恢复默认数据失败:', error);
      throw error;
    }
  }
}

/**
 * 兼容localStorage的统一数据访问层
 * 提供与原localStorage相同的接口，但使用API调用
 */
export class UnifiedStorageAPI {
  /**
   * 获取所有区域配置 (替代localStorage.getItem('regionConfigs'))
   */
  static async getAllRegionConfigs() {
    return await RegionConfigAPI.getAllRegionConfigs();
  }

  /**
   * 保存区域配置 (替代localStorage.setItem('regionConfigs', ...))
   */
  static async saveRegionConfig(regionId, config) {
    return await RegionConfigAPI.saveRegionConfig(regionId, config);
  }

  /**
   * 批量保存 (替代localStorage.setItem('regionConfigs', allConfigs))
   */
  static async saveAllRegionConfigs(configs) {
    return await RegionConfigAPI.saveAllRegionConfigs(configs);
  }

  /**
   * 删除区域配置
   */
  static async deleteRegionConfig(regionId) {
    return await RegionConfigAPI.deleteRegionConfig(regionId);
  }

  /**
   * 检查数据完整性
   */
  static async checkDataIntegrity() {
    try {
      const stats = await RegionConfigAPI.getDataStats();
      
      const issues = [];
      if (stats.totalRegions === 0) issues.push('没有找到任何区域配置');
      if (stats.totalFSAs < 10) issues.push(`FSA数量过少 (${stats.totalFSAs})，可能数据丢失`);
      if (stats.activeRegions === 0) issues.push('没有活跃的配送区域');
      if (stats.regionsWithPricing === 0) issues.push('没有区域配置了价格信息');

      return {
        isHealthy: issues.length === 0,
        stats,
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

  /**
   * 创建备份
   */
  static async createBackup(name, type = 'manual') {
    return await BackupAPI.createBackup(name, type);
  }

  /**
   * 恢复默认演示数据
   */
  static async restoreDefaultDemoData() {
    try {
      const result = await BackupAPI.restoreDefaultData();
      return {
        success: true,
        restoredCount: result.restoredRegions,
        stats: result.stats,
        type: 'default'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 导出数据到文件
   */
  static async exportDataToFile() {
    try {
      const allConfigs = await this.getAllRegionConfigs();
      const stats = await RegionConfigAPI.getDataStats();
      
      const exportData = {
        regionConfigs: allConfigs,
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        type: 'file_export',
        stats,
        metadata: {
          exportedBy: 'Canada Map Delivery System',
          exportDate: new Date().toLocaleString(),
          totalRegions: Object.keys(allConfigs).length
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `delivery-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('导出数据失败:', error);
      return false;
    }
  }

  /**
   * 从文件导入数据
   */
  static async importDataFromFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('未选择文件'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async function(e) {
        try {
          const importData = JSON.parse(e.target.result);
          const result = await BackupAPI.restoreFromData(importData);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsText(file);
    });
  }
}

// 导出默认实例
export default UnifiedStorageAPI;
