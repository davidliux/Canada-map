/**
 * Vercel KV (Redis) 存储服务
 * 替代localStorage，提供服务器端数据持久化
 */

import { kv } from '@vercel/kv';

// 数据键名常量
export const KV_KEYS = {
  REGION_CONFIGS: 'delivery:regions',
  SYSTEM_CONFIG: 'system:config',
  DATA_BACKUPS: 'data:backups',
  OPERATION_LOGS: 'system:logs',
  STATS_CACHE: 'cache:stats',
  LAST_BACKUP: 'system:last_backup'
};

// KV存储服务类
export class KVStorageService {
  constructor() {
    this.kv = kv;
  }

  /**
   * 获取所有区域配置
   */
  async getAllRegionConfigs() {
    try {
      const data = await this.kv.get(KV_KEYS.REGION_CONFIGS);
      return data || {};
    } catch (error) {
      console.error('获取区域配置失败:', error);
      return {};
    }
  }

  /**
   * 获取单个区域配置
   */
  async getRegionConfig(regionId) {
    try {
      const allConfigs = await this.getAllRegionConfigs();
      return allConfigs[regionId] || null;
    } catch (error) {
      console.error(`获取区域${regionId}配置失败:`, error);
      return null;
    }
  }

  /**
   * 保存区域配置
   */
  async saveRegionConfig(regionId, config) {
    try {
      const allConfigs = await this.getAllRegionConfigs();
      
      // 添加时间戳和版本信息
      const updatedConfig = {
        ...config,
        regionId,
        lastUpdated: new Date().toISOString(),
        metadata: {
          ...config.metadata,
          version: '2.1.0',
          updatedBy: 'system'
        }
      };

      allConfigs[regionId] = updatedConfig;
      
      await this.kv.set(KV_KEYS.REGION_CONFIGS, allConfigs);
      
      // 记录操作日志
      await this.logOperation('update', 'region_config', regionId, config);
      
      // 清除统计缓存
      await this.kv.del(KV_KEYS.STATS_CACHE);
      
      return updatedConfig;
    } catch (error) {
      console.error(`保存区域${regionId}配置失败:`, error);
      throw error;
    }
  }

  /**
   * 删除区域配置
   */
  async deleteRegionConfig(regionId) {
    try {
      const allConfigs = await this.getAllRegionConfigs();
      const deletedConfig = allConfigs[regionId];
      
      if (deletedConfig) {
        delete allConfigs[regionId];
        await this.kv.set(KV_KEYS.REGION_CONFIGS, allConfigs);
        
        // 记录操作日志
        await this.logOperation('delete', 'region_config', regionId, deletedConfig);
        
        // 清除统计缓存
        await this.kv.del(KV_KEYS.STATS_CACHE);
      }
      
      return true;
    } catch (error) {
      console.error(`删除区域${regionId}配置失败:`, error);
      throw error;
    }
  }

