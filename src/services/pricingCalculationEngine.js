/**
 * 板数定价计算引擎
 * 支持多种定价模式和层级优先级计算
 */

class PricingCalculationEngine {
  constructor(configurations = new Map()) {
    this.configurations = configurations;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 更新配置
   */
  updateConfigurations(configurations) {
    this.configurations = configurations;
    this.clearCache();
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 计算价格
   * @param {Object} params - 计算参数
   * @param {string} params.cityId - 城市ID
   * @param {string} [params.zoneId] - 区域ID
   * @param {string} [params.groupId] - 分组ID
   * @param {number} params.skidCount - 板数
   * @returns {Object} 计算结果
   */
  calculate(params) {
    const { cityId, zoneId, groupId, skidCount } = params;

    // 生成缓存键
    const cacheKey = `${cityId}-${zoneId || ''}-${groupId || ''}-${skidCount}`;

    // 检查缓存
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    // 查找适用的定价配置
    const applicableConfig = this.findApplicableConfig(params);

    if (!applicableConfig) {
      throw new Error('未找到适用的定价配置');
    }

    // 根据定价模式计算价格
    const price = this.calculateByMode(applicableConfig.config, skidCount);

    // 构建计算结果
    const result = this.buildResult(applicableConfig, params, price);

    // 缓存结果
    this.setCachedResult(cacheKey, result);

    return result;
  }

  /**
   * 批量计算价格
   * @param {Array} requests - 批量计算请求
   * @returns {Array} 计算结果数组
   */
  batchCalculate(requests) {
    return requests.map(request => {
      try {
        return {
          requestId: request.id,
          ...this.calculate(request.params),
          success: true
        };
      } catch (error) {
        return {
          requestId: request.id,
          success: false,
          error: error.message
        };
      }
    });
  }

  /**
   * 查找适用的定价配置
   * 优先级: Group > Zone > City
   */
  findApplicableConfig(params) {
    const { cityId, zoneId, groupId } = params;

    // 1. 尝试查找分组级别的配置
    if (groupId) {
      const groupConfig = this.findConfigByTarget('group', groupId);
      if (groupConfig && groupConfig.isActive) {
        return groupConfig;
      }
    }

    // 2. 尝试查找区域级别的配置
    if (zoneId) {
      const zoneConfig = this.findConfigByTarget('zone', zoneId);
      if (zoneConfig && zoneConfig.isActive) {
        return zoneConfig;
      }
    }

    // 3. 尝试查找城市级别的配置
    const cityConfig = this.findConfigByTarget('city', cityId);
    if (cityConfig && cityConfig.isActive) {
      return cityConfig;
    }

    return null;
  }

  /**
   * 根据目标查找配置
   */
  findConfigByTarget(level, targetId) {
    for (const [key, config] of this.configurations) {
      if (config.level === level && config.targetId === targetId) {
        return config;
      }
    }
    return null;
  }

  /**
   * 根据模式计算价格
   */
  calculateByMode(config, skidCount) {
    if (!config || !config.type) {
      throw new Error('无效的定价配置');
    }

    switch (config.type) {
      case 'fixed':
        return this.calculateFixed(config, skidCount);
      case 'progressive':
        return this.calculateProgressive(config, skidCount);
      case 'tiered':
        return this.calculateTiered(config, skidCount);
      case 'truckload':
        return this.calculateTruckload(config, skidCount);
      default:
        throw new Error(`未知的定价模式: ${config.type}`);
    }
  }

  /**
   * 计算固定价格
   */
  calculateFixed(config, skidCount) {
    if (!config.pricePerSkid || config.pricePerSkid < 0) {
      throw new Error('无效的固定价格配置');
    }
    return config.pricePerSkid * skidCount;
  }

  /**
   * 计算首续托定价
   */
  calculateProgressive(config, skidCount) {
    const { firstSkidPrice, additionalSkidPrice, firstSkidCount } = config;

    if (!firstSkidPrice || !additionalSkidPrice || !firstSkidCount) {
      throw new Error('无效的首续托定价配置');
    }

    if (skidCount <= firstSkidCount) {
      return firstSkidPrice * skidCount;
    }

    const firstPartPrice = firstSkidPrice * firstSkidCount;
    const additionalSkids = skidCount - firstSkidCount;
    const additionalPrice = additionalSkidPrice * additionalSkids;

    return firstPartPrice + additionalPrice;
  }

  /**
   * 计算阶梯定价
   */
  calculateTiered(config, skidCount) {
    if (!config.tiers || config.tiers.length === 0) {
      throw new Error('无效的阶梯定价配置');
    }

    // 查找适用的价格阶梯
    const applicableTier = config.tiers.find(tier =>
      skidCount >= tier.minQuantity &&
      (tier.maxQuantity === null || skidCount <= tier.maxQuantity)
    );

    if (!applicableTier) {
      throw new Error(`未找到适用于 ${skidCount} 板的价格阶梯`);
    }

    return applicableTier.pricePerSkid * skidCount;
  }

  /**
   * 计算整车定价
   */
  calculateTruckload(config, skidCount) {
    const { minSkidsForTruckload, truckloadPrice, belowTruckloadConfig } = config;

    if (!minSkidsForTruckload || !truckloadPrice) {
      throw new Error('无效的整车定价配置');
    }

    // 达到整车数量，使用整车价格
    if (skidCount >= minSkidsForTruckload) {
      return truckloadPrice;
    }

    // 低于整车数量，使用备用定价模式
    if (!belowTruckloadConfig) {
      throw new Error('缺少低于整车数量的定价配置');
    }

    return this.calculateByMode(belowTruckloadConfig, skidCount);
  }

  /**
   * 构建计算结果
   */
  buildResult(config, params, totalPrice) {
    const { skidCount } = params;
    const unitPrice = totalPrice / skidCount;

    return {
      requestId: this.generateRequestId(),
      skidCount: skidCount,
      appliedRule: {
        level: config.level,
        targetId: config.targetId,
        targetName: config.targetName || '',
        mode: config.mode,
        configId: config.id
      },
      breakdown: {
        unitPrice: unitPrice,
        quantity: skidCount,
        subtotal: totalPrice,
        discounts: [],
        taxes: []
      },
      totalPrice: totalPrice,
      currency: 'CAD',
      calculatedAt: new Date(),
      cacheHit: false
    };
  }

  /**
   * 获取缓存结果
   */
  getCachedResult(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return {
        ...cached.result,
        cacheHit: true
      };
    }
    return null;
  }

  /**
   * 设置缓存结果
   */
  setCachedResult(key, result) {
    this.cache.set(key, {
      result: result,
      timestamp: Date.now()
    });

    // 限制缓存大小
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * 生成请求ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证配置
   * @param {Object} config - 定价配置
   * @returns {Object} 验证结果
   */
  validateConfiguration(config) {
    const errors = [];

    if (!config.mode) {
      errors.push('缺少定价模式');
    }

    if (!config.config || !config.config.type) {
      errors.push('缺少配置类型');
    }

    switch (config.config?.type) {
      case 'fixed':
        if (!config.config.pricePerSkid || config.config.pricePerSkid < 0) {
          errors.push('固定价格必须大于0');
        }
        break;

      case 'progressive':
        if (!config.config.firstSkidPrice || config.config.firstSkidPrice < 0) {
          errors.push('首托价格必须大于0');
        }
        if (!config.config.additionalSkidPrice || config.config.additionalSkidPrice < 0) {
          errors.push('续托价格必须大于0');
        }
        if (!config.config.firstSkidCount || config.config.firstSkidCount < 1) {
          errors.push('首托板数必须大于0');
        }
        break;

      case 'tiered':
        if (!config.config.tiers || config.config.tiers.length === 0) {
          errors.push('阶梯定价必须包含至少一个价格阶梯');
        }

        // 验证阶梯连续性
        const tiers = config.config.tiers.sort((a, b) => a.minQuantity - b.minQuantity);
        for (let i = 0; i < tiers.length - 1; i++) {
          if (tiers[i].maxQuantity === null && i < tiers.length - 1) {
            errors.push(`阶梯 ${i + 1} 的最大值不能为空`);
          }
          if (tiers[i].maxQuantity !== null && tiers[i + 1].minQuantity !== tiers[i].maxQuantity + 1) {
            errors.push(`阶梯之间存在断层或重叠`);
          }
        }
        break;

      case 'truckload':
        if (!config.config.minSkidsForTruckload || config.config.minSkidsForTruckload < 1) {
          errors.push('整车起始板数必须大于0');
        }
        if (!config.config.truckloadPrice || config.config.truckloadPrice < 0) {
          errors.push('整车价格必须大于0');
        }
        if (!config.config.belowTruckloadConfig) {
          errors.push('缺少低于整车数量的定价配置');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * 获取价格范围
   * @param {Object} config - 定价配置
   * @returns {Object} 价格范围
   */
  getPriceRange(config) {
    switch (config.type) {
      case 'fixed':
        return {
          min: config.pricePerSkid,
          max: config.pricePerSkid,
          unit: 'per_skid'
        };

      case 'progressive':
        return {
          min: Math.min(config.firstSkidPrice, config.additionalSkidPrice),
          max: Math.max(config.firstSkidPrice, config.additionalSkidPrice),
          unit: 'per_skid'
        };

      case 'tiered':
        const prices = config.tiers.map(t => t.pricePerSkid);
        return {
          min: Math.min(...prices),
          max: Math.max(...prices),
          unit: 'per_skid'
        };

      case 'truckload':
        return {
          min: config.truckloadPrice / config.minSkidsForTruckload,
          max: null,
          unit: 'per_skid',
          truckloadPrice: config.truckloadPrice
        };

      default:
        return { min: null, max: null };
    }
  }

  /**
   * 导出配置
   * @param {string} format - 导出格式 (json, csv)
   * @returns {string} 导出数据
   */
  exportConfigurations(format = 'json') {
    const configs = Array.from(this.configurations.values());

    if (format === 'json') {
      return JSON.stringify(configs, null, 2);
    }

    if (format === 'csv') {
      const headers = ['ID', 'Level', 'Target', 'Mode', 'Config', 'Priority', 'Active'];
      const rows = configs.map(c => [
        c.id,
        c.level,
        c.targetId,
        c.mode,
        JSON.stringify(c.config),
        c.priority,
        c.isActive
      ]);

      return [headers, ...rows]
        .map(row => row.join(','))
        .join('\n');
    }

    throw new Error(`不支持的导出格式: ${format}`);
  }

  /**
   * 导入配置
   * @param {string} data - 导入数据
   * @param {string} format - 数据格式
   * @returns {Object} 导入结果
   */
  importConfigurations(data, format = 'json') {
    try {
      let configs = [];

      if (format === 'json') {
        configs = JSON.parse(data);
      } else if (format === 'csv') {
        // CSV解析逻辑
        const lines = data.split('\n');
        const headers = lines[0].split(',');

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          const config = {};
          headers.forEach((header, index) => {
            config[header.toLowerCase()] = values[index];
          });
          configs.push(config);
        }
      }

      // 验证并导入配置
      const results = {
        total: configs.length,
        success: 0,
        failed: 0,
        errors: []
      };

      configs.forEach(config => {
        const validation = this.validateConfiguration(config);
        if (validation.valid) {
          this.configurations.set(config.id, config);
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            config: config.id,
            errors: validation.errors
          });
        }
      });

      this.clearCache();
      return results;

    } catch (error) {
      throw new Error(`导入失败: ${error.message}`);
    }
  }
}

// 创建单例实例
const pricingEngine = new PricingCalculationEngine();

export default pricingEngine;
export { PricingCalculationEngine };