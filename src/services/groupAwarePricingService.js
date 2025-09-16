/**
 * FSA组感知的定价服务
 * 扩展现有定价服务以支持FSA组级别的定价
 */

import pricingService from './pricingService';
import {
  getRegionConfig,
  getFSAGroup,
  getRegionFSAGroups
} from '../utils/unifiedStorage';

/**
 * 定价结果对象
 * @typedef {Object} GroupPricingResult
 * @property {number} price - 计算的价格
 * @property {string} source - 价格来源 ('group' | 'region' | 'default')
 * @property {string} sourceId - 来源ID（组ID或区域ID）
 * @property {string} sourceName - 来源名称
 * @property {Object} appliedRange - 应用的重量区间
 * @property {Object} metadata - 元数据
 */

class GroupAwarePricingService {
  constructor() {
    this.basePricingService = pricingService;
    this.pricingCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 计算带有FSA组感知的价格
   * @param {string} regionId - 区域ID
   * @param {string} fsaCode - FSA代码
   * @param {number} weight - 重量（KG）
   * @param {string} skidType - 板类型（可选）
   * @returns {Promise<GroupPricingResult>} 定价结果
   */
  async calculatePriceWithGroups(regionId, fsaCode, weight, skidType = 'standard') {
    try {
      console.log(`计算FSA组感知价格: 区域=${regionId}, FSA=${fsaCode}, 重量=${weight}kg`);

      // 检查缓存
      const cacheKey = `${regionId}-${fsaCode}-${weight}-${skidType}`;
      const cached = this.getCachedPrice(cacheKey);
      if (cached) {
        console.log('使用缓存的价格:', cached);
        return cached;
      }

      // 获取区域配置
      const regionConfig = await getRegionConfig(regionId);
      if (!regionConfig) {
        throw new Error(`区域 ${regionId} 不存在`);
      }

      // 检查FSA是否属于某个组
      const fsaGroup = await getFSAGroup(regionId, fsaCode);

      let pricingResult;

      if (fsaGroup && fsaGroup.customPricing && fsaGroup.customPricing.enabled) {
        // 使用组级别定价
        console.log(`使用FSA组定价: ${fsaGroup.name}`);
        pricingResult = this.calculateGroupPrice(fsaGroup, weight, skidType);
        pricingResult.source = 'group';
        pricingResult.sourceId = fsaGroup.id;
        pricingResult.sourceName = fsaGroup.name;
      } else {
        // 使用区域级别定价
        console.log(`使用区域定价: ${regionConfig.name}`);
        pricingResult = this.calculateRegionPrice(regionConfig, weight, skidType);
        pricingResult.source = 'region';
        pricingResult.sourceId = regionConfig.id;
        pricingResult.sourceName = regionConfig.name;
      }

      // 添加元数据
      pricingResult.metadata = {
        calculatedAt: new Date().toISOString(),
        fsaCode,
        weight,
        skidType,
        hasGroupPricing: !!fsaGroup?.customPricing?.enabled,
        groupName: fsaGroup?.name || null
      };

      // 缓存结果
      this.setCachedPrice(cacheKey, pricingResult);

      return pricingResult;
    } catch (error) {
      console.error('计算FSA组感知价格失败:', error);
      throw error;
    }
  }

  /**
   * 计算组级别价格
   * @param {Object} group - FSA组对象
   * @param {number} weight - 重量
   * @param {string} skidType - 板类型
   * @returns {Object} 价格计算结果
   */
  calculateGroupPrice(group, weight, skidType) {
    if (!group.customPricing || !group.customPricing.weightRanges) {
      throw new Error(`组 ${group.name} 没有配置价格`);
    }

    const weightRanges = group.customPricing.weightRanges;
    const applicableRange = this.findApplicableWeightRange(weightRanges, weight);

    if (!applicableRange) {
      throw new Error(`没有找到适用于 ${weight}kg 的重量区间`);
    }

    // 计算价格（基础价格 + 每公斤价格 * 重量）
    const basePrice = applicableRange.base || applicableRange.price || 0;
    const perKgPrice = applicableRange.perKg || 0;
    const calculatedPrice = basePrice + (perKgPrice * weight);

    return {
      price: Math.round(calculatedPrice * 100) / 100, // 保留2位小数
      appliedRange: {
        min: applicableRange.min,
        max: applicableRange.max,
        label: applicableRange.label,
        basePrice,
        perKgPrice
      }
    };
  }

  /**
   * 计算区域级别价格
   * @param {Object} regionConfig - 区域配置
   * @param {number} weight - 重量
   * @param {string} skidType - 板类型
   * @returns {Object} 价格计算结果
   */
  calculateRegionPrice(regionConfig, weight, skidType) {
    if (!regionConfig.weightRanges) {
      throw new Error(`区域 ${regionConfig.name} 没有配置价格`);
    }

    const weightRanges = regionConfig.weightRanges;
    const applicableRange = this.findApplicableWeightRange(weightRanges, weight);

    if (!applicableRange) {
      throw new Error(`没有找到适用于 ${weight}kg 的重量区间`);
    }

    // 计算价格
    const basePrice = applicableRange.price || 0;

    return {
      price: Math.round(basePrice * 100) / 100,
      appliedRange: {
        min: applicableRange.min,
        max: applicableRange.max,
        label: applicableRange.label,
        basePrice
      }
    };
  }

  /**
   * 查找适用的重量区间
   * @param {Array} weightRanges - 重量区间数组
   * @param {number} weight - 重量
   * @returns {Object|null} 适用的重量区间或null
   */
  findApplicableWeightRange(weightRanges, weight) {
    if (!Array.isArray(weightRanges)) {
      return null;
    }

    // 查找第一个匹配的激活区间
    return weightRanges.find(range =>
      range.isActive !== false &&
      weight >= range.min &&
      (range.max === Infinity || weight <= range.max)
    );
  }

  /**
   * 获取价格层级结构（显示组→区域→默认的回退链）
   * @param {string} regionId - 区域ID
   * @param {string} fsaCode - FSA代码
   * @returns {Promise<Object>} 价格层级信息
   */
  async getPricingHierarchy(regionId, fsaCode) {
    try {
      const regionConfig = await getRegionConfig(regionId);
      const fsaGroup = await getFSAGroup(regionId, fsaCode);

      const hierarchy = {
        levels: [],
        activeLevel: null
      };

      // 组级别
      if (fsaGroup) {
        const groupLevel = {
          type: 'group',
          id: fsaGroup.id,
          name: fsaGroup.name,
          hasPricing: fsaGroup.customPricing?.enabled || false,
          isActive: fsaGroup.customPricing?.enabled || false
        };
        hierarchy.levels.push(groupLevel);

        if (groupLevel.isActive) {
          hierarchy.activeLevel = 'group';
        }
      }

      // 区域级别
      if (regionConfig) {
        const regionLevel = {
          type: 'region',
          id: regionConfig.id,
          name: regionConfig.name,
          hasPricing: !!regionConfig.weightRanges,
          isActive: !hierarchy.activeLevel && !!regionConfig.weightRanges
        };
        hierarchy.levels.push(regionLevel);

        if (regionLevel.isActive) {
          hierarchy.activeLevel = 'region';
        }
      }

      // 默认级别
      hierarchy.levels.push({
        type: 'default',
        name: '系统默认',
        hasPricing: true,
        isActive: !hierarchy.activeLevel
      });

      if (!hierarchy.activeLevel) {
        hierarchy.activeLevel = 'default';
      }

      return hierarchy;
    } catch (error) {
      console.error('获取价格层级失败:', error);
      throw error;
    }
  }

  /**
   * 批量计算多个FSA的价格
   * @param {string} regionId - 区域ID
   * @param {Array} fsaRequests - FSA请求数组 [{fsaCode, weight, skidType}, ...]
   * @returns {Promise<Array>} 价格计算结果数组
   */
  async calculateBatchPrices(regionId, fsaRequests) {
    try {
      const results = await Promise.all(
        fsaRequests.map(async request => {
          try {
            const result = await this.calculatePriceWithGroups(
              regionId,
              request.fsaCode,
              request.weight,
              request.skidType
            );
            return {
              ...request,
              ...result,
              success: true
            };
          } catch (error) {
            return {
              ...request,
              success: false,
              error: error.message
            };
          }
        })
      );

      return results;
    } catch (error) {
      console.error('批量计算价格失败:', error);
      throw error;
    }
  }

  /**
   * 获取区域的所有组价格配置
   * @param {string} regionId - 区域ID
   * @returns {Promise<Array>} 组价格配置数组
   */
  async getRegionGroupPricing(regionId) {
    try {
      const groups = await getRegionFSAGroups(regionId);

      return groups.map(group => ({
        groupId: group.id,
        groupName: group.name,
        fsaCount: group.fsaCodes ? group.fsaCodes.length : 0,
        fsaCodes: group.fsaCodes || [],
        hasPricing: group.customPricing?.enabled || false,
        pricingConfig: group.customPricing || null,
        displayColor: group.displayColor
      }));
    } catch (error) {
      console.error('获取区域组价格配置失败:', error);
      return [];
    }
  }

  /**
   * 比较不同价格源的价格
   * @param {string} regionId - 区域ID
   * @param {string} fsaCode - FSA代码
   * @param {Array} weights - 要比较的重量数组
   * @returns {Promise<Object>} 价格比较结果
   */
  async comparePriceSources(regionId, fsaCode, weights = [10, 20, 30, 40, 50]) {
    try {
      const regionConfig = await getRegionConfig(regionId);
      const fsaGroup = await getFSAGroup(regionId, fsaCode);

      const comparison = {
        fsa: fsaCode,
        region: {
          id: regionConfig.id,
          name: regionConfig.name
        },
        group: fsaGroup ? {
          id: fsaGroup.id,
          name: fsaGroup.name
        } : null,
        weightComparison: []
      };

      for (const weight of weights) {
        const priceData = {
          weight,
          prices: {}
        };

        // 计算组价格（如果有）
        if (fsaGroup && fsaGroup.customPricing?.enabled) {
          try {
            const groupPrice = this.calculateGroupPrice(fsaGroup, weight, 'standard');
            priceData.prices.group = groupPrice.price;
          } catch (e) {
            priceData.prices.group = null;
          }
        }

        // 计算区域价格
        try {
          const regionPrice = this.calculateRegionPrice(regionConfig, weight, 'standard');
          priceData.prices.region = regionPrice.price;
        } catch (e) {
          priceData.prices.region = null;
        }

        // 确定实际使用的价格
        priceData.actualPrice = priceData.prices.group !== null
          ? priceData.prices.group
          : priceData.prices.region;

        priceData.source = priceData.prices.group !== null ? 'group' : 'region';

        comparison.weightComparison.push(priceData);
      }

      return comparison;
    } catch (error) {
      console.error('比较价格源失败:', error);
      throw error;
    }
  }

  /**
   * 清除价格缓存
   * @param {string} regionId - 可选的区域ID，如果提供则只清除该区域的缓存
   */
  clearPricingCache(regionId = null) {
    if (regionId) {
      // 清除特定区域的缓存
      const keysToDelete = [];
      for (const key of this.pricingCache.keys()) {
        if (key.startsWith(`${regionId}-`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.pricingCache.delete(key));
      console.log(`清除区域 ${regionId} 的价格缓存: ${keysToDelete.length} 条`);
    } else {
      // 清除所有缓存
      const size = this.pricingCache.size;
      this.pricingCache.clear();
      console.log(`清除所有价格缓存: ${size} 条`);
    }
  }

  /**
   * 获取缓存的价格
   * @private
   */
  getCachedPrice(key) {
    const cached = this.pricingCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * 设置缓存的价格
   * @private
   */
  setCachedPrice(key, data) {
    this.pricingCache.set(key, {
      data,
      timestamp: Date.now()
    });

    // 限制缓存大小
    if (this.pricingCache.size > 1000) {
      const firstKey = this.pricingCache.keys().next().value;
      this.pricingCache.delete(firstKey);
    }
  }

  /**
   * 代理到基础定价服务的方法
   */
  async calculatePrice(regionId, plateCount, options) {
    return this.basePricingService.calculatePrice(regionId, plateCount, options);
  }

  async getSkidPricing(cityId) {
    return this.basePricingService.getSkidPricing(cityId);
  }

  async saveSkidPricing(cityId, pricingData) {
    return this.basePricingService.saveSkidPricing(cityId, pricingData);
  }
}

// 创建单例实例
const groupAwarePricingService = new GroupAwarePricingService();

export default groupAwarePricingService;