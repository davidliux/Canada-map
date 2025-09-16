// Pricing Strategy Interface
// 定价策略接口定义

/**
 * 定价策略基类
 * 所有定价策略必须继承此类并实现calculate方法
 */
class PricingStrategy {
  /**
   * 计算价格
   * @param {Object} model - 定价模型配置
   * @param {Object} request - 价格计算请求
   * @returns {Promise<Object>} 价格计算结果
   */
  async calculate(model, request) {
    throw new Error('calculate method must be implemented by subclass');
  }

  /**
   * 验证配置
   * @param {Object} model - 定价模型配置
   * @returns {Object} 验证结果
   */
  validate(model) {
    return {
      valid: true,
      errors: []
    };
  }

  /**
   * 获取策略名称
   * @returns {string} 策略名称
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * 格式化价格（保留2位小数）
   * @param {number} price - 原始价格
   * @returns {number} 格式化后的价格
   */
  formatPrice(price) {
    return Math.round(price * 100) / 100;
  }

  /**
   * 应用最小/最大价格限制
   * @param {number} price - 计算的价格
   * @param {Object} constraints - 价格约束
   * @returns {number} 应用约束后的价格
   */
  applyPriceConstraints(price, constraints = {}) {
    let finalPrice = price;
    
    if (constraints.minPrice && finalPrice < constraints.minPrice) {
      finalPrice = constraints.minPrice;
    }
    
    if (constraints.maxPrice && finalPrice > constraints.maxPrice) {
      finalPrice = constraints.maxPrice;
    }
    
    return this.formatPrice(finalPrice);
  }

  /**
   * 生成价格明细
   * @param {Object} components - 价格组成部分
   * @returns {Object} 价格明细
   */
  generateBreakdown(components) {
    const breakdown = {
      components: [],
      subtotal: 0,
      total: 0
    };

    for (const [key, value] of Object.entries(components)) {
      if (value && value > 0) {
        breakdown.components.push({
          name: key,
          amount: this.formatPrice(value)
        });
        breakdown.subtotal += value;
      }
    }

    breakdown.subtotal = this.formatPrice(breakdown.subtotal);
    breakdown.total = breakdown.subtotal;

    return breakdown;
  }
}

module.exports = PricingStrategy;