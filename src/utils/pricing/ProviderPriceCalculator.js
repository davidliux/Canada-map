// Provider Price Calculator
// 服务商价格计算引擎

const WeightZoneStrategy = require('./strategies/WeightZoneStrategy');
const FirstContStrategy = require('./strategies/FirstContStrategy');
const FixedTableStrategy = require('./strategies/FixedTableStrategy');
const LinearStrategy = require('./strategies/LinearStrategy');

/**
 * 服务商价格计算器
 * 整合所有定价策略，提供统一的价格计算接口
 */
class ProviderPriceCalculator {
  constructor() {
    // 注册所有策略
    this.strategies = new Map();
    this.registerStrategies();
    
    // 缓存
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 注册定价策略
   */
  registerStrategies() {
    this.strategies.set('WEIGHT_ZONE', new WeightZoneStrategy());
    this.strategies.set('FIRST_CONT', new FirstContStrategy());
    this.strategies.set('FIXED_TABLE', new FixedTableStrategy());
    this.strategies.set('LINEAR', new LinearStrategy());
    
    // 可以添加更多策略
    // this.strategies.set('TIERED', new TieredStrategy());
    // this.strategies.set('CUSTOM', new CustomStrategy());
  }

  /**
   * 计算单个服务商的价格
   * @param {Object} provider - 服务商信息
   * @param {Object} request - 价格计算请求
   * @returns {Promise<Object>} 价格计算结果
   */
  async calculateProviderPrice(provider, request) {
    try {
      // 检查缓存
      const cacheKey = this.getCacheKey(provider.id, request);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // 确定适用的定价模型
      const pricingModel = await this.selectPricingModel(provider, request);
      if (!pricingModel) {
        throw new Error(`No pricing model found for provider ${provider.name}`);
      }

      // 获取对应的策略
      const strategy = this.strategies.get(pricingModel.type);
      if (!strategy) {
        throw new Error(`Pricing strategy ${pricingModel.type} not implemented`);
      }

      // 计算基础价格
      const priceResult = await strategy.calculate(pricingModel, request);
      if (!priceResult.success) {
        throw new Error(priceResult.error || 'Price calculation failed');
      }

      // 计算附加费用
      const surcharges = await this.calculateSurcharges(provider, request);
      
      // 组装最终结果
      const totalPrice = priceResult.price + surcharges.total;
      
      const result = {
        providerId: provider.id,
        providerName: provider.name,
        providerCode: provider.code,
        basePrice: priceResult.price,
        surcharges: surcharges,
        totalPrice: this.formatPrice(totalPrice),
        currency: pricingModel.currency || 'CAD',
        breakdown: {
          base: priceResult.breakdown,
          surcharges: surcharges.breakdown
        },
        metadata: {
          pricingModelId: pricingModel.id,
          pricingModelName: pricingModel.name,
          pricingType: pricingModel.type,
          zone: request.zone,
          calculatedAt: new Date().toISOString()
        }
      };

      // 存入缓存
      this.saveToCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error calculating provider price:', error);
      return {
        providerId: provider.id,
        providerName: provider.name,
        error: error.message,
        totalPrice: 0,
        success: false
      };
    }
  }

  /**
   * 计算多个服务商的价格
   * @param {Array} providers - 服务商列表
   * @param {Object} request - 价格计算请求
   * @returns {Promise<Array>} 价格计算结果列表
   */
  async calculateMultipleProviders(providers, request) {
    const results = await Promise.all(
      providers.map(provider => this.calculateProviderPrice(provider, request))
    );

    // 按价格排序
    return results
      .filter(r => !r.error)
      .sort((a, b) => a.totalPrice - b.totalPrice);
  }

  /**
   * 选择适用的定价模型
   * @param {Object} provider - 服务商
   * @param {Object} request - 请求
   * @returns {Promise<Object>} 定价模型
   */
  async selectPricingModel(provider, request) {
    if (!provider.pricingModels || provider.pricingModels.length === 0) {
      return null;
    }

    const now = new Date();
    
    // 筛选有效的定价模型
    const validModels = provider.pricingModels.filter(model => {
      // 检查是否激活
      if (!model.isActive) return false;
      
      // 检查日期范围
      if (model.effectiveDate && new Date(model.effectiveDate) > now) return false;
      if (model.expiryDate && new Date(model.expiryDate) < now) return false;
      
      // 检查Zone适用性
      if (model.zones && model.zones.length > 0 && request.zone) {
        const zones = Array.isArray(model.zones) ? model.zones : JSON.parse(model.zones);
        if (!zones.includes(request.zone)) return false;
      }
      
      return true;
    });

    if (validModels.length === 0) {
      return null;
    }

    // 按优先级排序，选择优先级最高的
    validModels.sort((a, b) => a.priority - b.priority);
    
    return validModels[0];
  }

  /**
   * 计算附加费用
   * @param {Object} provider - 服务商
   * @param {Object} request - 请求
   * @returns {Promise<Object>} 附加费用结果
   */
  async calculateSurcharges(provider, request) {
    const surcharges = {
      total: 0,
      breakdown: []
    };

    if (!provider.surcharges || provider.surcharges.length === 0) {
      return surcharges;
    }

    const now = new Date();
    const applicableSurcharges = [];

    // 筛选适用的附加费
    for (const surcharge of provider.surcharges) {
      // 检查是否激活
      if (!surcharge.isActive) continue;
      
      // 检查日期范围
      if (surcharge.effectiveDate && new Date(surcharge.effectiveDate) > now) continue;
      if (surcharge.expiryDate && new Date(surcharge.expiryDate) < now) continue;
      
      // 检查条件
      if (this.checkSurchargeConditions(surcharge, request)) {
        applicableSurcharges.push(surcharge);
      }
    }

    // 按优先级排序
    applicableSurcharges.sort((a, b) => a.priority - b.priority);

    // 计算每个附加费
    for (const surcharge of applicableSurcharges) {
      const amount = this.calculateSurchargeAmount(surcharge, request, surcharges.total);
      
      if (amount > 0) {
        surcharges.breakdown.push({
          code: surcharge.code,
          name: surcharge.name,
          type: surcharge.type,
          amount: this.formatPrice(amount)
        });
        
        // 检查是否可叠加
        if (surcharge.stackable) {
          surcharges.total += amount;
        } else {
          // 不可叠加的费用取最大值
          surcharges.total = Math.max(surcharges.total, amount);
        }
      }
    }

    surcharges.total = this.formatPrice(surcharges.total);
    
    return surcharges;
  }

  /**
   * 检查附加费条件
   * @param {Object} surcharge - 附加费配置
   * @param {Object} request - 请求
   * @returns {boolean} 是否满足条件
   */
  checkSurchargeConditions(surcharge, request) {
    if (!surcharge.conditions || surcharge.conditions.length === 0) {
      return true; // 无条件，始终适用
    }

    const conditions = Array.isArray(surcharge.conditions) 
      ? surcharge.conditions 
      : JSON.parse(surcharge.conditions);

    // 检查所有条件（AND逻辑）
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(request, condition.field);
      
      if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取字段值
   * @param {Object} request - 请求对象
   * @param {string} field - 字段路径
   * @returns {any} 字段值
   */
  getFieldValue(request, field) {
    const parts = field.split('.');
    let value = request;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * 评估条件
   * @param {any} fieldValue - 字段值
   * @param {string} operator - 操作符
   * @param {any} conditionValue - 条件值
   * @returns {boolean} 是否满足条件
   */
  evaluateCondition(fieldValue, operator, conditionValue) {
    switch (operator) {
      case 'equals':
      case '==':
        return fieldValue == conditionValue;
      
      case 'not_equals':
      case '!=':
        return fieldValue != conditionValue;
      
      case 'greater_than':
      case '>':
        return fieldValue > conditionValue;
      
      case 'greater_than_or_equal':
      case '>=':
        return fieldValue >= conditionValue;
      
      case 'less_than':
      case '<':
        return fieldValue < conditionValue;
      
      case 'less_than_or_equal':
      case '<=':
        return fieldValue <= conditionValue;
      
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      
      case 'not_exists':
        return fieldValue === undefined || fieldValue === null;
      
      default:
        return false;
    }
  }

  /**
   * 计算附加费金额
   * @param {Object} surcharge - 附加费配置
   * @param {Object} request - 请求
   * @param {number} currentTotal - 当前总价
   * @returns {number} 附加费金额
   */
  calculateSurchargeAmount(surcharge, request, currentTotal) {
    const { calculation, value } = surcharge;
    
    switch (calculation) {
      case 'FIXED':
        return Number(value) || 0;
      
      case 'PERCENTAGE':
        // 基于当前总价的百分比
        return (currentTotal * Number(value)) / 100;
      
      case 'PER_UNIT':
        // 按单位计费
        const quantity = request.quantity || 1;
        return (Number(value) || 0) * quantity;
      
      default:
        return 0;
    }
  }

  /**
   * 生成缓存键
   * @param {string} providerId - 服务商ID
   * @param {Object} request - 请求
   * @returns {string} 缓存键
   */
  getCacheKey(providerId, request) {
    const key = {
      providerId,
      origin: request.origin,
      destination: request.destination,
      zone: request.zone,
      quantity: request.quantity,
      weight: request.weight,
      deliveryType: request.deliveryType
    };
    
    return JSON.stringify(key);
  }

  /**
   * 从缓存获取
   * @param {string} key - 缓存键
   * @returns {Object|null} 缓存的结果
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { ...cached.data, fromCache: true };
    }
    
    // 清理过期缓存
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * 保存到缓存
   * @param {string} key - 缓存键
   * @param {Object} data - 数据
   */
  saveToCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 限制缓存大小
    if (this.cache.size > 1000) {
      // 删除最早的条目
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 格式化价格
   * @param {number} price - 价格
   * @returns {number} 格式化后的价格
   */
  formatPrice(price) {
    return Math.round(price * 100) / 100;
  }

  /**
   * 比较多个报价
   * @param {Array} quotes - 报价列表
   * @returns {Object} 比较结果
   */
  compareQuotes(quotes) {
    if (!quotes || quotes.length === 0) {
      return null;
    }

    const validQuotes = quotes.filter(q => !q.error);
    
    if (validQuotes.length === 0) {
      return null;
    }

    // 按价格排序
    validQuotes.sort((a, b) => a.totalPrice - b.totalPrice);
    
    const cheapest = validQuotes[0];
    const mostExpensive = validQuotes[validQuotes.length - 1];
    const average = validQuotes.reduce((sum, q) => sum + q.totalPrice, 0) / validQuotes.length;
    
    return {
      cheapest: {
        provider: cheapest.providerName,
        price: cheapest.totalPrice
      },
      mostExpensive: {
        provider: mostExpensive.providerName,
        price: mostExpensive.totalPrice
      },
      average: this.formatPrice(average),
      savings: this.formatPrice(mostExpensive.totalPrice - cheapest.totalPrice),
      savingsPercentage: this.formatPrice(
        ((mostExpensive.totalPrice - cheapest.totalPrice) / mostExpensive.totalPrice) * 100
      ),
      quotes: validQuotes
    };
  }
}

// 创建单例
const calculator = new ProviderPriceCalculator();

module.exports = calculator;
module.exports.ProviderPriceCalculator = ProviderPriceCalculator;