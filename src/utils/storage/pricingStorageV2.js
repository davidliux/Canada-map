/**
 * 增强型价格存储服务类 V2
 * 整合统一存储架构，提供区域感知的价格规则存储和管理
 */

import { 
  getAllRegionConfigs, 
  getRegionConfig,
  saveRegionConfig,
  validateRegionConfig,
  DEFAULT_WEIGHT_RANGES 
} from '../unifiedStorage.js';
import { dataUpdateNotifier, notifyRegionUpdate } from '../dataUpdateNotifier.js';

/**
 * 价格规则数据结构
 * @typedef {Object} PricingRule
 * @property {string} id - 价格规则唯一标识
 * @property {string} regionId - 所属区域ID
 * @property {string} ruleType - 规则类型 ('weight', 'distance', 'size', 'custom')
 * @property {string} name - 规则名称
 * @property {Object} config - 规则配置
 * @property {number} priority - 规则优先级 (数字越小优先级越高)
 * @property {boolean} isActive - 是否启用
 * @property {string} createdAt - 创建时间
 * @property {string} lastUpdated - 最后更新时间
 * @property {Object} metadata - 规则元数据
 */

/**
 * 重量价格规则配置
 * @typedef {Object} WeightPricingConfig
 * @property {number} min - 最小重量 (KGS)
 * @property {number} max - 最大重量 (KGS)
 * @property {number} basePrice - 基础价格 (CAD)
 * @property {number} perKgPrice - 每公斤价格 (CAD)
 * @property {string} currency - 货币单位
 */

/**
 * 增强型价格存储服务类
 * 提供区域感知的价格规则存储、验证和管理功能
 */
export class PricingStorageV2 {
  // 存储键名常量
  static STORAGE_KEYS = {
    PRICING_RULES: 'pricing_rules_v2',
    RULE_TEMPLATES: 'pricing_rule_templates',
    PRICING_HISTORY: 'pricing_history_v2',
    SETTINGS: 'pricing_settings_v2'
  };

  // 默认设置
  static DEFAULT_SETTINGS = {
    version: '2.0.0',
    currency: 'CAD',
    decimalPlaces: 2,
    enableHistory: true,
    maxHistoryRecords: 100,
    autoValidation: true,
    lastUpdated: new Date().toISOString()
  };

  // 支持的规则类型
  static RULE_TYPES = {
    WEIGHT: 'weight',
    DISTANCE: 'distance', 
    SIZE: 'size',
    CUSTOM: 'custom'
  };

  /**
   * 构造函数
   * 初始化价格存储服务，设置数据更新监听器
   * @param {Object} options - 初始化选项
   */
  constructor(options = {}) {
    this.options = {
      enableRegionValidation: true,
      autoSync: true,
      cacheEnabled: true,
      ...options
    };

    // 内存缓存
    this._cache = {
      regions: null,
      pricingRules: null,
      lastSync: null
    };

    // 初始化数据更新监听器
    this._initializeListeners();

    console.log('🔧 PricingStorageV2 初始化完成', this.options);
  }

