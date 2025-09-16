// Linear Pricing Strategy
// 线性定价策略

const PricingStrategy = require('./PricingStrategy');

/**
 * 线性定价策略
 * 支持简单的单价 × 数量计算
 * 适用于每板固定价格等场景
 */
class LinearStrategy extends PricingStrategy {
  /**
   * 计算价格
   * @param {Object} model - 定价模型配置
   * @param {Object} request - 价格计算请求
   * @returns {Promise<Object>} 价格计算结果
   */
  async calculate(model, request) {
    try {
      const { configuration } = model;
      const { 
        quantity = 1,
        weight,
        distance,
        zone,
        unit = model.unit
      } = request;

      // 获取单价
      let unitPrice = this.getUnitPrice(configuration, { zone, distance });
      
      // 计算基数（根据配置决定使用数量还是重量）
      const baseUnit = configuration.baseUnit || 'quantity';
      let baseValue = quantity;
      
      switch (baseUnit) {
        case 'weight':
          if (!weight) {
            throw new Error('Weight is required for weight-based linear pricing');
          }
          baseValue = weight;
          break;
        case 'distance':
          if (!distance) {
            throw new Error('Distance is required for distance-based linear pricing');
          }
          baseValue = distance;
          break;
        case 'quantity':
        default:
          baseValue = quantity;
          break;
      }

      // 计算基础价格
      let totalPrice = unitPrice * baseValue;

      // 应用最小起步价
      if (configuration.minimumCharge && totalPrice < configuration.minimumCharge) {
        totalPrice = configuration.minimumCharge;
      }

      // 应用数量折扣（如果有）
      if (configuration.volumeDiscounts && baseValue > 0) {
        const discount = this.calculateVolumeDiscount(baseValue, configuration.volumeDiscounts);
        if (discount > 0) {
          totalPrice = totalPrice * (1 - discount);
        }
      }

      // 应用价格约束
      const finalPrice = this.applyPriceConstraints(totalPrice, configuration.constraints);

      return {
        success: true,
        price: finalPrice,
        currency: model.currency || 'CAD',
        breakdown: {
          unitPrice: unitPrice,
          quantity: baseValue,
          baseUnit: baseUnit,
          subtotal: unitPrice * baseValue,
          minimumCharge: configuration.minimumCharge,
          discount: configuration.volumeDiscounts ? 
            this.calculateVolumeDiscount(baseValue, configuration.volumeDiscounts) : 0
        },
        metadata: {
          strategy: 'Linear',
          zone: zone,
          appliedMinimum: configuration.minimumCharge && totalPrice === configuration.minimumCharge,
          appliedDiscount: configuration.volumeDiscounts ? true : false
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
   * 获取单价
   * @param {Object} configuration - 配置
   * @param {Object} context - 上下文（zone, distance等）
   * @returns {number} 单价
   */
  getUnitPrice(configuration, context = {}) {
    // 如果有区域定价
    if (context.zone && configuration.zonePrices) {
      const zonePrice = configuration.zonePrices[context.zone];
      if (zonePrice !== undefined) {
        return zonePrice;
      }
    }

    // 如果有距离定价
    if (context.distance && configuration.distanceRates) {
      for (const rate of configuration.distanceRates) {
        if (context.distance >= rate.minDistance && 
            (!rate.maxDistance || context.distance <= rate.maxDistance)) {
          return rate.pricePerUnit;
        }
      }
    }

    // 返回默认单价
    if (configuration.pricePerUnit === undefined) {
      throw new Error('Price per unit is not configured');
    }

    return configuration.pricePerUnit;
  }

  /**
   * 计算批量折扣
   * @param {number} quantity - 数量
   * @param {Array} volumeDiscounts - 折扣配置
   * @returns {number} 折扣率（0-1之间）
   */
  calculateVolumeDiscount(quantity, volumeDiscounts) {
    if (!volumeDiscounts || !Array.isArray(volumeDiscounts)) {
      return 0;
    }

    // 按最小数量排序
    const sortedDiscounts = [...volumeDiscounts].sort((a, b) => b.minQuantity - a.minQuantity);
    
    // 找到适用的折扣
    for (const discount of sortedDiscounts) {
      if (quantity >= discount.minQuantity) {
        return discount.discountRate || discount.discountPercentage / 100 || 0;
      }
    }

    return 0;
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

    // 必须有某种形式的单价配置
    if (configuration.pricePerUnit === undefined && 
        !configuration.zonePrices && 
        !configuration.distanceRates) {
      errors.push('Must configure pricePerUnit, zonePrices, or distanceRates');
    }

    // 验证基础单价
    if (configuration.pricePerUnit !== undefined && configuration.pricePerUnit < 0) {
      errors.push('Price per unit must be non-negative');
    }

    // 验证区域价格
    if (configuration.zonePrices) {
      Object.entries(configuration.zonePrices).forEach(([zone, price]) => {
        if (price < 0) {
          errors.push(`Zone ${zone} price must be non-negative`);
        }
      });
    }

    // 验证距离费率
    if (configuration.distanceRates) {
      configuration.distanceRates.forEach((rate, index) => {
        if (!rate.minDistance && rate.minDistance !== 0) {
          errors.push(`Distance rate ${index + 1} must have minDistance`);
        }
        if (rate.pricePerUnit === undefined || rate.pricePerUnit < 0) {
          errors.push(`Distance rate ${index + 1} must have valid pricePerUnit`);
        }
      });
    }

    // 验证批量折扣
    if (configuration.volumeDiscounts) {
      configuration.volumeDiscounts.forEach((discount, index) => {
        if (!discount.minQuantity || discount.minQuantity <= 0) {
          errors.push(`Volume discount ${index + 1} must have positive minQuantity`);
        }
        const rate = discount.discountRate || discount.discountPercentage / 100 || 0;
        if (rate < 0 || rate > 1) {
          errors.push(`Volume discount ${index + 1} rate must be between 0 and 1`);
        }
      });
    }

    // 验证最小起步价
    if (configuration.minimumCharge && configuration.minimumCharge < 0) {
      errors.push('Minimum charge must be non-negative');
    }

    // 验证基础单位
    const validBaseUnits = ['quantity', 'weight', 'distance'];
    if (configuration.baseUnit && !validBaseUnits.includes(configuration.baseUnit)) {
      errors.push(`Invalid base unit: ${configuration.baseUnit}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成价格表预览
   * @param {Object} model - 定价模型
   * @param {Array} quantities - 要预览的数量数组
   * @returns {Array} 价格预览
   */
  generatePricePreview(model, quantities = [1, 5, 10, 20, 50, 100]) {
    const { configuration } = model;
    const preview = [];

    quantities.forEach(quantity => {
      const result = this.calculate(model, { quantity });
      
      if (result.success) {
        const entry = {
          quantity,
          price: result.price,
          unitPrice: this.formatPrice(result.price / quantity)
        };

        // 添加折扣信息
        if (configuration.volumeDiscounts) {
          const discount = this.calculateVolumeDiscount(quantity, configuration.volumeDiscounts);
          if (discount > 0) {
            entry.discount = `${(discount * 100).toFixed(1)}%`;
            entry.originalPrice = this.formatPrice(
              result.breakdown.unitPrice * quantity
            );
          }
        }

        preview.push(entry);
      }
    });

    return preview;
  }

  /**
   * 创建简单的线性定价配置
   * @param {number} pricePerUnit - 单价
   * @param {Object} options - 选项
   * @returns {Object} 配置对象
   */
  static createSimpleConfig(pricePerUnit, options = {}) {
    return {
      pricePerUnit,
      baseUnit: options.baseUnit || 'quantity',
      minimumCharge: options.minimumCharge,
      volumeDiscounts: options.volumeDiscounts,
      constraints: options.constraints
    };
  }

  /**
   * 创建区域定价配置
   * @param {Object} zonePrices - 区域价格映射
   * @param {Object} options - 选项
   * @returns {Object} 配置对象
   */
  static createZoneConfig(zonePrices, options = {}) {
    return {
      zonePrices,
      pricePerUnit: options.defaultPrice,
      baseUnit: options.baseUnit || 'quantity',
      minimumCharge: options.minimumCharge,
      volumeDiscounts: options.volumeDiscounts,
      constraints: options.constraints
    };
  }
}

module.exports = LinearStrategy;