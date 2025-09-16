/**
 * 定价迁移服务
 * 处理从传统定价模式到动态定价系统的数据迁移
 * Migration service for transitioning from traditional pricing to dynamic pricing
 */

import pricingService from './pricingService.js';
import { cityStorageService } from '../utils/storage/cityStorage.js';
import { TRUCK_STORAGE_KEYS } from '../types/truckDelivery.js';

/**
 * 定价迁移服务类
 * 负责管理从传统重量定价到区域动态定价的完整迁移流程
 */
class PricingMigrationService {
  constructor() {
    // 迁移配置选项
    this.config = {
      batchSize: 10, // 批量处理大小
      maxRetries: 3, // 最大重试次数
      retryDelayMs: 1000, // 重试延迟时间
      backupEnabled: true, // 启用备份
      validateAfterMigration: true, // 迁移后验证
      preserveOriginalData: true, // 保留原始数据
      enableProgressTracking: true // 启用进度追踪
    };

    // 迁移状态追踪
    this.migrationState = {
      isRunning: false,
      currentPhase: null,
      totalSteps: 0,
      completedSteps: 0,
      errors: [],
      warnings: [],
      startTime: null,
      endTime: null,
      results: {
        traditionRulesAnalyzed: 0,
        dynamicRulesCreated: 0,
        citiesProcessed: 0,
        regionsProcessed: 0,
        conflictsResolved: 0,
        backupsCreated: 0
      }
    };

    // 迁移阶段定义
    this.migrationPhases = {
      ANALYZE: 'analyze', // 分析现有数据
      BACKUP: 'backup', // 备份现有数据
      TRANSFORM: 'transform', // 数据转换
      VALIDATE: 'validate', // 验证转换结果
      APPLY: 'apply', // 应用新数据
      CLEANUP: 'cleanup', // 清理旧数据
      VERIFY: 'verify' // 最终验证
    };

    // 事件监听器
    this.listeners = new Set();

    this.init();
  }

  /**
   * 初始化迁移服务
   */
  init() {
    // 恢复迁移状态（如果存在）
    this.restoreMigrationState();

    // 绑定事件处理器
    this.bindEventHandlers();

    console.log('定价迁移服务已初始化');
  }

  /**
   * 恢复迁移状态
   */
  restoreMigrationState() {
    try {
      const savedState = localStorage.getItem('migration_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        // 如果之前的迁移没有完成，标记为中断
        if (state.isRunning) {
          state.isRunning = false;
          state.currentPhase = 'interrupted';
          this.migrationState = { ...this.migrationState, ...state };
          console.warn('检测到中断的迁移，状态已恢复');
        } else {
          this.migrationState = { ...this.migrationState, ...state };
          console.log('迁移状态已恢复');
        }
      }
    } catch (error) {
      console.error('恢复迁移状态失败:', error);
    }
  }

  /**
   * 保存迁移状态
   */
  saveMigrationState() {
    try {
      localStorage.setItem('migration_state', JSON.stringify(this.migrationState));
    } catch (error) {
      console.error('保存迁移状态失败:', error);
    }
  }

  /**
   * 绑定事件处理器
   */
  bindEventHandlers() {
    // 监听页面卸载事件，保存状态
    window.addEventListener('beforeunload', () => {
      if (this.migrationState.isRunning) {
        this.saveMigrationState();
      }
    });

    // 监听存储事件，处理并发修改
    window.addEventListener('storage', (event) => {
      if (event.key === 'migration_state') {
        console.warn('检测到其他窗口的迁移活动');
        this.emit('concurrent-migration-detected', { event });
      }
    });
  }