  /**
   * 初始化数据更新监听器
   * @private
   */
  _initializeListeners() {
    if (this.options.autoSync) {
      this._unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
        // 监听区域更新，清除相关缓存
        if (updateInfo.type === 'regionUpdate') {
          this._clearRegionCache(updateInfo.regionId);
        }
        
        // 监听全局刷新，清除所有缓存
        if (updateInfo.type === 'globalRefresh') {
          this._clearAllCache();
        }
      });
    }
  }

  /**
   * 清除指定区域的缓存
   * @private
   * @param {string} regionId - 区域ID
   */
  _clearRegionCache(regionId) {
    if (this._cache.regions && this._cache.regions[regionId]) {
      delete this._cache.regions[regionId];
    }
    
    if (this._cache.pricingRules) {
      // 清除与该区域相关的价格规则缓存
      Object.keys(this._cache.pricingRules).forEach(ruleId => {
        const rule = this._cache.pricingRules[ruleId];
        if (rule && rule.regionId === regionId) {
          delete this._cache.pricingRules[ruleId];
        }
      });
    }
  }

  /**
   * 清除所有缓存
   * @private
   */
  _clearAllCache() {
    this._cache = {
      regions: null,
      pricingRules: null,
      lastSync: null
    };
  }

  /**
   * 保存价格规则
   * 将价格规则保存到指定区域的配置中
   * @param {string} regionId - 区域ID
   * @param {PricingRule} pricingRule - 价格规则数据
   * @returns {Promise<boolean>} 保存是否成功
   */
  async savePricingRule(regionId, pricingRule) {
    try {
      // 1. 验证区域ID
      if (!regionId || typeof regionId !== 'string') {
        throw new Error('区域ID是必填项且必须是字符串');
      }

      // 2. 验证价格规则
      const validation = this._validatePricingRule(pricingRule);
      if (!validation.isValid) {
        console.error('价格规则验证失败:', validation.errors);
        throw new Error(`价格规则验证失败: ${validation.errors.join(', ')}`);
      }

      // 3. 获取区域配置
      const regionConfig = await getRegionConfig(regionId);
      if (!regionConfig) {
        throw new Error(`区域 ${regionId} 不存在`);
      }

      // 4. 如果是重量类型规则，更新区域的weightRanges
      if (pricingRule.ruleType === PricingStorageV2.RULE_TYPES.WEIGHT) {
        const updatedConfig = await this._updateWeightRanges(regionConfig, pricingRule);
        
        // 保存更新后的区域配置
        const saveSuccess = await saveRegionConfig(regionId, updatedConfig);
        if (!saveSuccess) {
          throw new Error('保存区域配置失败');
        }
      } else {
        // 5. 对于其他类型的规则，保存到专门的价格规则存储中
        await this._savePricingRuleToStorage(regionId, pricingRule);
      }

      // 6. 更新缓存
      if (this.options.cacheEnabled) {
        this._updateRuleCache(regionId, pricingRule);
      }

      // 7. 记录历史（如果启用）
      const settings = this._getSettings();
      if (settings.enableHistory) {
        this._recordPricingHistory(regionId, pricingRule, 'create_or_update');
      }

      // 8. 触发数据更新通知
      notifyRegionUpdate(regionId, 'pricingRule', {
        ruleId: pricingRule.id,
        ruleType: pricingRule.ruleType,
        regionId,
        timestamp: new Date().toISOString()
      });

      console.log(`💰 价格规则保存成功: 区域${regionId} - ${pricingRule.name}`);
      return true;

    } catch (error) {
      console.error('保存价格规则失败:', error);
      return false;
    }
  }

  /**
   * 将重量价格规则更新到区域的weightRanges中
   * @private
   * @param {Object} regionConfig - 区域配置
   * @param {PricingRule} pricingRule - 价格规则
   * @returns {Object} 更新后的区域配置
   */
  async _updateWeightRanges(regionConfig, pricingRule) {
    const { config } = pricingRule;
    
    // 确保区域有weightRanges字段
    if (!regionConfig.weightRanges) {
      regionConfig.weightRanges = [...DEFAULT_WEIGHT_RANGES];
    }

    // 根据价格规则更新对应的重量区间
    const updatedRanges = regionConfig.weightRanges.map(range => {
      // 匹配重量区间
      if (config.min >= range.min && config.max <= range.max) {
        return {
          ...range,
          price: config.basePrice || config.perKgPrice || 0,
          isActive: pricingRule.isActive,
          lastUpdated: new Date().toISOString(),
          ruleId: pricingRule.id
        };
      }
      return range;
    });

    return {
      ...regionConfig,
      weightRanges: updatedRanges,
      lastUpdated: new Date().toISOString(),
      metadata: {
        ...regionConfig.metadata,
        pricingRulesCount: (regionConfig.metadata?.pricingRulesCount || 0) + 1,
        lastPricingUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * 将价格规则保存到专门的存储中（用于非重量类型规则）
   * @private
   * @param {string} regionId - 区域ID
   * @param {PricingRule} pricingRule - 价格规则
   */
  async _savePricingRuleToStorage(regionId, pricingRule) {
    try {
      const allRules = this._getAllPricingRules();
      
      const ruleKey = `${regionId}_${pricingRule.id}`;
      const enrichedRule = {
        ...pricingRule,
        regionId,
        lastUpdated: new Date().toISOString()
      };

      allRules[ruleKey] = enrichedRule;
      
      localStorage.setItem(
        PricingStorageV2.STORAGE_KEYS.PRICING_RULES, 
        JSON.stringify(allRules)
      );

      console.log(`📋 非重量类型价格规则已保存: ${ruleKey}`);
    } catch (error) {
      console.error('保存价格规则到存储失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有价格规则
   * @private
   * @returns {Object} 价格规则集合
   */
  _getAllPricingRules() {
    try {
      const stored = localStorage.getItem(PricingStorageV2.STORAGE_KEYS.PRICING_RULES);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('读取价格规则失败:', error);
      return {};
    }
  }

  /**
   * 更新规则缓存
   * @private
   * @param {string} regionId - 区域ID
   * @param {PricingRule} pricingRule - 价格规则
   */
  _updateRuleCache(regionId, pricingRule) {
    if (!this._cache.pricingRules) {
      this._cache.pricingRules = {};
    }
    
    const ruleKey = `${regionId}_${pricingRule.id}`;
    this._cache.pricingRules[ruleKey] = pricingRule;
  }

  /**
   * 验证价格规则
   * @private
   * @param {PricingRule} pricingRule - 价格规则
   * @returns {Object} 验证结果
   */
  _validatePricingRule(pricingRule) {
    const errors = [];
    const warnings = [];

    // 必填字段验证
    if (!pricingRule.id || typeof pricingRule.id !== 'string') {
      errors.push('价格规则ID是必填项且必须是字符串');
    }

    if (!pricingRule.name || typeof pricingRule.name !== 'string') {
      errors.push('价格规则名称是必填项且必须是字符串');
    }

    if (!pricingRule.ruleType || !Object.values(PricingStorageV2.RULE_TYPES).includes(pricingRule.ruleType)) {
      errors.push(`价格规则类型必须是: ${Object.values(PricingStorageV2.RULE_TYPES).join(', ')} 之一`);
    }

    if (!pricingRule.config || typeof pricingRule.config !== 'object') {
      errors.push('价格规则配置是必填项且必须是对象');
    }

    // 重量类型特殊验证
    if (pricingRule.ruleType === PricingStorageV2.RULE_TYPES.WEIGHT && pricingRule.config) {
      const { min, max, basePrice, perKgPrice } = pricingRule.config;
      
      if (typeof min !== 'number' || min < 0) {
        errors.push('重量价格规则的最小重量必须是非负数字');
      }
      
      if (typeof max !== 'number' || max <= 0) {
        errors.push('重量价格规则的最大重量必须是正数字');
      }
      
      if (typeof min === 'number' && typeof max === 'number' && min >= max) {
        errors.push('重量价格规则的最小重量必须小于最大重量');
      }
      
      if ((typeof basePrice !== 'number' && typeof perKgPrice !== 'number') || 
          (basePrice < 0 || perKgPrice < 0)) {
        warnings.push('重量价格规则应设置基础价格或每公斤价格，且不应为负数');
      }
    }

    // 优先级验证
    if (pricingRule.priority !== undefined && 
        (typeof pricingRule.priority !== 'number' || pricingRule.priority < 0)) {
      warnings.push('价格规则优先级应为非负数字');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 记录价格规则历史
   * @private
   * @param {string} regionId - 区域ID
   * @param {PricingRule} pricingRule - 价格规则
   * @param {string} action - 操作类型
   */
  _recordPricingHistory(regionId, pricingRule, action) {
    try {
      const historyKey = PricingStorageV2.STORAGE_KEYS.PRICING_HISTORY;
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      
      const historyRecord = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        regionId,
        ruleId: pricingRule.id,
        action,
        rule: { ...pricingRule },
        timestamp: new Date().toISOString(),
        user: 'system' // 可根据需要扩展用户信息
      };

      history.unshift(historyRecord);

      // 限制历史记录数量
      const settings = this._getSettings();
      if (history.length > settings.maxHistoryRecords) {
        history.splice(settings.maxHistoryRecords);
      }

      localStorage.setItem(historyKey, JSON.stringify(history));
      console.log('📊 价格规则历史记录已保存');
    } catch (error) {
      console.error('记录价格规则历史失败:', error);
    }
  }

  /**
   * 获取存储设置
   * @private
   * @returns {Object} 设置对象
   */
  _getSettings() {
    try {
      const stored = localStorage.getItem(PricingStorageV2.STORAGE_KEYS.SETTINGS);
      return stored ? 
        { ...PricingStorageV2.DEFAULT_SETTINGS, ...JSON.parse(stored) } : 
        PricingStorageV2.DEFAULT_SETTINGS;
    } catch (error) {
      console.error('读取价格存储设置失败:', error);
      return PricingStorageV2.DEFAULT_SETTINGS;
    }
  }

  /**
   * 根据区域ID获取所有价格规则
   * 整合区域重量规则和专门存储的其他类型规则
   * @param {string} regionId - 区域ID
   * @param {Object} options - 查询选项
   * @param {string[]} options.ruleTypes - 过滤的规则类型，如 ['weight', 'distance']
   * @param {boolean} options.activeOnly - 仅返回启用的规则，默认 false
   * @param {boolean} options.useCache - 是否使用缓存，默认 true
   * @returns {Promise<PricingRule[]>} 价格规则列表
   */
  async getRulesByRegion(regionId, options = {}) {
    try {
      // 1. 参数验证
      if (!regionId || typeof regionId !== 'string') {
        throw new Error('区域ID是必填项且必须是字符串');
      }

      const {
        ruleTypes = Object.values(PricingStorageV2.RULE_TYPES),
        activeOnly = false,
        useCache = this.options.cacheEnabled
      } = options;

      // 2. 检查缓存
      const cacheKey = `region_rules_${regionId}_${JSON.stringify(options)}`;
      if (useCache && this._cache.pricingRules && this._cache.pricingRules[cacheKey]) {
        console.log(`📦 从缓存获取区域 ${regionId} 价格规则`);
        return this._cache.pricingRules[cacheKey];
      }

      // 3. 获取所有类型的规则
      const allRules = [];

      // 3.1 获取重量规则（从区域配置的 weightRanges）
      if (ruleTypes.includes(PricingStorageV2.RULE_TYPES.WEIGHT)) {
        const weightRules = await this._getWeightRulesFromRegion(regionId, activeOnly);
        allRules.push(...weightRules);
      }

      // 3.2 获取其他类型规则（从专门的价格规则存储）
      const otherRuleTypes = ruleTypes.filter(type => type !== PricingStorageV2.RULE_TYPES.WEIGHT);
      if (otherRuleTypes.length > 0) {
        const otherRules = await this._getOtherRulesFromStorage(regionId, otherRuleTypes, activeOnly);
        allRules.push(...otherRules);
      }

      // 4. 按优先级排序
      allRules.sort((a, b) => {
        const priorityA = a.priority || 999;
        const priorityB = b.priority || 999;
        return priorityA - priorityB;
      });

      // 5. 更新缓存
      if (useCache) {
        if (!this._cache.pricingRules) {
          this._cache.pricingRules = {};
        }
        this._cache.pricingRules[cacheKey] = allRules;
      }

      console.log(`💰 获取区域 ${regionId} 价格规则成功，共 ${allRules.length} 条规则`);
      return allRules;

    } catch (error) {
      console.error(`获取区域 ${regionId} 价格规则失败:`, error);
      return [];
    }
  }

  /**
   * 从区域配置中获取重量价格规则
   * @private
   * @param {string} regionId - 区域ID
   * @param {boolean} activeOnly - 仅获取启用规则
   * @returns {Promise<PricingRule[]>} 重量价格规则列表
   */
  async _getWeightRulesFromRegion(regionId, activeOnly = false) {
    try {
      const regionConfig = await getRegionConfig(regionId);
      if (!regionConfig || !regionConfig.weightRanges) {
        console.log(`区域 ${regionId} 没有配置重量价格规则`);
        return [];
      }

      const weightRules = regionConfig.weightRanges
        .filter(range => !activeOnly || range.isActive !== false)
        .map(range => {
          // 将 weightRange 转换为标准的 PricingRule 格式
          return {
            id: range.ruleId || `weight_${range.id || range.min}_${range.max}`,
            regionId,
            ruleType: PricingStorageV2.RULE_TYPES.WEIGHT,
            name: range.label || `重量${range.min}-${range.max}KG价格规则`,
            config: {
              min: range.min,
              max: range.max,
              basePrice: range.price || 0,
              perKgPrice: 0, // 这个需要从实际配置中获取
              currency: 'CAD'
            },
            priority: range.priority || 1,
            isActive: range.isActive !== false,
            createdAt: range.createdAt || regionConfig.metadata?.createdAt || new Date().toISOString(),
            lastUpdated: range.lastUpdated || regionConfig.lastUpdated,
            metadata: {
              version: '2.0.0',
              source: 'regionConfig',
              weightRangeId: range.id,
              notes: `来自区域 ${regionConfig.name} 的重量价格配置`
            }
          };
        });

      console.log(`📊 从区域 ${regionId} 获取到 ${weightRules.length} 条重量价格规则`);
      return weightRules;

    } catch (error) {
      console.error(`获取区域 ${regionId} 重量价格规则失败:`, error);
      return [];
    }
  }

  /**
   * 从专门存储中获取其他类型价格规则
   * @private
   * @param {string} regionId - 区域ID
   * @param {string[]} ruleTypes - 规则类型列表
   * @param {boolean} activeOnly - 仅获取启用规则
   * @returns {Promise<PricingRule[]>} 其他类型价格规则列表
   */
  async _getOtherRulesFromStorage(regionId, ruleTypes, activeOnly = false) {
    try {
      const allStoredRules = this._getAllPricingRules();
      const filteredRules = [];

      // 遍历所有存储的规则，筛选出属于指定区域和类型的规则
      Object.entries(allStoredRules).forEach(([ruleKey, rule]) => {
        // 检查是否属于指定区域
        if (rule.regionId === regionId) {
          // 检查规则类型
          if (ruleTypes.includes(rule.ruleType)) {
            // 检查是否启用（如果需要）
            if (!activeOnly || rule.isActive !== false) {
              filteredRules.push({
                ...rule,
                // 确保必要字段存在
                id: rule.id || ruleKey,
                regionId: rule.regionId,
                priority: rule.priority || 1,
                isActive: rule.isActive !== undefined ? rule.isActive : true,
                createdAt: rule.createdAt || new Date().toISOString(),
                lastUpdated: rule.lastUpdated || new Date().toISOString(),
                metadata: {
                  version: '2.0.0',
                  source: 'pricingStorage',
                  ...rule.metadata
                }
              });
            }
          }
        }
      });

      console.log(`🗂️ 从专门存储中获取到区域 ${regionId} 的 ${filteredRules.length} 条其他类型价格规则`);
      return filteredRules;

    } catch (error) {
      console.error(`获取区域 ${regionId} 其他类型价格规则失败:`, error);
      return [];
    }
  }

  /**
   * 计算存储使用情况
   * 检测价格存储相关的 localStorage 使用量，监控存储容量
   * @param {Object} options - 计算选项
   * @param {boolean} options.includeRegionData - 是否包含区域配置数据大小，默认 true
   * @param {boolean} options.includeCache - 是否包含缓存数据大小，默认 false
   * @param {string} options.unit - 返回单位 ('bytes', 'kb', 'mb')，默认 'kb'
   * @returns {Object} 存储使用情况详细信息
   */
  calculateStorageUsage(options = {}) {
    const {
      includeRegionData = true,
      includeCache = false,
      unit = 'kb'
    } = options;

    try {
      const usage = {
        // 核心存储数据大小
        pricingRules: 0,
        ruleTemplates: 0,
        pricingHistory: 0,
        settings: 0,
        // 区域数据大小（可选）
        regionData: 0,
        // 缓存数据大小（可选）
        cache: 0,
        // 总计
        total: 0,
        // 元数据
        metadata: {
          unit,
          timestamp: new Date().toISOString(),
          itemCounts: {},
          largest: null,
          breakdown: []
        }
      };

      // 1. 计算核心存储数据大小
      const storageItems = [
        { key: PricingStorageV2.STORAGE_KEYS.PRICING_RULES, name: 'pricingRules' },
        { key: PricingStorageV2.STORAGE_KEYS.RULE_TEMPLATES, name: 'ruleTemplates' },
        { key: PricingStorageV2.STORAGE_KEYS.PRICING_HISTORY, name: 'pricingHistory' },
        { key: PricingStorageV2.STORAGE_KEYS.SETTINGS, name: 'settings' }
      ];

      let largestItem = { size: 0, name: '', itemCount: 0 };

      storageItems.forEach(({ key, name }) => {
        const data = localStorage.getItem(key);
        if (data) {
          // 使用 Blob 计算精确的字符串大小（支持 UTF-8）
          const blob = new Blob([data], { type: 'text/plain' });
          const sizeInBytes = blob.size;
          
          usage[name] = sizeInBytes;
          usage.total += sizeInBytes;

          // 统计项目数量
          try {
            const parsed = JSON.parse(data);
            let itemCount = 0;
            
            if (Array.isArray(parsed)) {
              itemCount = parsed.length;
            } else if (typeof parsed === 'object' && parsed !== null) {
              itemCount = Object.keys(parsed).length;
            } else {
              itemCount = 1; // 基本类型
            }
            
            usage.metadata.itemCounts[name] = itemCount;

            // 跟踪最大的存储项
            if (sizeInBytes > largestItem.size) {
              largestItem = { size: sizeInBytes, name, itemCount };
            }

            // 添加到详细分解
            usage.metadata.breakdown.push({
              name,
              sizeBytes: sizeInBytes,
              itemCount,
              storageKey: key
            });

          } catch (parseError) {
            console.warn(`解析存储数据失败 ${key}:`, parseError);
            usage.metadata.itemCounts[name] = 0;
          }
        } else {
          usage[name] = 0;
          usage.metadata.itemCounts[name] = 0;
        }
      });

      // 2. 计算区域数据大小（如果需要）
      if (includeRegionData) {
        usage.regionData = this._calculateRegionDataSize();
        usage.total += usage.regionData;

        if (usage.regionData > largestItem.size) {
          largestItem = { 
            size: usage.regionData, 
            name: 'regionData', 
            itemCount: usage.metadata.itemCounts.regionData || 0 
          };
        }
      }

      // 3. 计算缓存数据大小（如果需要）
      if (includeCache) {
        usage.cache = this._calculateCacheSize();
        usage.total += usage.cache;

        if (usage.cache > largestItem.size) {
          largestItem = { 
            size: usage.cache, 
            name: 'cache', 
            itemCount: Object.keys(this._cache).length 
          };
        }
      }

      // 4. 设置最大项元数据
      usage.metadata.largest = largestItem.size > 0 ? largestItem : null;

      // 5. 转换单位
      if (unit !== 'bytes') {
        const conversionFactor = unit === 'kb' ? 1024 : (unit === 'mb' ? 1024 * 1024 : 1);
        
        ['pricingRules', 'ruleTemplates', 'pricingHistory', 'settings', 'regionData', 'cache', 'total'].forEach(key => {
          if (usage[key] > 0) {
            usage[key] = Number((usage[key] / conversionFactor).toFixed(2));
          }
        });

        // 转换分解数据和最大项
        usage.metadata.breakdown = usage.metadata.breakdown.map(item => ({
          ...item,
          sizeBytes: Number((item.sizeBytes / conversionFactor).toFixed(2))
        }));

        if (usage.metadata.largest) {
          usage.metadata.largest.size = Number((usage.metadata.largest.size / conversionFactor).toFixed(2));
        }
      }

      console.log(`📊 存储使用情况计算完成: 总计 ${usage.total} ${unit.toUpperCase()}`);
      return usage;

    } catch (error) {
      console.error('计算存储使用情况失败:', error);
      return {
        error: error.message,
        total: 0,
        metadata: {
          unit,
          timestamp: new Date().toISOString(),
          failed: true
        }
      };
    }
  }

  /**
   * 计算区域数据的存储大小
   * @private
   * @returns {number} 区域数据大小（字节）
   */
  _calculateRegionDataSize() {
    try {
      let totalSize = 0;
      let itemCount = 0;

      // 遍历 localStorage 中所有以区域相关前缀开始的键
      const regionPrefixes = ['unified_region_data', 'region_', 'fsa_'];
      
      Object.keys(localStorage).forEach(key => {
        if (regionPrefixes.some(prefix => key.startsWith(prefix))) {
          const data = localStorage.getItem(key);
          if (data) {
            const blob = new Blob([data], { type: 'text/plain' });
            totalSize += blob.size;
            itemCount++;
          }
        }
      });

      // 更新元数据
      if (!this.metadata) this.metadata = {};
      this.metadata.itemCounts = this.metadata.itemCounts || {};
      this.metadata.itemCounts.regionData = itemCount;

      console.log(`📍 区域数据大小: ${itemCount} 项，共 ${totalSize} 字节`);
      return totalSize;

    } catch (error) {
      console.error('计算区域数据大小失败:', error);
      return 0;
    }
  }

  /**
   * 计算缓存数据的内存大小
   * @private  
   * @returns {number} 缓存大小（字节）
   */
  _calculateCacheSize() {
    try {
      let totalSize = 0;

      if (this._cache && typeof this._cache === 'object') {
        // 将缓存对象序列化为 JSON 字符串计算大小
        const cacheData = JSON.stringify(this._cache);
        const blob = new Blob([cacheData], { type: 'text/plain' });
        totalSize = blob.size;

        console.log(`💾 缓存数据大小: ${totalSize} 字节`);
      }

      return totalSize;
    } catch (error) {
      console.error('计算缓存大小失败:', error);
      return 0;
    }
  }

  /**
   * 获取localStorage容量限制信息
   * @returns {Object} 容量信息
   */
  getStorageCapacityInfo() {
    try {
      const testKey = 'storage_test_key';
      const baseSize = JSON.stringify({ timestamp: Date.now() }).length;
      let totalSize = 0;
      
      // 计算当前localStorage总使用量
      Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([key + value]).size;
        }
      });

      // 尝试估算可用空间（简单测试方法）
      let availableSpace = 0;
      try {
        const testData = 'x'.repeat(1024 * 1024); // 1MB测试数据
        localStorage.setItem(testKey, testData);
        localStorage.removeItem(testKey);
        availableSpace = 1024 * 1024; // 至少有1MB可用
      } catch (quotaError) {
        // 空间不足，尝试更小的测试
        try {
          const testData = 'x'.repeat(1024); // 1KB测试数据
          localStorage.setItem(testKey, testData);
          localStorage.removeItem(testKey);
          availableSpace = 1024; // 至少有1KB可用
        } catch (error) {
          availableSpace = 0; // 几乎没有可用空间
        }
      }

      // 根据经验估算总限制（通常是5-10MB）
      const estimatedLimit = totalSize + availableSpace + (2 * 1024 * 1024); // 保守估计

      return {
        usedBytes: totalSize,
        usedKB: Math.round(totalSize / 1024 * 100) / 100,
        usedMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        estimatedLimitMB: Math.round(estimatedLimit / (1024 * 1024) * 100) / 100,
        usagePercentage: Math.round((totalSize / estimatedLimit) * 100 * 100) / 100,
        availableBytes: availableSpace,
        timestamp: new Date().toISOString(),
        warning: totalSize > estimatedLimit * 0.8 ? '存储使用量已超过80%' : null
      };
    } catch (error) {
      console.error('获取存储容量信息失败:', error);
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 清理资源
   * 在组件卸载时调用，清理监听器和缓存
   */
  destroy() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
    
    this._clearAllCache();
    console.log('🧹 PricingStorageV2 资源已清理');
  }
}

// 导出默认实例（单例模式）
export const pricingStorageV2 = new PricingStorageV2();

// 导出静态方法和常量以便直接使用
export const { RULE_TYPES, DEFAULT_SETTINGS, STORAGE_KEYS } = PricingStorageV2;

// 创建价格规则的工厂函数
export const createPricingRule = (ruleType, regionId, config, options = {}) => {
  const baseRule = {
    id: options.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    regionId,
    ruleType,
    name: options.name || `${ruleType}价格规则`,
    config,
    priority: options.priority || 1,
    isActive: options.isActive !== undefined ? options.isActive : true,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    metadata: {
      version: '2.0.0',
      source: 'manual',
      notes: options.notes || '',
      ...options.metadata
    }
  };

  return baseRule;
};

// 创建重量价格规则的便捷函数
export const createWeightPricingRule = (regionId, min, max, price, options = {}) => {
  const config = {
    min,
    max,
    basePrice: price,
    perKgPrice: options.perKgPrice || 0,
    currency: options.currency || 'CAD'
  };

  return createPricingRule(RULE_TYPES.WEIGHT, regionId, config, {
    ...options,
    name: options.name || `重量${min}-${max}KG价格规则`
  });
};