  /**
   * 批量保存区域配置
   */
  async saveAllRegionConfigs(configs) {
    try {
      const timestamp = new Date().toISOString();
      
      // 为每个配置添加元数据
      const processedConfigs = {};
      Object.entries(configs).forEach(([regionId, config]) => {
        processedConfigs[regionId] = {
          ...config,
          regionId,
          lastUpdated: timestamp,
          metadata: {
            ...config.metadata,
            version: '2.1.0',
            batchUpdated: true
          }
        };
      });

      await this.kv.set(KV_KEYS.REGION_CONFIGS, processedConfigs);
      
      // 记录操作日志
      await this.logOperation('batch_update', 'region_configs', 'all', processedConfigs);
      
      // 清除统计缓存
      await this.kv.del(KV_KEYS.STATS_CACHE);
      
      return processedConfigs;
    } catch (error) {
      console.error('批量保存区域配置失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据备份
   */
  async createBackup(backupName, backupType = 'manual') {
    try {
      const allConfigs = await this.getAllRegionConfigs();
      const systemConfig = await this.getSystemConfig();
      
      const backupData = {
        regionConfigs: allConfigs,
        systemConfig,
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        type: backupType,
        stats: await this.calculateStats(allConfigs)
      };

      const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const backupKey = `${KV_KEYS.DATA_BACKUPS}:${backupId}`;
      
      await this.kv.set(backupKey, backupData);
      
      // 更新备份列表
      const backupList = await this.getBackupList();
      backupList.push({
        id: backupId,
        name: backupName,
        type: backupType,
        timestamp: backupData.timestamp,
        stats: backupData.stats
      });
      
      // 保持最多50个备份
      if (backupList.length > 50) {
        const oldBackup = backupList.shift();
        await this.kv.del(`${KV_KEYS.DATA_BACKUPS}:${oldBackup.id}`);
      }
      
      await this.kv.set(`${KV_KEYS.DATA_BACKUPS}:list`, backupList);
      await this.kv.set(KV_KEYS.LAST_BACKUP, backupData.timestamp);
      
      // 记录操作日志
      await this.logOperation('backup', 'data_backup', backupId, { name: backupName, type: backupType });
      
      return {
        id: backupId,
        name: backupName,
        ...backupData
      };
    } catch (error) {
      console.error('创建备份失败:', error);
      throw error;
    }
  }

  /**
   * 获取备份列表
   */
  async getBackupList() {
    try {
      const list = await this.kv.get(`${KV_KEYS.DATA_BACKUPS}:list`);
      return list || [];
    } catch (error) {
      console.error('获取备份列表失败:', error);
      return [];
    }
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupId) {
    try {
      const backupKey = `${KV_KEYS.DATA_BACKUPS}:${backupId}`;
      const backupData = await this.kv.get(backupKey);
      
      if (!backupData) {
        throw new Error(`备份${backupId}不存在`);
      }

      // 恢复区域配置
      if (backupData.regionConfigs) {
        await this.kv.set(KV_KEYS.REGION_CONFIGS, backupData.regionConfigs);
      }

      // 恢复系统配置
      if (backupData.systemConfig) {
        await this.kv.set(KV_KEYS.SYSTEM_CONFIG, backupData.systemConfig);
      }

      // 清除缓存
      await this.kv.del(KV_KEYS.STATS_CACHE);

      // 记录操作日志
      await this.logOperation('restore', 'data_backup', backupId, backupData);

      return {
        success: true,
        restoredAt: new Date().toISOString(),
        backupInfo: {
          id: backupId,
          timestamp: backupData.timestamp,
          type: backupData.type
        }
      };
    } catch (error) {
      console.error(`恢复备份${backupId}失败:`, error);
      throw error;
    }
  }

  /**
   * 获取系统配置
   */
  async getSystemConfig() {
    try {
      const config = await this.kv.get(KV_KEYS.SYSTEM_CONFIG);
      return config || {
        version: '2.1.0',
        autoBackupEnabled: true,
        autoBackupInterval: 30,
        maxBackupCount: 50
      };
    } catch (error) {
      console.error('获取系统配置失败:', error);
      return {};
    }
  }

  /**
   * 保存系统配置
   */
  async saveSystemConfig(config) {
    try {
      const updatedConfig = {
        ...config,
        lastUpdated: new Date().toISOString()
      };
      
      await this.kv.set(KV_KEYS.SYSTEM_CONFIG, updatedConfig);
      return updatedConfig;
    } catch (error) {
      console.error('保存系统配置失败:', error);
      throw error;
    }
  }

  /**
   * 计算数据统计
   */
  async calculateStats(regionConfigs = null) {
    try {
      if (!regionConfigs) {
        regionConfigs = await this.getAllRegionConfigs();
      }

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

      const stats = {
        totalRegions,
        activeRegions,
        totalFSAs,
        regionsWithPricing,
        totalWeightRanges,
        lastCalculated: new Date().toISOString()
      };

      // 缓存统计数据
      await this.kv.set(KV_KEYS.STATS_CACHE, stats, { ex: 300 }); // 5分钟过期

      return stats;
    } catch (error) {
      console.error('计算统计数据失败:', error);
      return {
        totalRegions: 0,
        activeRegions: 0,
        totalFSAs: 0,
        regionsWithPricing: 0,
        totalWeightRanges: 0,
        error: error.message
      };
    }
  }

  /**
   * 获取缓存的统计数据
   */
  async getCachedStats() {
    try {
      const cachedStats = await this.kv.get(KV_KEYS.STATS_CACHE);
      if (cachedStats) {
        return cachedStats;
      }
      
      // 如果没有缓存，重新计算
      return await this.calculateStats();
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return await this.calculateStats();
    }
  }

  /**
   * 记录操作日志
   */
  async logOperation(operationType, resourceType, resourceId, data = null) {
    try {
      const logEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operationType,
        resourceType,
        resourceId,
        data,
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server'
      };

      const logKey = `${KV_KEYS.OPERATION_LOGS}:${logEntry.id}`;
      await this.kv.set(logKey, logEntry, { ex: 86400 * 30 }); // 30天过期

      return logEntry;
    } catch (error) {
      console.error('记录操作日志失败:', error);
      // 不抛出错误，避免影响主要操作
    }
  }

  /**
   * 清理过期数据
   */
  async cleanup() {
    try {
      // 这里可以添加清理逻辑，但KV会自动处理过期数据
      console.log('数据清理完成');
      return true;
    } catch (error) {
      console.error('数据清理失败:', error);
      return false;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const testKey = 'health_check_test';
      const testValue = { timestamp: new Date().toISOString() };
      
      await this.kv.set(testKey, testValue, { ex: 60 });
      const retrieved = await this.kv.get(testKey);
      await this.kv.del(testKey);
      
      return {
        healthy: !!retrieved,
        timestamp: new Date().toISOString(),
        latency: Date.now() - new Date(testValue.timestamp).getTime()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建单例实例
export const kvStorage = new KVStorageService();

export default kvStorage;