  /**
   * 分析现有传统定价数据
   * @returns {Promise<Object>} 分析结果
   */
  async analyzeTraditionalPricing() {
    this.setPhase(this.migrationPhases.ANALYZE);
    console.log('开始分析传统定价数据...');

    try {
      const analysisResult = {
        traditionalRules: [],
        cities: [],
        regions: [],
        conflicts: [],
        recommendations: []
      };

      // 获取传统定价数据（从localStorage或其他存储）
      const traditionalData = this.getTraditionalPricingData();
      if (!traditionalData || Object.keys(traditionalData).length === 0) {
        console.warn('未找到传统定价数据');
        return analysisResult;
      }

      analysisResult.traditionalRules = this.parseTraditionalRules(traditionalData);
      console.log(`找到 ${analysisResult.traditionalRules.length} 条传统定价规则`);

      // 获取城市和区域数据
      analysisResult.cities = await this.getCitiesForMigration();
      analysisResult.regions = await this.getRegionsForMigration();

      console.log(`找到 ${analysisResult.cities.length} 个城市，${analysisResult.regions.length} 个区域`);

      // 检测潜在冲突
      analysisResult.conflicts = this.detectMigrationConflicts(
        analysisResult.traditionalRules,
        analysisResult.regions
      );

      // 生成迁移建议
      analysisResult.recommendations = this.generateMigrationRecommendations(analysisResult);

      // 更新统计信息
      this.migrationState.results.traditionRulesAnalyzed = analysisResult.traditionalRules.length;
      this.saveMigrationState();

      console.log('传统定价数据分析完成:', {
        traditionalRules: analysisResult.traditionalRules.length,
        cities: analysisResult.cities.length,
        regions: analysisResult.regions.length,
        conflicts: analysisResult.conflicts.length
      });

      this.emit('analysis-complete', analysisResult);
      return analysisResult;

    } catch (error) {
      console.error('分析传统定价数据失败:', error);
      this.addError('analysis', error.message);
      throw error;
    }
  }

