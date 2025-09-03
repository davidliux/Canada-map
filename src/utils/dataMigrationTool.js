/**
 * 数据迁移工具
 * 用于将localStorage中的数据迁移到后端数据库
 */

import regionApiService from '../services/regionApiService';
import { UNIFIED_STORAGE_KEYS } from './unifiedStorage';

class DataMigrationTool {
  constructor() {
    this.migrationStatus = {
      started: false,
      completed: false,
      regions: {
        total: 0,
        migrated: 0,
        failed: 0
      },
      errors: []
    };
  }

  /**
   * 检查是否需要迁移
   * @returns {Object} 迁移检查结果
   */
  async checkMigrationNeeded() {
    const result = {
      needed: false,
      localDataExists: false,
      serverDataExists: false,
      localRegionCount: 0,
      serverRegionCount: 0
    };

    // 检查本地数据
    try {
      const localData = localStorage.getItem(UNIFIED_STORAGE_KEYS.REGION_DATA);
      if (localData) {
        const regions = JSON.parse(localData);
        result.localDataExists = true;
        result.localRegionCount = Object.keys(regions).length;
      }
    } catch (error) {
      console.error('检查本地数据失败:', error);
    }

    // 检查服务器数据
    try {
      const serverRegions = await regionApiService.getAllRegions(false, false);
      result.serverDataExists = Object.keys(serverRegions).length > 0;
      result.serverRegionCount = Object.keys(serverRegions).length;
    } catch (error) {
      console.error('检查服务器数据失败:', error);
    }

    // 判断是否需要迁移
    result.needed = result.localDataExists && 
                   (result.localRegionCount > result.serverRegionCount || !result.serverDataExists);

    return result;
  }

  /**
   * 执行数据迁移
   * @param {Object} options - 迁移选项
   * @returns {Promise<Object>} 迁移结果
   */
  async migrate(options = {}) {
    const {
      overwrite = false,         // 是否覆盖服务器上的现有数据
      batchSize = 5,            // 批处理大小
      onProgress = null,        // 进度回调函数
      dryRun = false           // 模拟运行，不实际执行迁移
    } = options;

    this.migrationStatus.started = true;
    this.migrationStatus.startTime = new Date().toISOString();

    try {
      // 1. 读取本地数据
      const localData = this.readLocalData();
      if (!localData) {
        throw new Error('没有找到本地数据');
      }

      const regionIds = Object.keys(localData);
      this.migrationStatus.regions.total = regionIds.length;

      console.log(`开始迁移 ${regionIds.length} 个区域的数据...`);

      // 2. 分批迁移
      for (let i = 0; i < regionIds.length; i += batchSize) {
        const batch = regionIds.slice(i, i + batchSize);
        
        for (const regionId of batch) {
          try {
            if (dryRun) {
              console.log(`[模拟] 迁移区域 ${regionId}`);
            } else {
              await this.migrateRegion(regionId, localData[regionId], overwrite);
            }
            
            this.migrationStatus.regions.migrated++;
            
            if (onProgress) {
              onProgress({
                current: this.migrationStatus.regions.migrated,
                total: this.migrationStatus.regions.total,
                percentage: Math.round((this.migrationStatus.regions.migrated / this.migrationStatus.regions.total) * 100)
              });
            }
          } catch (error) {
            console.error(`迁移区域 ${regionId} 失败:`, error);
            this.migrationStatus.regions.failed++;
            this.migrationStatus.errors.push({
              regionId,
              error: error.message
            });
          }
        }

        // 批次间延迟，避免服务器压力过大
        if (i + batchSize < regionIds.length) {
          await this.delay(500);
        }
      }

      // 3. 完成迁移
      this.migrationStatus.completed = true;
      this.migrationStatus.endTime = new Date().toISOString();

      // 4. 生成迁移报告
      const report = this.generateMigrationReport();
      
      // 5. 如果迁移成功，标记已迁移
      if (!dryRun && this.migrationStatus.regions.failed === 0) {
        this.markMigrationCompleted();
      }

      return report;
    } catch (error) {
      console.error('数据迁移失败:', error);
      this.migrationStatus.error = error.message;
      throw error;
    }
  }

  /**
   * 迁移单个区域
   * @param {string} regionId - 区域ID
   * @param {Object} regionData - 区域数据
   * @param {boolean} overwrite - 是否覆盖
   */
  async migrateRegion(regionId, regionData, overwrite) {
    // 检查服务器上是否已存在
    let serverRegion = null;
    try {
      serverRegion = await regionApiService.getRegionById(regionId);
    } catch (error) {
      // 区域不存在，可以创建
    }

    if (serverRegion && !overwrite) {
      console.log(`区域 ${regionId} 已存在于服务器，跳过`);
      return;
    }

    // 准备数据
    const migrationData = {
      id: regionId,
      name: regionData.name || `区域${regionId}`,
      description: regionData.description || '',
      isActive: regionData.isActive || false,
      colorCode: regionData.colorCode || null,
      postalCodes: regionData.postalCodes || [],
      weightRanges: regionData.weightRanges || []
    };

    // 创建或更新区域
    if (serverRegion) {
      await regionApiService.updateRegion(regionId, migrationData);
      console.log(`更新区域 ${regionId} 成功`);
    } else {
      await regionApiService.createRegion(migrationData);
      console.log(`创建区域 ${regionId} 成功`);
    }

    // 迁移邮编数据
    if (migrationData.postalCodes.length > 0) {
      const fsaCodes = [...new Set(migrationData.postalCodes.map(pc => pc.substring(0, 3)))];
      await regionApiService.assignFSAsToRegion(regionId, fsaCodes);
      console.log(`分配 ${fsaCodes.length} 个FSA到区域 ${regionId}`);
    }

    // 迁移价格配置
    if (migrationData.weightRanges.length > 0) {
      await regionApiService.updateRegionPrices(regionId, migrationData.weightRanges);
      console.log(`更新区域 ${regionId} 的价格配置`);
    }
  }

