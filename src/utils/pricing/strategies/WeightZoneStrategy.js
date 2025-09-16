// Weight Zone Pricing Strategy
// 重量区间+Zone矩阵定价策略

const PricingStrategy = require('./PricingStrategy');

/**
 * 重量区间定价策略
 * 支持基于重量区间和Zone的矩阵定价
 * 类似于您提供的第一张图片的定价模式
 */
class WeightZoneStrategy extends PricingStrategy {
  /**
   * 计算价格
   * @param {Object} model - 定价模型配置
   * @param {Object} request - 价格计算请求
   * @returns {Promise<Object>} 价格计算结果
   */
  async calculate(model, request) {
    try {
      const { configuration } = model;
      const { weight, weightUnit = 'skids', zone, quantity = 1 } = request;

      // 验证必要参数
      if (!weight || !zone) {
        throw new Error('Weight and zone are required for weight zone pricing');
      }

      // 转换重量单位（如果需要）
      const normalizedWeight = this.normalizeWeight(weight, weightUnit, configuration.weightUnit);

      // 查找适用的重量区间
      const weightRange = this.findWeightRange(normalizedWeight, configuration.weightRanges);
      if (!weightRange) {
        throw new Error(`No price defined for weight ${normalizedWeight} ${configuration.weightUnit}`);
      }

      // 查找Zone价格
      const zonePrice = this.findZonePrice(
        weightRange.id,
        zone,
        configuration.zonePrices
      );

      if (!zonePrice) {
        throw new Error(`No price defined for zone ${zone} in weight range ${weightRange.label}`);
      }

      // 计算基础价格
      let basePrice = zonePrice.price;

      // 如果有多个单位，计算总价
      if (quantity > 1) {
        basePrice = basePrice * quantity;
      }

      // 应用价格约束
      const finalPrice = this.applyPriceConstraints(basePrice, configuration.constraints);

      // 生成价格明细
      const breakdown = this.generateBreakdown({
        basePrice: zonePrice.price,
        quantity: quantity,
        weightRange: weightRange.label,
        zone: zone
      });

      return {
        success: true,
        price: finalPrice,
        currency: model.currency || 'CAD',
        breakdown: breakdown,
        metadata: {
          strategy: 'WeightZone',
          weightRange: weightRange,
          zone: zone,
          unitPrice: zonePrice.price,
          quantity: quantity
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        price: 0
      };
    }
  }

  /**
   * 验证配置
   * @param {Object} model - 定价模型配置
   * @returns {Object} 验证结果
   */
  validate(model) {
    const errors = [];
    const { configuration } = model;

    if (!configuration) {
      errors.push('Configuration is required');
      return { valid: false, errors };
    }

    if (!configuration.weightRanges || !Array.isArray(configuration.weightRanges)) {
      errors.push('Weight ranges must be defined as an array');
    } else if (configuration.weightRanges.length === 0) {
      errors.push('At least one weight range must be defined');
    } else {
      // 验证重量区间
      configuration.weightRanges.forEach((range, index) => {
        if (!range.id) {
          errors.push(`Weight range ${index + 1} must have an id`);
        }
        if (range.min === undefined || range.max === undefined) {
          errors.push(`Weight range ${index + 1} must have min and max values`);
        }
        if (range.min >= range.max) {
          errors.push(`Weight range ${index + 1}: min must be less than max`);
        }
      });
    }

    if (!configuration.zonePrices || !Array.isArray(configuration.zonePrices)) {
      errors.push('Zone prices must be defined as an array');
    } else if (configuration.zonePrices.length === 0) {
      errors.push('At least one zone price must be defined');
    } else {
      // 验证Zone价格
      configuration.zonePrices.forEach((zonePrice, index) => {
        if (!zonePrice.weightRangeId) {
          errors.push(`Zone price ${index + 1} must have a weightRangeId`);
        }
        if (!zonePrice.zoneId) {
          errors.push(`Zone price ${index + 1} must have a zoneId`);
        }
        if (zonePrice.price === undefined || zonePrice.price < 0) {
          errors.push(`Zone price ${index + 1} must have a valid price`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 查找适用的重量区间
   * @param {number} weight - 重量
   * @param {Array} weightRanges - 重量区间配置
   * @returns {Object|null} 匹配的重量区间
   */
  findWeightRange(weight, weightRanges) {
    // 先尝试精确匹配
    for (const range of weightRanges) {
      if (weight >= range.min && weight <= range.max) {
        return {
          id: range.id,
          min: range.min,
          max: range.max,
          label: range.label || `${range.min}-${range.max}`,
          unit: range.unit
        };
      }
    }

    // 如果没有精确匹配，查找最接近的区间
    // 如果重量超过最大区间，使用最大区间（通常是16+的情况）
    const sortedRanges = [...weightRanges].sort((a, b) => b.max - a.max);
    const maxRange = sortedRanges[0];
    
    if (weight > maxRange.max && maxRange.label && maxRange.label.includes('+')) {
      return {
        id: maxRange.id,
        min: maxRange.min,
        max: Infinity,
        label: maxRange.label,
        unit: maxRange.unit
      };
    }

    return null;
  }

  /**
   * 查找Zone价格
   * @param {string} weightRangeId - 重量区间ID
   * @param {string} zoneId - Zone ID
   * @param {Array} zonePrices - Zone价格配置
   * @returns {Object|null} 匹配的价格
   */
  findZonePrice(weightRangeId, zoneId, zonePrices) {
    // 精确匹配
    const exactMatch = zonePrices.find(
      zp => zp.weightRangeId === weightRangeId && zp.zoneId === zoneId
    );

    if (exactMatch) {
      return exactMatch;
    }

    // 尝试忽略大小写匹配
    const caseInsensitiveMatch = zonePrices.find(
      zp => zp.weightRangeId === weightRangeId && 
           zp.zoneId.toLowerCase() === zoneId.toLowerCase()
    );

    return caseInsensitiveMatch;
  }

  /**
   * 标准化重量单位
   * @param {number} weight - 原始重量
   * @param {string} fromUnit - 原始单位
   * @param {string} toUnit - 目标单位
   * @returns {number} 转换后的重量
   */
  normalizeWeight(weight, fromUnit, toUnit) {
    if (fromUnit === toUnit) {
      return weight;
    }

    // 定义转换系数（到kg的转换）
    const toKg = {
      'kg': 1,
      'lbs': 0.453592,
      'skids': 500, // 假设1 skid = 500kg
      'pallets': 400, // 假设1 pallet = 400kg
      'tons': 1000
    };

    // 转换到kg
    const weightInKg = weight * (toKg[fromUnit] || 1);
    
    // 从kg转换到目标单位
    const finalWeight = weightInKg / (toKg[toUnit] || 1);

    return Math.round(finalWeight * 100) / 100;
  }

  /**
   * 生成价格预览表
   * @param {Object} model - 定价模型
   * @returns {Array} 价格预览表
   */
  generatePriceTable(model) {
    const { configuration } = model;
    const table = [];

    configuration.weightRanges.forEach(range => {
      const row = {
        weightRange: range.label || `${range.min}-${range.max}`,
        prices: {}
      };

      // 获取所有unique的zones
      const zones = [...new Set(configuration.zonePrices.map(zp => zp.zoneId))];
      
      zones.forEach(zone => {
        const zonePrice = this.findZonePrice(range.id, zone, configuration.zonePrices);
        row.prices[zone] = zonePrice ? zonePrice.price : null;
      });

      table.push(row);
    });

    return table;
  }
}

module.exports = WeightZoneStrategy;