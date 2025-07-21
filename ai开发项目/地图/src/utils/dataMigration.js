/**
 * 数据迁移工具
 * 将localStorage数据迁移到Vercel KV存储
 */

import { storageAdapter } from './storageAdapter.js';
import { UnifiedStorageAPI } from './apiClient.js';

/**
 * 数据迁移管理器
 */
export class DataMigrationManager {
  constructor() {
    this.migrationStatus = {
      inProgress: false,
      completed: false,
      error: null,
      startTime: null,
      endTime: null,
      migratedRegions: 0,
      totalRegions: 0,
      details: []
    };
  }

  /**
   * 检查是否需要迁移
   */
  async checkMigrationNeeded() {
    try {
      // 检查localStorage中是否有数据
      const localData = this.getLocalStorageData();
      const localRegionCount = Object.keys(localData).length;

      // 检查API中是否有数据
      let apiRegionCount = 0;
      try {
        const apiData = await UnifiedStorageAPI.getAllRegionConfigs();
        apiRegionCount = Object.keys(apiData).length;
      } catch (error) {
        console.log('API数据检查失败，可能是首次部署:', error.message);
      }

      const migrationNeeded = localRegionCount > 0 && apiRegionCount < localRegionCount;

      return {
        needed: migrationNeeded,
        localRegionCount,
        apiRegionCount,
        reason: migrationNeeded 
          ? `localStorage有${localRegionCount}个区域，API只有${apiRegionCount}个区域`
          : '无需迁移'
      };
    } catch (error) {
      console.error('检查迁移需求失败:', error);
      return {
        needed: false,
        error: error.message
      };
    }
  }

