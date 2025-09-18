/**
 * 价格服务V2 - 支持四种定价模式和三级优先级
 *
 * 定价模式：
 * 1. skid - 板数定价（每个板数独立定价）
 * 2. first_cont - 首托+续托定价
 * 3. per_skid - 每板单价+起送板数
 * 4. full_truck - 整车定价
 *
 * 优先级：
 * 分组(Group) > 区域(Zone) > 城市(City)
 */

import { apiGet, apiPost } from '../utils/apiClient';

class PricingServiceV2 {
  constructor() {
    // 缓存配置
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 获取FSA的适用价格配置
   * @param {string} cityId - 城市ID
   * @param {string} zoneId - 区域ID（可选）
   * @param {string} groupId - 分组ID（可选）
   * @param {string} fsaCode - FSA代码（可选）
   * @returns {Promise<Object|null>} 价格配置对象
   */
  async getFSAPricing(cityId, zoneId, groupId, fsaCode) {
    if (!cityId) {
      console.error('城市ID是必需的');
      return null;
    }

    // 检查缓存
    const cacheKey = `${cityId}_${zoneId || 'null'}_${groupId || 'null'}_${fsaCode || 'null'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log('使用缓存的价格配置:', cacheKey);
      return cached;
    }

    try {
      // 调用后端API查询适用的价格配置
      const response = await apiGet('/truck-pricing/query', {
        city_id: cityId,
        zone_id: zoneId,
        group_id: groupId,
        fsa_code: fsaCode
      });

      if (response) {
        const config = response;

        // 添加到缓存
        this.setCache(cacheKey, config);

        return config;
      }

      // 如果没有找到配置，返回null
      console.warn('未找到适用的价格配置:', { cityId, zoneId, groupId, fsaCode });
      return null;

    } catch (error) {
      console.error('获取价格配置失败:', error);

      // 尝试从localStorage获取降级数据
      const fallback = this.getFallbackPricing(cityId, zoneId, groupId);
      if (fallback) {
        console.log('使用降级价格配置');
        return fallback;
      }

      return null;
    }
  }

  /**
   * 计算价格
   * @param {Object} config - 价格配置
   * @param {number} skidCount - 托盘数量
   * @returns {Object|null} 计算结果
   */
  calculatePrice(config, skidCount) {
    if (!config || !config.pricing_data || !skidCount || skidCount < 1) {
      return null;
    }

    const { pricing_mode, pricing_data } = config;

    switch (pricing_mode) {
      case 'skid':
        return this.calculateSkidPrice(pricing_data, skidCount);

      case 'first_cont':
        return this.calculateFirstContPrice(pricing_data, skidCount);

      case 'per_skid':
        return this.calculatePerSkidPrice(pricing_data, skidCount);

      case 'full_truck':
        return this.calculateFullTruckPrice(pricing_data, skidCount);

      default:
        console.error('未知的定价模式:', pricing_mode);
        return null;
    }
  }

  /**
   * 板数定价计算
   */
  calculateSkidPrice(data, skidCount) {
    const key = skidCount > 16 ? '16+' : skidCount.toString();
    const price = data.prices?.[key];

    if (price === undefined || price === null) {
      return {
        mode: 'skid',
        price: 0,
        breakdown: `${skidCount}板未配置价格`,
        error: true
      };
    }

    return {
      mode: 'skid',
      price: parseFloat(price),
      breakdown: `${skidCount}板定价`,
      details: {
        skidCount,
        pricePerSkid: price
      }
    };
  }

  /**
   * 首托+续托计算
   */
  calculateFirstContPrice(data, skidCount) {
    if (!data.first_skid || data.cont_skid === undefined) {
      return {
        mode: 'first_cont',
        price: 0,
        breakdown: '价格配置不完整',
        error: true
      };
    }

    const firstPrice = parseFloat(data.first_skid);
    const contPrice = parseFloat(data.cont_skid);
    const contCount = skidCount - 1;
    const totalPrice = firstPrice + (contPrice * contCount);

    return {
      mode: 'first_cont',
      price: totalPrice,
      breakdown: `首托 $${firstPrice.toFixed(2)} + 续托 ${contCount} × $${contPrice.toFixed(2)}`,
      details: {
        firstSkid: firstPrice,
        contSkid: contPrice,
        contCount,
        skidCount
      }
    };
  }

  /**
   * 每板单价计算
   */
  calculatePerSkidPrice(data, skidCount) {
    const pricePerSkid = parseFloat(data.price_per_skid || 0);
    const minSkids = parseInt(data.min_skids || 1);

    if (pricePerSkid <= 0) {
      return {
        mode: 'per_skid',
        price: 0,
        breakdown: '未配置每板单价',
        error: true
      };
    }

    // 如果低于最低起送板数，按最低板数计算
    const actualSkidCount = Math.max(skidCount, minSkids);
    const totalPrice = pricePerSkid * actualSkidCount;

    if (skidCount < minSkids) {
      return {
        mode: 'per_skid',
        price: totalPrice,
        breakdown: `最低起送 ${minSkids}板 × $${pricePerSkid.toFixed(2)}`,
        warning: `最低起送${minSkids}板`,
        details: {
          pricePerSkid,
          minSkids,
          actualSkidCount,
          requestedSkidCount: skidCount
        }
      };
    }

    return {
      mode: 'per_skid',
      price: totalPrice,
      breakdown: `${skidCount}板 × $${pricePerSkid.toFixed(2)}`,
      details: {
        pricePerSkid,
        skidCount,
        minSkids
      }
    };
  }

  /**
   * 整车定价计算
   */
  calculateFullTruckPrice(data, skidCount) {
    const truckPrice = parseFloat(data.truck_price || 0);
    const maxSkids = parseInt(data.max_skids || 16);

    if (truckPrice <= 0) {
      return {
        mode: 'full_truck',
        price: 0,
        breakdown: '未配置整车价格',
        error: true
      };
    }

    const info = skidCount > maxSkids
      ? `超出整车容量（最多${maxSkids}板）`
      : `整车可装${maxSkids}板`;

    return {
      mode: 'full_truck',
      price: truckPrice,
      breakdown: `整车价格（最多${maxSkids}板）`,
      info,
      details: {
        truckPrice,
        maxSkids,
        skidCount,
        overCapacity: skidCount > maxSkids
      }
    };
  }

  /**
   * 通过API计算价格（包含查询和计算）
   */
  async calculatePriceWithAPI(cityId, zoneId, groupId, fsaCode, skidCount) {
    try {
      const response = await apiPost('/truck-pricing/calculate', {
        city_id: cityId,
        zone_id: zoneId,
        group_id: groupId,
        fsa_code: fsaCode,
        skid_count: skidCount
      });

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch (error) {
      console.error('API计算价格失败:', error);

      // 降级到本地计算
      const config = await this.getFSAPricing(cityId, zoneId, groupId, fsaCode);
      if (config) {
        return this.calculatePrice(config, skidCount);
      }

      return null;
    }
  }

  /**
   * 批量计算价格（用于价格表展示）
   */
  async calculateBatchPrices(config, skidCounts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]) {
    if (!config) return {};

    const results = {};

    for (const count of skidCounts) {
      const result = this.calculatePrice(config, count);
      if (result) {
        const key = count > 16 ? '16+' : count.toString();
        results[key] = result.price;
      }
    }

    return results;
  }

  /**
   * 获取价格配置的显示信息
   */
  getPricingModeDisplay(mode) {
    const modeDisplayMap = {
      'skid': '板数定价',
      'first_cont': '首托+续托',
      'per_skid': '每板单价',
      'full_truck': '整车定价'
    };

    return modeDisplayMap[mode] || mode;
  }

  /**
   * 获取配置级别的显示信息
   */
  getConfigLevelDisplay(config) {
    if (config.group_id) {
      return {
        level: 'group',
        label: '分组定价',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      };
    }

    if (config.zone_id) {
      return {
        level: 'zone',
        label: '区域定价',
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
      };
    }

    return {
      level: 'city',
      label: '城市定价',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    };
  }

  /**
   * 缓存管理方法
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * 降级方案：从localStorage获取价格配置
   */
  getFallbackPricing(cityId, zoneId, groupId) {
    try {
      // 尝试从localStorage读取价格配置
      const storageKey = `pricing_config_${cityId}_${zoneId || 'default'}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const config = JSON.parse(stored);
        return {
          ...config,
          fallback: true,
          message: '使用本地缓存的价格配置'
        };
      }

      // 返回默认配置
      return this.getDefaultPricing(cityId);

    } catch (error) {
      console.error('获取降级价格配置失败:', error);
      return null;
    }
  }

  /**
   * 获取默认价格配置（最后的降级方案）
   */
  getDefaultPricing(cityId) {
    return {
      config_id: 'default',
      name: '默认价格配置',
      pricing_mode: 'skid',
      pricing_data: {
        mode: 'skid',
        prices: {
          "1": 90,
          "2": 108,
          "3": 126,
          "4": 144,
          "5": 162,
          "6": 180,
          "7": 198,
          "8": 216,
          "9": 234,
          "10": 252,
          "11": 270,
          "12": 288,
          "13": 306,
          "14": 324,
          "15": 342,
          "16": 360,
          "16+": 378
        }
      },
      level: 'default',
      city_id: cityId,
      fallback: true,
      message: '使用默认价格配置'
    };
  }

  /**
   * 保存价格配置到localStorage（用于降级）
   */
  saveFallbackPricing(config) {
    try {
      const storageKey = `pricing_config_${config.city_id}_${config.zone_id || 'default'}`;
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (error) {
      console.error('保存降级价格配置失败:', error);
    }
  }

  /**
   * 获取所有价格配置
   */
  async getAllConfigs() {
    try {
      const response = await apiGet('/truck-pricing/configs');
      return response;
    } catch (error) {
      console.error('获取所有配置失败:', error);
      return {
        success: false,
        data: [],
        message: error.message
      };
    }
  }

  /**
   * 保存价格配置
   */
  async saveConfig(config) {
    try {
      const endpoint = config.id
        ? `/truck-pricing/configs/${config.id}`
        : '/truck-pricing/configs';

      const method = config.id ? 'PUT' : 'POST';

      const response = await fetch(`/api/v1${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      // 清除缓存
      this.clearCache();

      return data;
    } catch (error) {
      console.error('保存配置失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * 删除价格配置
   */
  async deleteConfig(configId) {
    try {
      const response = await fetch(`/api/v1/truck-pricing/configs/${configId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      // 清除缓存
      this.clearCache();

      return data;
    } catch (error) {
      console.error('删除配置失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

// 导出单例
const pricingServiceV2 = new PricingServiceV2();
export default pricingServiceV2;