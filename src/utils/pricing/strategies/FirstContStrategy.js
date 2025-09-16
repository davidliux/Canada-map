// First Continuation Pricing Strategy
// 首续模式定价策略

const PricingStrategy = require('./PricingStrategy');

/**
 * 首续模式定价策略
 * 支持首托/首板价格 + 续托/续板价格的计算模式
 * 类似于您提供的第二、四张图片的定价模式
 */
class FirstContStrategy extends PricingStrategy {
  /**
   * 计算价格
   * @param {Object} model - 定价模型配置
   * @param {Object} request - 价格计算请求
   * @returns {Promise<Object>} 价格计算结果
   */
  async calculate(model, request) {
    try {
      const { configuration } = model;
      const { quantity, unit = model.unit, zone } = request;

      // 验证必要参数
      if (!quantity || quantity <= 0) {
        throw new Error('Quantity must be greater than 0');
      }

      // 获取区域配置（如果有）
      const zoneConfig = this.getZoneConfig(configuration, zone);
      const config = zoneConfig || configuration;

      // 提取配置参数
      const {
        firstUnit,
        continuationUnit,
        maxUnitsPerVehicle,
        priceCapPerVehicle,
        multiVehicleHandling = 'continue' // continue 或 restart
      } = config;

      // 计算价格
      let totalPrice = 0;
      let breakdown = [];
      let vehicleCount = 1;
      let remainingQuantity = quantity;

      // 如果有车辆限制，需要分车计算
      if (maxUnitsPerVehicle && quantity > maxUnitsPerVehicle) {
        vehicleCount = Math.ceil(quantity / maxUnitsPerVehicle);
        
        for (let v = 1; v <= vehicleCount; v++) {
          const vehicleQuantity = Math.min(remainingQuantity, maxUnitsPerVehicle);
          
          let vehiclePrice = 0;
          if (multiVehicleHandling === 'restart') {
            // 每辆车都从首单位开始计算
            vehiclePrice = this.calculateSingleVehicle(
              vehicleQuantity,
              firstUnit,
              continuationUnit
            );
          } else {
            // 连续计算
            const isFirstVehicle = v === 1;
            vehiclePrice = this.calculateContinuous(
              vehicleQuantity,
              firstUnit,
              continuationUnit,
              isFirstVehicle
            );
          }

          // 应用价格上限
          if (priceCapPerVehicle && vehiclePrice > priceCapPerVehicle) {
            vehiclePrice = priceCapPerVehicle;
          }

          totalPrice += vehiclePrice;
          breakdown.push({
            vehicle: v,
            quantity: vehicleQuantity,
            price: this.formatPrice(vehiclePrice),
            capped: priceCapPerVehicle && vehiclePrice >= priceCapPerVehicle
          });

          remainingQuantity -= vehicleQuantity;
        }
      } else {
        // 单车计算
        totalPrice = this.calculateSingleVehicle(
          quantity,
          firstUnit,
          continuationUnit
        );

        // 应用价格上限
        if (priceCapPerVehicle && totalPrice > priceCapPerVehicle) {
          totalPrice = priceCapPerVehicle;
        }

        breakdown.push({
          vehicle: 1,
          quantity: quantity,
          price: this.formatPrice(totalPrice),
          capped: priceCapPerVehicle && totalPrice >= priceCapPerVehicle
        });
      }

      // 应用价格约束
      const finalPrice = this.applyPriceConstraints(totalPrice, configuration.constraints);

      return {
        success: true,
        price: finalPrice,
        currency: model.currency || 'CAD',
        breakdown: {
          vehicles: breakdown,
          firstUnitPrice: firstUnit.price,
          continuationUnitPrice: continuationUnit.price,
          totalVehicles: vehicleCount,
          totalQuantity: quantity
        },
        metadata: {
          strategy: 'FirstCont',
          zone: zone,
          vehicleCount: vehicleCount,
          priceCapApplied: breakdown.some(v => v.capped)
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
   * 计算单车价格
   * @param {number} quantity - 数量
   * @param {Object} firstUnit - 首单位配置
   * @param {Object} continuationUnit - 续单位配置
   * @returns {number} 计算的价格
   */
  calculateSingleVehicle(quantity, firstUnit, continuationUnit) {
    let price = 0;
    let remaining = quantity;

    // 计算首单位价格
    if (remaining > 0) {
      const firstQuantity = Math.min(remaining, firstUnit.quantity || 1);
      price += firstUnit.price;
      remaining -= firstQuantity;
    }

    // 计算续单位价格
    if (remaining > 0) {
      const contQuantity = continuationUnit.quantity || 1;
      const contGroups = Math.ceil(remaining / contQuantity);
      price += contGroups * continuationUnit.price;
    }

    return price;
  }

  /**
   * 连续计算价格（用于多车连续模式）
   * @param {number} quantity - 数量
   * @param {Object} firstUnit - 首单位配置
   * @param {Object} continuationUnit - 续单位配置
   * @param {boolean} includeFirst - 是否包含首单位
   * @returns {number} 计算的价格
   */
  calculateContinuous(quantity, firstUnit, continuationUnit, includeFirst = true) {
    let price = 0;

    if (includeFirst && quantity > 0) {
      // 第一辆车包含首单位价格
      price += firstUnit.price;
      const remaining = quantity - (firstUnit.quantity || 1);
      
      if (remaining > 0) {
        const contQuantity = continuationUnit.quantity || 1;
        const contGroups = Math.ceil(remaining / contQuantity);
        price += contGroups * continuationUnit.price;
      }
    } else {
      // 后续车辆全部按续单位计算
      const contQuantity = continuationUnit.quantity || 1;
      const contGroups = Math.ceil(quantity / contQuantity);
      price += contGroups * continuationUnit.price;
    }

    return price;
  }

  /**
   * 获取特定区域的配置
   * @param {Object} configuration - 总配置
   * @param {string} zone - 区域ID
   * @returns {Object|null} 区域配置
   */
  getZoneConfig(configuration, zone) {
    if (!zone || !configuration.zoneConfigs) {
      return null;
    }

    return configuration.zoneConfigs[zone] || null;
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

    // 验证基础配置
    if (!configuration.firstUnit) {
      errors.push('First unit configuration is required');
    } else {
      if (configuration.firstUnit.price === undefined || configuration.firstUnit.price < 0) {
        errors.push('First unit price must be a non-negative number');
      }
      if (!configuration.firstUnit.quantity || configuration.firstUnit.quantity <= 0) {
        errors.push('First unit quantity must be greater than 0');
      }
    }

    if (!configuration.continuationUnit) {
      errors.push('Continuation unit configuration is required');
    } else {
      if (configuration.continuationUnit.price === undefined || configuration.continuationUnit.price < 0) {
        errors.push('Continuation unit price must be a non-negative number');
      }
      if (!configuration.continuationUnit.quantity || configuration.continuationUnit.quantity <= 0) {
        errors.push('Continuation unit quantity must be greater than 0');
      }
    }

    // 验证可选配置
    if (configuration.maxUnitsPerVehicle && configuration.maxUnitsPerVehicle <= 0) {
      errors.push('Max units per vehicle must be greater than 0');
    }

    if (configuration.priceCapPerVehicle && configuration.priceCapPerVehicle <= 0) {
      errors.push('Price cap per vehicle must be greater than 0');
    }

    // 验证区域配置（如果有）
    if (configuration.zoneConfigs) {
      Object.entries(configuration.zoneConfigs).forEach(([zone, config]) => {
        if (!config.firstUnit || !config.continuationUnit) {
          errors.push(`Zone ${zone} must have both first and continuation unit configurations`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成价格预览
   * @param {Object} model - 定价模型
   * @param {number} maxQuantity - 最大数量
   * @returns {Array} 价格预览
   */
  generatePricePreview(model, maxQuantity = 20) {
    const { configuration } = model;
    const preview = [];

    for (let quantity = 1; quantity <= maxQuantity; quantity++) {
      const result = this.calculate(model, { quantity });
      
      if (result.success) {
        preview.push({
          quantity,
          price: result.price,
          unitPrice: this.formatPrice(result.price / quantity),
          vehicles: result.breakdown.vehicles.length
        });
      }
    }

    return preview;
  }
}

module.exports = FirstContStrategy;