  /**
   * 创建数据备份
   * @returns {Promise<Object>} 备份结果
   */
  async createBackup() {
    if (!this.config.backupEnabled) {
      console.log('备份功能已禁用，跳过备份步骤');
      return { backupsCreated: 0, backupKeys: [] };
    }

    this.setPhase(this.migrationPhases.BACKUP);
    console.log('创建数据备份...');

    try {
      const backupResult = {
        backupsCreated: 0,
        backupKeys: [],
        timestamp: new Date().toISOString()
      };

      // 备份传统定价数据
      const traditionalData = this.getTraditionalPricingData();
      if (traditionalData && Object.keys(traditionalData).length > 0) {
        const backupKey = `${TRUCK_STORAGE_KEYS.MIGRATION_BACKUP}_traditional_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify({
          type: 'traditional_pricing',
          data: traditionalData,
          timestamp: backupResult.timestamp,
          version: '1.0'
        }));
        
        backupResult.backupKeys.push(backupKey);
        backupResult.backupsCreated++;
        console.log(`传统定价数据已备份到: ${backupKey}`);
      }

      // 备份现有的动态定价数据（如果有）
      const existingDynamicRules = localStorage.getItem(TRUCK_STORAGE_KEYS.PRICING_RULES_V2);
      if (existingDynamicRules) {
        const backupKey = `${TRUCK_STORAGE_KEYS.MIGRATION_BACKUP}_dynamic_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify({
          type: 'dynamic_pricing',
          data: JSON.parse(existingDynamicRules),
          timestamp: backupResult.timestamp,
          version: '2.0'
        }));
        
        backupResult.backupKeys.push(backupKey);
        backupResult.backupsCreated++;
        console.log(`动态定价数据已备份到: ${backupKey}`);
      }

      // 备份城市和区域数据
      const cityData = await cityStorageService.getAllCities();
      if (cityData && Object.keys(cityData).length > 0) {
        const backupKey = `${TRUCK_STORAGE_KEYS.MIGRATION_BACKUP}_cities_${Date.now()}`;
        localStorage.setItem(backupKey, JSON.stringify({
          type: 'cities_regions',
          data: cityData,
          timestamp: backupResult.timestamp,
          version: '1.0'
        }));
        
        backupResult.backupKeys.push(backupKey);
        backupResult.backupsCreated++;
        console.log(`城市区域数据已备份到: ${backupKey}`);
      }

      // 更新统计信息
      this.migrationState.results.backupsCreated = backupResult.backupsCreated;
      this.saveMigrationState();

      console.log(`数据备份完成，创建了 ${backupResult.backupsCreated} 个备份`);
      this.emit('backup-complete', backupResult);
      return backupResult;

    } catch (error) {
      console.error('创建数据备份失败:', error);
      this.addError('backup', error.message);
      throw error;
    }
  }

  /**
   * 转换传统定价规则到动态定价格式
   * @param {Array} traditionalRules 传统定价规则
   * @param {Array} regions 区域列表
   * @returns {Array} 转换后的动态定价规则
   */
  transformTraditionalToDynamic(traditionalRules, regions) {
    this.setPhase(this.migrationPhases.TRANSFORM);
    console.log('开始转换定价规则格式...');

    const dynamicRules = [];
    const transformErrors = [];

    traditionalRules.forEach((traditionalRule, index) => {
      try {
        // 为每个区域创建动态定价规则
        regions.forEach(region => {
          const dynamicRule = this.createDynamicRuleFromTraditional(traditionalRule, region);
          if (dynamicRule) {
            dynamicRules.push(dynamicRule);
          }
        });
      } catch (error) {
        console.error(`转换规则 ${index} 失败:`, error);
        transformErrors.push({
          ruleIndex: index,
          rule: traditionalRule,
          error: error.message
        });
      }
    });

    if (transformErrors.length > 0) {
      this.migrationState.warnings.push(...transformErrors.map(e => 
        `规则转换警告: ${e.error} (规则索引: ${e.ruleIndex})`
      ));
    }

    console.log(`定价规则格式转换完成: ${dynamicRules.length} 条动态规则, ${transformErrors.length} 个错误`);
    return dynamicRules;
  }

  /**
   * 从传统规则创建动态规则
   * @param {Object} traditionalRule 传统定价规则
   * @param {Object} region 区域信息
   * @returns {Object} 动态定价规则
   */
  createDynamicRuleFromTraditional(traditionalRule, region) {
    // 生成唯一ID
    const ruleId = `migrated_${region.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 创建动态定价规则结构
    const dynamicRule = {
      id: ruleId,
      name: `迁移规则 - ${region.name || region.id}`,
      regionId: region.id,
      cityId: region.cityId || null,
      
      // 基础配置
      baseConfig: {
        plateMin: traditionalRule.plateMin || 1,
        price: traditionalRule.basePrice || 0
      },

      // 增量配置 - 从传统重量规则转换
      incrementConfig: this.convertWeightRangeToIncrement(traditionalRule),

      // 车辆配置
      vehicleConfig: {
        maxPlatesPerVehicle: traditionalRule.maxPlatesPerVehicle || 200,
        priceCapPerVehicle: traditionalRule.priceCapPerVehicle || null
      },

      // 元数据
      metadata: {
        source: 'migration',
        originalRuleId: traditionalRule.id,
        migratedAt: new Date().toISOString(),
        version: '2.0'
      },

      // 状态信息
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return dynamicRule;
  }

  /**
   * 将重量区间转换为增量配置
   * @param {Object} traditionalRule 传统规则
   * @returns {Object} 增量配置
   */
  convertWeightRangeToIncrement(traditionalRule) {
    // 如果有重量区间配置，转换为分层增量
    if (traditionalRule.weightRanges && traditionalRule.weightRanges.length > 0) {
      return {
        type: 'tiered',
        tiers: traditionalRule.weightRanges.map((range, index) => ({
          plateRangeStart: range.min || (index * 50 + 1),
          plateRangeEnd: range.max || ((index + 1) * 50),
          incrementValue: range.price || range.basePrice || 0
        }))
      };
    }

    // 否则使用固定增量
    return {
      type: 'fixed',
      value: traditionalRule.incrementPrice || 0
    };
  }

  /**
   * 获取传统定价数据
   * @returns {Object} 传统定价数据
   */
  getTraditionalPricingData() {
    try {
      // 尝试从多个可能的存储键获取数据
      const possibleKeys = [
        'pricing_rules', // 旧版本键
        'region_pricing', // 区域定价键
        'unified_region_data', // 统一存储键
        'weightRanges' // 重量区间键
      ];

      let traditionalData = {};

      possibleKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key);
          if (data) {
            const parsedData = JSON.parse(data);
            traditionalData[key] = parsedData;
          }
        } catch (error) {
          console.warn(`无法解析 ${key} 的数据:`, error);
        }
      });

      return traditionalData;
    } catch (error) {
      console.error('获取传统定价数据失败:', error);
      return {};
    }
  }

  /**
   * 解析传统定价规则
   * @param {Object} traditionalData 传统数据
   * @returns {Array} 解析后的规则列表
   */
  parseTraditionalRules(traditionalData) {
    const rules = [];

    // 从unified_region_data解析
    if (traditionalData.unified_region_data) {
      Object.entries(traditionalData.unified_region_data).forEach(([regionId, data]) => {
        if (data.weightRanges && data.weightRanges.length > 0) {
          rules.push({
            id: `traditional_${regionId}`,
            regionId,
            type: 'weight_based',
            weightRanges: data.weightRanges,
            basePrice: data.weightRanges[0]?.basePrice || 0,
            source: 'unified_region_data'
          });
        }
      });
    }

    // 从region_pricing解析
    if (traditionalData.region_pricing) {
      Object.entries(traditionalData.region_pricing).forEach(([regionId, pricing]) => {
        rules.push({
          id: `traditional_region_${regionId}`,
          regionId,
          type: 'region_based',
          basePrice: pricing.basePrice || 0,
          incrementPrice: pricing.incrementPrice || 0,
          source: 'region_pricing'
        });
      });
    }

    return rules;
  }

  /**
   * 获取用于迁移的城市数据
   * @returns {Promise<Array>} 城市列表
   */
  async getCitiesForMigration() {
    try {
      const cities = await cityStorageService.getAllCities();
      return Object.values(cities || {});
    } catch (error) {
      console.error('获取城市数据失败:', error);
      return [];
    }
  }

  /**
   * 获取用于迁移的区域数据
   * @returns {Promise<Array>} 区域列表
   */
  async getRegionsForMigration() {
    try {
      const cities = await this.getCitiesForMigration();
      const regions = [];

      cities.forEach(city => {
        if (city.regions && Array.isArray(city.regions)) {
          city.regions.forEach(region => {
            regions.push({
              ...region,
              cityId: city.id,
              cityName: city.name
            });
          });
        }
      });

      return regions;
    } catch (error) {
      console.error('获取区域数据失败:', error);
      return [];
    }
  }

  /**
   * 检测迁移冲突
   * @param {Array} traditionalRules 传统规则
   * @param {Array} regions 区域列表
   * @returns {Array} 冲突列表
   */
  detectMigrationConflicts(traditionalRules, regions) {
    const conflicts = [];

    // 检查是否已存在动态定价规则
    const existingDynamicRules = localStorage.getItem(TRUCK_STORAGE_KEYS.PRICING_RULES_V2);
    if (existingDynamicRules) {
      conflicts.push({
        type: 'existing_dynamic_rules',
        severity: 'warning',
        message: '检测到现有的动态定价规则，迁移可能会覆盖这些数据',
        affectedData: 'dynamic_pricing_rules'
      });
    }

    // 检查区域覆盖情况
    const traditionalRegionIds = new Set(traditionalRules.map(rule => rule.regionId));
    const availableRegionIds = new Set(regions.map(region => region.id));
    
    const missingRegions = [...traditionalRegionIds].filter(id => !availableRegionIds.has(id));
    if (missingRegions.length > 0) {
      conflicts.push({
        type: 'missing_regions',
        severity: 'error',
        message: `部分传统规则引用的区域不存在: ${missingRegions.join(', ')}`,
        affectedData: missingRegions
      });
    }

    return conflicts;
  }

  /**
   * 生成迁移建议
   * @param {Object} analysisResult 分析结果
   * @returns {Array} 建议列表
   */
  generateMigrationRecommendations(analysisResult) {
    const recommendations = [];

    if (analysisResult.traditionalRules.length === 0) {
      recommendations.push({
        type: 'no_traditional_rules',
        priority: 'high',
        message: '未发现传统定价规则，可能不需要执行迁移',
        action: '确认是否存在需要迁移的定价数据'
      });
    }

    if (analysisResult.conflicts.length > 0) {
      recommendations.push({
        type: 'resolve_conflicts',
        priority: 'high',
        message: `发现 ${analysisResult.conflicts.length} 个冲突需要解决`,
        action: '在执行迁移前解决所有冲突'
      });
    }

    if (analysisResult.regions.length === 0) {
      recommendations.push({
        type: 'no_regions',
        priority: 'critical',
        message: '未发现任何区域数据，无法执行迁移',
        action: '请先配置城市和区域数据'
      });
    }

    return recommendations;
  }

  /**
   * 设置当前迁移阶段
   * @param {string} phase 阶段名称
   */
  setPhase(phase) {
    this.migrationState.currentPhase = phase;
    this.saveMigrationState();
    this.emit('phase-change', { phase, timestamp: Date.now() });
    console.log(`迁移阶段: ${phase}`);
  }

  /**
   * 添加错误信息
   * @param {string} phase 阶段
   * @param {string} message 错误消息
   */
  addError(phase, message) {
    const error = {
      phase,
      message,
      timestamp: new Date().toISOString()
    };
    this.migrationState.errors.push(error);
    this.saveMigrationState();
    this.emit('error', error);
  }

  /**
   * 添加警告信息
   * @param {string} phase 阶段
   * @param {string} message 警告消息
   */
  addWarning(phase, message) {
    const warning = {
      phase,
      message,
      timestamp: new Date().toISOString()
    };
    this.migrationState.warnings.push(warning);
    this.saveMigrationState();
    this.emit('warning', warning);
  }

  /**
   * 获取迁移状态
   * @returns {Object} 当前迁移状态
   */
  getMigrationStatus() {
    return {
      ...this.migrationState,
      progressPercentage: this.migrationState.totalSteps > 0 
        ? Math.round((this.migrationState.completedSteps / this.migrationState.totalSteps) * 100)
        : 0
    };
  }

  /**
   * 重置迁移状态
   */
  resetMigrationState() {
    this.migrationState = {
      isRunning: false,
      currentPhase: null,
      totalSteps: 0,
      completedSteps: 0,
      errors: [],
      warnings: [],
      startTime: null,
      endTime: null,
      results: {
        traditionRulesAnalyzed: 0,
        dynamicRulesCreated: 0,
        citiesProcessed: 0,
        regionsProcessed: 0,
        conflictsResolved: 0,
        backupsCreated: 0
      }
    };
    
    localStorage.removeItem('migration_state');
    this.emit('state-reset', {});
    console.log('迁移状态已重置');
  }

  /**
   * 添加事件监听器
   * @param {Function} listener 监听器函数
   * @returns {Function} 取消监听函数
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 发送事件
   * @param {string} event 事件名称
   * @param {*} data 事件数据
   */
  emit(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener({ event, data, timestamp: Date.now() });
      } catch (error) {
        console.error('事件监听器执行失败:', error);
      }
    });
  }

  /**
   * 清理资源
   */
  destroy() {
    this.listeners.clear();
    
    // 移除事件监听器
    window.removeEventListener('beforeunload', this.saveMigrationState);
    
    console.log('定价迁移服务已销毁');
  }
}

// 创建单例实例
const pricingMigrationService = new PricingMigrationService();

export default pricingMigrationService;
export { PricingMigrationService };