  /**
   * 执行数据迁移
   */
  async performMigration(options = {}) {
    const {
      createBackup = true,
      overwriteExisting = false,
      batchSize = 5
    } = options;

    this.migrationStatus = {
      inProgress: true,
      completed: false,
      error: null,
      startTime: new Date().toISOString(),
      endTime: null,
      migratedRegions: 0,
      totalRegions: 0,
      details: []
    };

    try {
      console.log('🚀 开始数据迁移...');
      
      // 1. 获取localStorage数据
      const localData = this.getLocalStorageData();
      const regionIds = Object.keys(localData);
      this.migrationStatus.totalRegions = regionIds.length;

      if (regionIds.length === 0) {
        throw new Error('localStorage中没有找到区域配置数据');
      }

      console.log(`📊 发现 ${regionIds.length} 个区域配置需要迁移`);
      this.addMigrationDetail('info', `发现 ${regionIds.length} 个区域配置`);

      // 2. 创建迁移前备份
      if (createBackup) {
        try {
          await this.createMigrationBackup(localData);
          this.addMigrationDetail('success', '迁移前备份创建成功');
        } catch (error) {
          console.warn('创建备份失败，继续迁移:', error);
          this.addMigrationDetail('warning', `备份创建失败: ${error.message}`);
        }
      }

      // 3. 检查API中现有数据
      let existingApiData = {};
      try {
        existingApiData = await UnifiedStorageAPI.getAllRegionConfigs();
        console.log(`📋 API中现有 ${Object.keys(existingApiData).length} 个区域配置`);
      } catch (error) {
        console.log('API数据获取失败，假设为空:', error.message);
      }

      // 4. 批量迁移数据
      const batches = this.createBatches(regionIds, batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 处理批次 ${i + 1}/${batches.length} (${batch.length} 个区域)`);
        
        await this.migrateBatch(batch, localData, existingApiData, overwriteExisting);
        
        // 添加延迟避免API限制
        if (i < batches.length - 1) {
          await this.delay(1000);
        }
      }

      // 5. 验证迁移结果
      const verificationResult = await this.verifyMigration(localData);
      
      this.migrationStatus.completed = true;
      this.migrationStatus.endTime = new Date().toISOString();
      this.migrationStatus.inProgress = false;

      console.log('✅ 数据迁移完成!');
      this.addMigrationDetail('success', '数据迁移完成');

      return {
        success: true,
        ...this.migrationStatus,
        verification: verificationResult
      };

    } catch (error) {
      console.error('❌ 数据迁移失败:', error);
      
      this.migrationStatus.error = error.message;
      this.migrationStatus.inProgress = false;
      this.migrationStatus.endTime = new Date().toISOString();
      this.addMigrationDetail('error', `迁移失败: ${error.message}`);

      return {
        success: false,
        ...this.migrationStatus
      };
    }
  }

  /**
   * 获取localStorage数据
   */
  getLocalStorageData() {
    try {
      const data = localStorage.getItem('regionConfigs');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('读取localStorage数据失败:', error);
      return {};
    }
  }

  /**
   * 创建迁移备份
   */
  async createMigrationBackup(localData) {
    const backupName = `迁移备份_${new Date().toISOString().split('T')[0]}`;
    
    // 尝试使用API创建备份
    try {
      await UnifiedStorageAPI.createBackup(backupName, 'migration');
    } catch (error) {
      // 如果API失败，创建本地备份
      const backupKey = `migration_backup_${Date.now()}`;
      const backupData = {
        regionConfigs: localData,
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        type: 'migration_backup'
      };
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      console.log('已创建本地迁移备份:', backupKey);
    }
  }

  /**
   * 创建批次
   */
  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * 迁移批次数据
   */
  async migrateBatch(regionIds, localData, existingApiData, overwriteExisting) {
    for (const regionId of regionIds) {
      try {
        const localConfig = localData[regionId];
        
        // 检查是否已存在
        if (existingApiData[regionId] && !overwriteExisting) {
          console.log(`⏭️ 跳过区域 ${regionId} (已存在)`);
          this.addMigrationDetail('info', `跳过区域 ${regionId} (已存在)`);
          continue;
        }

        // 清理和验证数据
        const cleanedConfig = this.cleanConfigData(localConfig);
        
        // 保存到API
        await UnifiedStorageAPI.saveRegionConfig(regionId, cleanedConfig);
        
        this.migrationStatus.migratedRegions++;
        console.log(`✅ 迁移区域 ${regionId} 成功 (${this.migrationStatus.migratedRegions}/${this.migrationStatus.totalRegions})`);
        this.addMigrationDetail('success', `迁移区域 ${regionId} 成功`);
        
      } catch (error) {
        console.error(`❌ 迁移区域 ${regionId} 失败:`, error);
        this.addMigrationDetail('error', `迁移区域 ${regionId} 失败: ${error.message}`);
        // 继续处理其他区域，不中断整个迁移过程
      }
    }
  }

  /**
   * 清理配置数据
   */
  cleanConfigData(config) {
    return {
      regionName: config.regionName || config.name || `区域${config.regionId}`,
      isActive: config.isActive !== false,
      postalCodes: Array.isArray(config.postalCodes) ? config.postalCodes : [],
      weightRanges: Array.isArray(config.weightRanges) ? config.weightRanges.map(range => ({
        id: range.id,
        min: Number(range.min) || 0,
        max: Number(range.max) || 0,
        price: Number(range.price) || 0,
        label: range.label || '',
        isActive: range.isActive !== false
      })) : [],
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...config.metadata,
        migratedAt: new Date().toISOString(),
        migratedFrom: 'localStorage',
        version: '2.1.0'
      }
    };
  }

  /**
   * 验证迁移结果
   */
  async verifyMigration(originalData) {
    try {
      const apiData = await UnifiedStorageAPI.getAllRegionConfigs();
      const originalRegionIds = Object.keys(originalData);
      const apiRegionIds = Object.keys(apiData);
      
      const missingRegions = originalRegionIds.filter(id => !apiRegionIds.includes(id));
      const extraRegions = apiRegionIds.filter(id => !originalRegionIds.includes(id));
      
      return {
        success: missingRegions.length === 0,
        originalCount: originalRegionIds.length,
        migratedCount: apiRegionIds.length,
        missingRegions,
        extraRegions,
        details: missingRegions.length === 0 
          ? '所有区域迁移成功' 
          : `缺少 ${missingRegions.length} 个区域: ${missingRegions.join(', ')}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 添加迁移详情
   */
  addMigrationDetail(type, message) {
    this.migrationStatus.details.push({
      type,
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取迁移状态
   */
  getMigrationStatus() {
    return { ...this.migrationStatus };
  }

  /**
   * 重置迁移状态
   */
  resetMigrationStatus() {
    this.migrationStatus = {
      inProgress: false,
      completed: false,
      error: null,
      startTime: null,
      endTime: null,
      migratedRegions: 0,
      totalRegions: 0,
      details: []
    };
  }
}

// 创建单例实例
export const dataMigrationManager = new DataMigrationManager();

/**
 * 快速迁移函数
 */
export const quickMigration = async () => {
  const migrationCheck = await dataMigrationManager.checkMigrationNeeded();
  
  if (migrationCheck.needed) {
    console.log('🔄 检测到需要数据迁移，开始自动迁移...');
    return await dataMigrationManager.performMigration({
      createBackup: true,
      overwriteExisting: false,
      batchSize: 3
    });
  } else {
    console.log('✅ 无需数据迁移');
    return {
      success: true,
      message: '无需迁移',
      ...migrationCheck
    };
  }
};

export default dataMigrationManager;