  /**
   * 读取本地数据
   * @returns {Object|null} 本地数据
   */
  readLocalData() {
    try {
      const stored = localStorage.getItem(UNIFIED_STORAGE_KEYS.REGION_DATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('读取本地数据失败:', error);
    }
    return null;
  }

  /**
   * 生成迁移报告
   * @returns {Object} 迁移报告
   */
  generateMigrationReport() {
    const duration = this.migrationStatus.endTime && this.migrationStatus.startTime
      ? new Date(this.migrationStatus.endTime) - new Date(this.migrationStatus.startTime)
      : 0;

    return {
      success: this.migrationStatus.regions.failed === 0,
      summary: {
        totalRegions: this.migrationStatus.regions.total,
        migratedRegions: this.migrationStatus.regions.migrated,
        failedRegions: this.migrationStatus.regions.failed,
        duration: duration,
        startTime: this.migrationStatus.startTime,
        endTime: this.migrationStatus.endTime
      },
      errors: this.migrationStatus.errors,
      message: this.migrationStatus.regions.failed === 0
        ? '数据迁移成功完成'
        : `数据迁移部分完成，${this.migrationStatus.regions.failed} 个区域迁移失败`
    };
  }

  /**
   * 标记迁移已完成
   */
  markMigrationCompleted() {
    try {
      localStorage.setItem('data_migration_completed', JSON.stringify({
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        regions: this.migrationStatus.regions.migrated
      }));
      console.log('迁移标记已保存');
    } catch (error) {
      console.error('保存迁移标记失败:', error);
    }
  }

  /**
   * 检查是否已完成迁移
   * @returns {boolean} 是否已迁移
   */
  isMigrationCompleted() {
    try {
      const marker = localStorage.getItem('data_migration_completed');
      return marker !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 回滚迁移（删除服务器上的数据）
   * @param {string[]} regionIds - 要回滚的区域ID列表
   */
  async rollback(regionIds) {
    const results = {
      success: [],
      failed: []
    };

    for (const regionId of regionIds) {
      try {
        await regionApiService.deleteRegion(regionId);
        results.success.push(regionId);
        console.log(`回滚区域 ${regionId} 成功`);
      } catch (error) {
        results.failed.push({ regionId, error: error.message });
        console.error(`回滚区域 ${regionId} 失败:`, error);
      }
    }

    return results;
  }

  /**
   * 验证迁移结果
   * @returns {Promise<Object>} 验证结果
   */
  async verifyMigration() {
    const result = {
      valid: true,
      discrepancies: []
    };

    try {
      // 读取本地数据
      const localData = this.readLocalData();
      if (!localData) {
        result.valid = false;
        result.discrepancies.push('本地数据不存在');
        return result;
      }

      // 获取服务器数据
      const serverData = await regionApiService.getAllRegions(true, true);

      // 比较数据
      const localRegionIds = Object.keys(localData);
      const serverRegionIds = Object.keys(serverData);

      // 检查缺失的区域
      const missingOnServer = localRegionIds.filter(id => !serverRegionIds.includes(id));
      if (missingOnServer.length > 0) {
        result.valid = false;
        result.discrepancies.push({
          type: 'missing_on_server',
          regions: missingOnServer
        });
      }

      // 检查数据一致性
      for (const regionId of localRegionIds) {
        if (serverData[regionId]) {
          const local = localData[regionId];
          const server = serverData[regionId];

          // 比较邮编数量
          const localPostalCount = local.postalCodes ? local.postalCodes.length : 0;
          const serverPostalCount = server.postalCodes ? server.postalCodes.length : 0;

          if (localPostalCount !== serverPostalCount) {
            result.discrepancies.push({
              type: 'postal_count_mismatch',
              regionId,
              local: localPostalCount,
              server: serverPostalCount
            });
          }

          // 比较价格配置数量
          const localPriceCount = local.weightRanges ? local.weightRanges.length : 0;
          const serverPriceCount = server.weightRanges ? server.weightRanges.length : 0;

          if (localPriceCount !== serverPriceCount) {
            result.discrepancies.push({
              type: 'price_config_mismatch',
              regionId,
              local: localPriceCount,
              server: serverPriceCount
            });
          }
        }
      }

      result.valid = result.discrepancies.length === 0;
    } catch (error) {
      result.valid = false;
      result.error = error.message;
    }

    return result;
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建单例实例
const migrationTool = new DataMigrationTool();

// 导出工具
export default migrationTool;

// 也导出类
export { DataMigrationTool };