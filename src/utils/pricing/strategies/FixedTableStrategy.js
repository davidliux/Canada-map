// Fixed Table Pricing Strategy
// 固定价格表定价策略

const PricingStrategy = require('./PricingStrategy');

/**
 * 固定价格表定价策略
 * 支持基于预定义价格表的查询定价
 * 类似于您提供的第三张图片的定价模式
 */
class FixedTableStrategy extends PricingStrategy {
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
        origin, 
        destination, 
        zone,
        quantity = 1,
        lookupKey
      } = request;

      // 确定查找键
      const key = this.determineLookupKey(
        { origin, destination, zone, lookupKey },
        configuration
      );

      if (!key) {
        throw new Error('Unable to determine lookup key for price table');
      }

      // 在价格表中查找
      const priceEntry = this.findPriceEntry(key, configuration.priceTable);
      
      if (!priceEntry) {
        throw new Error(`No price found for ${key}`);
      }

      // 计算总价
      let totalPrice = 0;
      
      if (priceEntry.priceType === 'perUnit') {
        // 每单位价格
        totalPrice = priceEntry.price * quantity;
      } else if (priceEntry.priceType === 'fixed') {
        // 固定价格（不受数量影响）
        totalPrice = priceEntry.price;
      } else if (priceEntry.priceType === 'tiered') {
        // 阶梯价格
        totalPrice = this.calculateTieredPrice(quantity, priceEntry.tiers);
      } else {
        // 默认按单位计算
        totalPrice = priceEntry.price * quantity;
      }

      // 应用最小起步价（如果有）
      if (priceEntry.minimumCharge && totalPrice < priceEntry.minimumCharge) {
        totalPrice = priceEntry.minimumCharge;
      }

      // 应用价格约束
      const finalPrice = this.applyPriceConstraints(totalPrice, configuration.constraints);

      return {
        success: true,
        price: finalPrice,
        currency: model.currency || 'CAD',
        breakdown: {
          lookupKey: key,
          basePrice: priceEntry.price,
          quantity: quantity,
          priceType: priceEntry.priceType || 'perUnit',
          minimumCharge: priceEntry.minimumCharge
        },
        metadata: {
          strategy: 'FixedTable',
          priceEntry: priceEntry,
          appliedMinimum: priceEntry.minimumCharge && totalPrice === priceEntry.minimumCharge
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
   * 确定查找键
   * @param {Object} request - 请求参数
   * @param {Object} configuration - 配置
   * @returns {string|null} 查找键
   */
  determineLookupKey(request, configuration) {
    const { origin, destination, zone, lookupKey } = request;
    
    // 优先使用直接提供的查找键
    if (lookupKey) {
      return lookupKey;
    }

    // 根据配置的键类型生成查找键
    const keyType = configuration.keyType || 'zone';
    
    switch (keyType) {
      case 'zone':
        return zone;
      
      case 'city':
        return destination?.city || destination;
      
      case 'origin-destination':
        if (origin && destination) {
          const o = typeof origin === 'object' ? origin.city : origin;
          const d = typeof destination === 'object' ? destination.city : destination;
          return `${o}-${d}`;
        }
        return null;
      
      case 'composite':
        // 组合键（如 zone-city）
        const parts = [];
        if (zone) parts.push(zone);
        if (destination?.city) parts.push(destination.city);
        return parts.join('-');
      
      default:
        return zone || destination?.city || destination;
    }
  }

  /**
   * 在价格表中查找价格条目
   * @param {string} key - 查找键
   * @param {Array} priceTable - 价格表
   * @returns {Object|null} 价格条目
   */
  findPriceEntry(key, priceTable) {
    if (!priceTable || !Array.isArray(priceTable)) {
      return null;
    }

    // 精确匹配
    let entry = priceTable.find(item => 
      item.key === key || 
      item.zone === key || 
      item.city === key ||
      item.destination === key
    );

    if (entry) {
      return entry;
    }

    // 忽略大小写匹配
    const lowerKey = key.toLowerCase();
    entry = priceTable.find(item => {
      const itemKey = (item.key || item.zone || item.city || item.destination || '').toLowerCase();
      return itemKey === lowerKey;
    });

    if (entry) {
      return entry;
    }

    // 模糊匹配（包含关系）
    entry = priceTable.find(item => {
      const itemKey = (item.key || item.zone || item.city || item.destination || '').toLowerCase();
      return itemKey.includes(lowerKey) || lowerKey.includes(itemKey);
    });

    return entry;
  }

  /**
   * 计算阶梯价格
   * @param {number} quantity - 数量
   * @param {Array} tiers - 阶梯配置
   * @returns {number} 计算的价格
   */
  calculateTieredPrice(quantity, tiers) {
    if (!tiers || !Array.isArray(tiers)) {
      return 0;
    }

    // 按起始数量排序
    const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    
    // 找到适用的阶梯
    let applicableTier = null;
    for (const tier of sortedTiers) {
      if (quantity >= tier.minQuantity && 
          (!tier.maxQuantity || quantity <= tier.maxQuantity)) {
        applicableTier = tier;
      }
    }

    if (!applicableTier) {
      // 使用最后一个阶梯（通常是最高阶梯）
      applicableTier = sortedTiers[sortedTiers.length - 1];
    }

    return applicableTier ? applicableTier.price * quantity : 0;
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

    if (!configuration.priceTable || !Array.isArray(configuration.priceTable)) {
      errors.push('Price table must be defined as an array');
    } else if (configuration.priceTable.length === 0) {
      errors.push('Price table must contain at least one entry');
    } else {
      // 验证价格表条目
      configuration.priceTable.forEach((entry, index) => {
        // 必须有某种形式的键
        if (!entry.key && !entry.zone && !entry.city && !entry.destination) {
          errors.push(`Price table entry ${index + 1} must have a key, zone, city, or destination`);
        }
        
        // 必须有价格
        if (entry.price === undefined || entry.price < 0) {
          errors.push(`Price table entry ${index + 1} must have a valid price`);
        }

        // 如果是阶梯价格，验证阶梯配置
        if (entry.priceType === 'tiered' && !entry.tiers) {
          errors.push(`Price table entry ${index + 1} with tiered pricing must have tiers defined`);
        }
      });
    }

    // 验证键类型
    const validKeyTypes = ['zone', 'city', 'origin-destination', 'composite'];
    if (configuration.keyType && !validKeyTypes.includes(configuration.keyType)) {
      errors.push(`Invalid key type: ${configuration.keyType}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 导出价格表为CSV格式
   * @param {Object} model - 定价模型
   * @returns {string} CSV格式的价格表
   */
  exportToCSV(model) {
    const { configuration } = model;
    const { priceTable } = configuration;
    
    if (!priceTable || priceTable.length === 0) {
      return '';
    }

    // 构建CSV头
    const headers = ['Key', 'Price', 'Price Type', 'Minimum Charge', 'Notes'];
    const rows = [headers.join(',')];

    // 构建数据行
    priceTable.forEach(entry => {
      const row = [
        entry.key || entry.zone || entry.city || entry.destination || '',
        entry.price || 0,
        entry.priceType || 'perUnit',
        entry.minimumCharge || '',
        entry.notes || ''
      ];
      rows.push(row.map(val => `"${val}"`).join(','));
    });

    return rows.join('\n');
  }

  /**
   * 从CSV导入价格表
   * @param {string} csvData - CSV数据
   * @returns {Array} 价格表数组
   */
  importFromCSV(csvData) {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const priceTable = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const entry = {};

      headers.forEach((header, index) => {
        const value = values[index];
        switch (header.toLowerCase()) {
          case 'key':
          case 'zone':
          case 'city':
          case 'destination':
            entry.key = value;
            break;
          case 'price':
            entry.price = parseFloat(value) || 0;
            break;
          case 'price type':
          case 'pricetype':
            entry.priceType = value || 'perUnit';
            break;
          case 'minimum charge':
          case 'minimumcharge':
            entry.minimumCharge = parseFloat(value) || undefined;
            break;
          case 'notes':
            entry.notes = value;
            break;
        }
      });

      if (entry.key && entry.price !== undefined) {
        priceTable.push(entry);
      }
    }

    return priceTable;
  }
}

module.exports = FixedTableStrategy;