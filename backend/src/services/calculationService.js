// Price Calculation Service
// 价格计算服务 - 支持多种定价模式的价格计算

/**
 * 计算首续托定价
 * @param {number} quantity 托盘数量
 * @param {object} config 定价配置
 * @returns {object} 价格明细
 */
function calculatePalletBased(quantity, config) {
  const firstPalletPrice = config.firstPalletPrice || 0;
  const additionalPalletPrice = config.additionalPalletPrice || 0;

  if (quantity <= 0) {
    return {
      total: 0,
      breakdown: []
    };
  }

  let total = firstPalletPrice;
  const breakdown = [{
    type: 'firstPallet',
    description: '首托价格',
    quantity: 1,
    unitPrice: firstPalletPrice,
    amount: firstPalletPrice
  }];

  if (quantity > 1) {
    const additionalQuantity = quantity - 1;
    const additionalTotal = additionalQuantity * additionalPalletPrice;
    total += additionalTotal;

    breakdown.push({
      type: 'additionalPallet',
      description: `续托价格 (${additionalQuantity}托)`,
      quantity: additionalQuantity,
      unitPrice: additionalPalletPrice,
      amount: additionalTotal
    });
  }

  return {
    total: total,
    breakdown: breakdown
  };
}

/**
 * 计算批量折扣定价
 * @param {number} quantity 托盘数量
 * @param {object} config 定价配置
 * @returns {object} 价格明细
 */
function calculateBulkDiscount(quantity, config) {
  if (!config.tiers || !Array.isArray(config.tiers)) {
    return {
      total: 0,
      breakdown: []
    };
  }

  // 按最小数量排序
  const sortedTiers = [...config.tiers].sort((a, b) =>
    (a.minQuantity || 0) - (b.minQuantity || 0)
  );

  // 找到适用的价格层级
  let applicableTier = null;
  for (const tier of sortedTiers) {
    if (quantity >= (tier.minQuantity || 0)) {
      if (!tier.maxQuantity || quantity <= tier.maxQuantity) {
        applicableTier = tier;
      }
    }
  }

  if (!applicableTier) {
    return {
      total: 0,
      breakdown: [{
        type: 'error',
        description: '未找到适用的价格层级',
        amount: 0
      }]
    };
  }

  const pricePerPallet = applicableTier.pricePerPallet || applicableTier.price || 0;
  const total = quantity * pricePerPallet;

  const breakdown = [{
    type: 'bulkDiscount',
    description: `批量价格 (${applicableTier.minQuantity}${applicableTier.maxQuantity ? '-' + applicableTier.maxQuantity : '+'}托)`,
    quantity: quantity,
    unitPrice: pricePerPallet,
    amount: total,
    discountPercent: applicableTier.discountPercent
  }];

  return {
    total: total,
    breakdown: breakdown
  };
}

/**
 * 计算整车定价
 * @param {number} quantity 托盘数量
 * @param {object} config 定价配置
 * @returns {object} 价格明细
 */
function calculateFullTruck(quantity, config) {
  const minPallets = config.minPallets || 10;
  const fixedPrice = config.fixedPrice || 0;
  const maxPallets = config.maxPallets;

  // 检查是否满足整车条件
  if (quantity < minPallets) {
    return {
      total: 0,
      breakdown: [{
        type: 'notApplicable',
        description: `未达到整车最小数量 (需要${minPallets}托)`,
        amount: 0
      }]
    };
  }

  if (maxPallets && quantity > maxPallets) {
    return {
      total: 0,
      breakdown: [{
        type: 'exceedsLimit',
        description: `超过整车最大数量 (最多${maxPallets}托)`,
        amount: 0
      }]
    };
  }

  return {
    total: fixedPrice,
    breakdown: [{
      type: 'fullTruck',
      description: `整车价格 (${minPallets}${maxPallets ? '-' + maxPallets : '+'}托)`,
      quantity: quantity,
      totalPrice: fixedPrice,
      amount: fixedPrice
    }]
  };
}

/**
 * 计算混合模式定价
 * @param {number} quantity 托盘数量
 * @param {object} config 定价配置
 * @returns {object} 价格明细
 */
function calculateHybrid(quantity, config) {
  const results = [];

  // 计算基础托盘定价
  if (config.basePricing) {
    const palletResult = calculatePalletBased(quantity, config.basePricing);
    results.push({
      mode: 'palletBased',
      ...palletResult
    });
  }

  // 计算批量折扣
  if (config.bulkDiscounts) {
    const bulkResult = calculateBulkDiscount(quantity, config.bulkDiscounts);
    if (bulkResult.total > 0) {
      results.push({
        mode: 'bulkDiscount',
        ...bulkResult
      });
    }
  }

  // 计算整车价格
  if (config.fullTruckOption) {
    const truckResult = calculateFullTruck(quantity, config.fullTruckOption);
    if (truckResult.total > 0) {
      results.push({
        mode: 'fullTruck',
        ...truckResult
      });
    }
  }

  // 选择最优价格
  if (results.length === 0) {
    return {
      total: 0,
      breakdown: []
    };
  }

  // 找出最低价格
  const bestOption = results.reduce((best, current) =>
    current.total < best.total ? current : best
  );

  return {
    total: bestOption.total,
    breakdown: bestOption.breakdown,
    allOptions: results,
    selectedMode: bestOption.mode
  };
}

/**
 * 主计算函数
 * @param {object} pricingMode 定价模式对象
 * @param {number} quantity 数量
 * @param {object} options 额外选项
 * @returns {object} 计算结果
 */
async function calculatePrice(pricingMode, quantity, options = {}) {
  let result;
  const config = pricingMode.config;

  // 根据模式类型调用不同的计算方法
  switch (pricingMode.modeType) {
    case 'palletBased':
      result = calculatePalletBased(quantity, config);
      break;

    case 'bulkDiscount':
      result = calculateBulkDiscount(quantity, config);
      break;

    case 'fullTruck':
      result = calculateFullTruck(quantity, config);
      break;

    case 'hybrid':
      result = calculateHybrid(quantity, config);
      break;

    case 'fixed':
      // 固定价格模式 - 从配置中直接读取
      const fixedPrice = config.prices && config.prices[quantity];
      if (fixedPrice) {
        result = {
          total: fixedPrice,
          breakdown: [{
            type: 'fixed',
            description: `${quantity}板固定价格`,
            amount: fixedPrice
          }]
        };
      } else {
        result = {
          total: 0,
          breakdown: [{
            type: 'notConfigured',
            description: `${quantity}板价格未配置`,
            amount: 0
          }]
        };
      }
      break;

    default:
      result = {
        total: 0,
        breakdown: [{
          type: 'unsupported',
          description: `不支持的定价模式: ${pricingMode.modeType}`,
          amount: 0
        }]
      };
  }

  // 应用额外选项（如加急费等）
  if (options.urgency === 'express') {
    const expressFee = result.total * 0.2; // 20% 加急费
    result.breakdown.push({
      type: 'surcharge',
      description: '加急服务费 (20%)',
      amount: expressFee
    });
    result.total += expressFee;
  }

  // 构建最终响应
  return {
    basePrice: result.total,
    finalPrice: result.total,
    breakdown: result.breakdown,
    appliedRules: result.breakdown.map(item => item.type),
    mode: pricingMode.modeType,
    allOptions: result.allOptions,
    selectedMode: result.selectedMode,
    recommendations: generateRecommendations(quantity, result, pricingMode)
  };
}

/**
 * 生成价格建议
 * @param {number} quantity 当前数量
 * @param {object} result 计算结果
 * @param {object} pricingMode 定价模式
 * @returns {array} 建议列表
 */
function generateRecommendations(quantity, result, pricingMode) {
  const recommendations = [];

  // 如果有批量折扣配置，检查是否接近下一个折扣档
  if (pricingMode.config.bulkDiscounts && pricingMode.config.bulkDiscounts.tiers) {
    const tiers = pricingMode.config.bulkDiscounts.tiers;
    for (const tier of tiers) {
      if (tier.minQuantity > quantity && tier.minQuantity <= quantity + 2) {
        const potentialSaving = result.total - (tier.pricePerPallet * tier.minQuantity);
        if (potentialSaving > 0) {
          recommendations.push({
            type: 'bulkSuggestion',
            message: `增加到${tier.minQuantity}板可享受批量优惠`,
            suggestedQuantity: tier.minQuantity,
            potentialSaving: potentialSaving
          });
        }
      }
    }
  }

  // 如果有整车选项且接近整车标准
  if (pricingMode.config.fullTruckOption) {
    const minPallets = pricingMode.config.fullTruckOption.minPallets;
    if (quantity >= minPallets * 0.8 && quantity < minPallets) {
      recommendations.push({
        type: 'fullTruckSuggestion',
        message: `增加到${minPallets}板可使用整车价格`,
        suggestedQuantity: minPallets,
        fixedPrice: pricingMode.config.fullTruckOption.fixedPrice
      });
    }
  }

  return recommendations;
}

/**
 * 验证定价配置
 * @param {object} config 定价配置
 * @param {string} modeType 模式类型
 * @returns {object} 验证结果
 */
function validatePricingConfig(config, modeType) {
  const errors = [];

  switch (modeType) {
    case 'palletBased':
      if (!config.firstPalletPrice || config.firstPalletPrice <= 0) {
        errors.push('首托价格必须大于0');
      }
      if (!config.additionalPalletPrice || config.additionalPalletPrice <= 0) {
        errors.push('续托价格必须大于0');
      }
      break;

    case 'bulkDiscount':
      if (!config.tiers || !Array.isArray(config.tiers) || config.tiers.length === 0) {
        errors.push('必须配置至少一个价格层级');
      } else {
        config.tiers.forEach((tier, index) => {
          if (!tier.minQuantity || tier.minQuantity <= 0) {
            errors.push(`层级${index + 1}的最小数量必须大于0`);
          }
          if (!tier.pricePerPallet || tier.pricePerPallet <= 0) {
            errors.push(`层级${index + 1}的单价必须大于0`);
          }
        });
      }
      break;

    case 'fullTruck':
      if (!config.minPallets || config.minPallets <= 0) {
        errors.push('最小托盘数必须大于0');
      }
      if (!config.fixedPrice || config.fixedPrice <= 0) {
        errors.push('整车价格必须大于0');
      }
      if (config.maxPallets && config.maxPallets <= config.minPallets) {
        errors.push('最大托盘数必须大于最小托盘数');
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  calculatePrice,
  calculatePalletBased,
  calculateBulkDiscount,
  calculateFullTruck,
  calculateHybrid,
  validatePricingConfig,
  generateRecommendations
};