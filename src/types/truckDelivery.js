/**
 * 卡车配送数据类型定义
 * 
 * 本文件定义了卡车配送功能所需的所有数据类型，包括城市、区域和价格配置等。
 * 采用JSDoc注释提供TypeScript风格的类型定义，支持完整的类型检查和验证。
 */

import { DEFAULT_WEIGHT_RANGES } from '../utils/unifiedStorage.js';
import { validateFSAFormat } from '../utils/dataValidation.js';

// 存储键名常量
export const TRUCK_STORAGE_KEYS = {
  TRUCK_CITIES: 'truck_delivery_cities',           // 城市列表
  TRUCK_CITY_PREFIX: 'truck_city_',               // 单个城市: truck_city_{id}
  TRUCK_REGION_PREFIX: 'truck_region_',           // 单个区域: truck_region_{id}
  TRUCK_PRICE_PREFIX: 'truck_price_',             // 价格配置: truck_price_{regionId}
  TRUCK_FSA_INDEX: 'truck_fsa_city_index',        // FSA-城市索引
  TRUCK_BACKUP_PREFIX: 'truck_backup_',           // 备份前缀
  PRICING_RULES_V2: 'pricing_rules_v2',           // 动态定价规则 v2
  REGION_RULES_INDEX: 'pricing_region_index',     // 区域规则索引
  MIGRATION_BACKUP: 'pricing_migration_backup'    // 数据迁移备份
};

// 货币类型常量
export const CURRENCY_TYPES = {
  CAD: 'CAD'
};

// 区域等级范围常量
export const REGION_LEVEL = {
  MIN: 1,
  MAX: 10
};

/**
 * 重量区间价格类型定义
 * @typedef {Object} WeightRangePrice
 * @property {string} id - 区间标识符 (range_1 to range_13)
 * @property {number} min - 最小重量(kg)
 * @property {number} max - 最大重量(kg)
 * @property {string} label - 显示标签 (如 "0-11 KGS")
 * @property {number} price - 该区间的独立价格(无需系数计算)
 * @property {boolean} isActive - 是否启用
 */

/**
 * 区域价格表类型定义
 * @typedef {Object} RegionPriceTable
 * @property {string} regionId - 关联区域ID
 * @property {WeightRangePrice[]} prices - 独立的重量区间价格表
 * @property {'CAD'} currency - 货币单位
 * @property {string} [effectiveDate] - 生效日期 (ISO格式)
 * @property {string} [expiryDate] - 失效日期 (ISO格式)
 */

/**
 * 卡车配送区域类型定义
 * @typedef {Object} TruckDeliveryRegion
 * @property {string} id - UUID
 * @property {string} cityId - 关联城市ID
 * @property {number} level - 区域等级(1-10，仅用于排序和显示)
 * @property {string} name - 区域名称
 * @property {string[]} fsaCodes - FSA代码列表
 * @property {RegionPriceTable} priceTable - 独立价格表(每个重量区间独立定价)
 * @property {string} [displayColor] - 显示颜色(根据等级自动计算)
 * @property {Object} [boundary] - 区域边界(由FSA聚合的GeoJSON)
 * @property {Object} metadata - 元数据
 * @property {string} metadata.createdAt - 创建时间 (ISO格式)
 * @property {string} metadata.updatedAt - 更新时间 (ISO格式)
 * @property {number} metadata.version - 版本号
 */

/**
 * 卡车配送城市类型定义
 * @typedef {Object} TruckDeliveryCity
 * @property {string} id - UUID
 * @property {string} name - 城市名称
 * @property {string} province - 省份代码
 * @property {string} themeColor - 主题色 #RRGGBB
 * @property {TruckDeliveryRegion[]} regions - 区域列表(1-10个)
 * @property {boolean} isActive - 是否启用
 * @property {Object} metadata - 元数据
 * @property {string} metadata.createdAt - 创建时间 (ISO格式)
 * @property {string} metadata.updatedAt - 更新时间 (ISO格式)
 * @property {number} metadata.version - 版本号
 * @property {string} [metadata.createdBy] - 创建者
 * @property {string} [metadata.notes] - 备注
 */

/**
 * 生成UUID (简化版本)
 * @returns {string} UUID字符串
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 将HEX颜色转换为HSL
 * @param {string} hex - HEX颜色值
 * @returns {Object} HSL颜色对象 {h, s, l}
 */
const hexToHSL = (hex) => {
  // 移除 # 号
  hex = hex.replace('#', '');
  
  // 转换为 RGB
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  
  if (max === min) {
    h = s = 0; // 灰色
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
};

/**
 * 将HSL颜色转换为HEX
 * @param {number} h - 色相 (0-360)
 * @param {number} s - 饱和度 (0-100)
 * @param {number} l - 亮度 (0-100)
 * @returns {string} HEX颜色值
 */
const hslToHex = (h, s, l) => {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // 灰色
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * 根据区域等级生成显示颜色
 * @param {number} level - 区域等级 (1-10)
 * @param {string} [baseColor] - 基础颜色（城市主题色），默认为蓝色
 * @param {number} [maxLevel] - 最大等级数，用于调整颜色分布
 * @returns {string} 颜色值 (#RRGGBB)
 */
export const generateRegionColor = (level, baseColor = '#2196F3', maxLevel = 10) => {
  // 验证等级范围
  if (level < REGION_LEVEL.MIN || level > REGION_LEVEL.MAX) {
    level = REGION_LEVEL.MIN;
  }
  
  // 区域1直接使用城市主题色
  if (level === 1) {
    return baseColor;
  }
  
  // 将基础颜色转换为HSL
  const hsl = hexToHSL(baseColor);
  
  // 计算亮度调整
  // 区域1使用基础颜色，区域2开始逐渐变浅
  // 根据实际最大等级调整亮度范围
  const baseLightness = hsl.l; // 基础颜色的亮度
  const maxLightness = 85; // 最浅的亮度
  
  // 从区域2开始计算亮度变化
  const lightnessRange = maxLightness - baseLightness;
  const lightnessStep = lightnessRange / (maxLevel - 1);
  const targetLightness = baseLightness + (level - 1) * lightnessStep;
  
  // 保持色相不变，略微调整饱和度（等级越高饱和度越低）
  const saturationAdjust = 1 - (level - 1) / (maxLevel - 1) * 0.3; // 最多降低30%饱和度
  const targetSaturation = hsl.s * saturationAdjust;
  
  // 生成新颜色
  return hslToHex(hsl.h, targetSaturation, targetLightness);
};

/**
 * 创建默认的重量区间价格
 * @returns {WeightRangePrice[]} 默认重量区间价格列表
 */
export const createDefaultWeightRanges = () => {
  return DEFAULT_WEIGHT_RANGES.map(range => ({
    id: range.id,
    min: range.min,
    max: range.max,
    label: range.label,
    price: 0,
    isActive: true
  }));
};

/**
 * 创建默认的区域价格表
 * @param {string} regionId - 区域ID
 * @returns {RegionPriceTable} 默认价格表
 */
export const createDefaultPriceTable = (regionId) => {
  return {
    regionId,
    prices: createDefaultWeightRanges(),
    currency: CURRENCY_TYPES.CAD,
    effectiveDate: new Date().toISOString(),
    expiryDate: null
  };
};

/**
 * 创建默认的卡车配送区域
 * @param {string} cityId - 关联城市ID
 * @param {number} level - 区域等级 (1-10)
 * @param {string} [name] - 区域名称，默认为"区域{level}"
 * @returns {TruckDeliveryRegion} 默认区域配置
 */
export const createDefaultTruckRegion = (cityId, level, name) => {
  const regionId = generateUUID();
  const now = new Date().toISOString();

  // 验证等级范围
  if (level < REGION_LEVEL.MIN || level > REGION_LEVEL.MAX) {
    throw new Error(`区域等级必须在 ${REGION_LEVEL.MIN}-${REGION_LEVEL.MAX} 之间`);
  }

  return {
    id: regionId,
    cityId,
    level,
    name: name || `区域${level}`,
    fsaCodes: [],
    priceTable: createDefaultPriceTable(regionId),
    displayColor: generateRegionColor(level, undefined, 10), // 默认10级
    boundary: null,
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1
    }
  };
};

/**
 * 创建默认的卡车配送城市
 * @param {string} name - 城市名称
 * @param {string} province - 省份代码
 * @param {string} [themeColor] - 主题色，默认为蓝色
 * @param {string} [createdBy] - 创建者
 * @returns {TruckDeliveryCity} 默认城市配置
 */
export const createDefaultTruckCity = (name, province, themeColor = '#2196F3', createdBy) => {
  const cityId = generateUUID();
  const now = new Date().toISOString();

  return {
    id: cityId,
    name,
    province,
    themeColor,
    regions: [],
    isActive: true,
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
      createdBy,
      notes: ''
    }
  };
};

/**
 * 验证重量区间价格数据
 * @param {WeightRangePrice} weightRange - 重量区间价格数据
 * @returns {Object} 验证结果
 */
export const validateWeightRangePrice = (weightRange) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!weightRange.id || typeof weightRange.id !== 'string') {
    errors.push('重量区间ID是必填项');
  }

  if (typeof weightRange.min !== 'number' || weightRange.min < 0) {
    errors.push('最小重量必须是非负数');
  }

  if (typeof weightRange.max !== 'number' || weightRange.max <= 0) {
    errors.push('最大重量必须是正数');
  }

  if (typeof weightRange.min === 'number' && typeof weightRange.max === 'number') {
    if (weightRange.min >= weightRange.max) {
      errors.push('最小重量必须小于最大重量');
    }
  }

  if (!weightRange.label || typeof weightRange.label !== 'string') {
    errors.push('标签是必填项');
  }

  if (typeof weightRange.price !== 'number' || weightRange.price < 0) {
    errors.push('价格必须是非负数');
  }

  if (typeof weightRange.isActive !== 'boolean') {
    errors.push('激活状态必须是布尔值');
  }

  // 价格合理性警告
  if (weightRange.price > 10000) {
    warnings.push('价格可能过高，请确认');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 验证区域价格表数据
 * @param {RegionPriceTable} priceTable - 区域价格表数据
 * @returns {Object} 验证结果
 */
export const validateRegionPriceTable = (priceTable) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!priceTable.regionId || typeof priceTable.regionId !== 'string') {
    errors.push('区域ID是必填项');
  }

  if (!Array.isArray(priceTable.prices)) {
    errors.push('价格列表必须是数组');
  } else {
    // 验证每个重量区间
    priceTable.prices.forEach((price, index) => {
      const validation = validateWeightRangePrice(price);
      if (!validation.isValid) {
        errors.push(`重量区间${index + 1}: ${validation.errors.join(', ')}`);
      }
      warnings.push(...validation.warnings);
    });

    // 检查重量区间是否有重叠
    const sortedRanges = priceTable.prices
      .filter(p => p.isActive)
      .sort((a, b) => a.min - b.min);
    
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const current = sortedRanges[i];
      const next = sortedRanges[i + 1];
      if (current.max >= next.min) {
        warnings.push(`重量区间 ${current.label} 和 ${next.label} 存在重叠`);
      }
    }
  }

  if (priceTable.currency !== CURRENCY_TYPES.CAD) {
    errors.push('货币类型必须是CAD');
  }

  // 日期格式验证
  if (priceTable.effectiveDate && isNaN(new Date(priceTable.effectiveDate))) {
    errors.push('生效日期格式无效');
  }

  if (priceTable.expiryDate && isNaN(new Date(priceTable.expiryDate))) {
    errors.push('失效日期格式无效');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 验证卡车配送区域数据
 * @param {TruckDeliveryRegion} region - 区域数据
 * @returns {Object} 验证结果
 */
export const validateTruckDeliveryRegion = (region) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!region.id || typeof region.id !== 'string') {
    errors.push('区域ID是必填项');
  }

  if (!region.cityId || typeof region.cityId !== 'string') {
    errors.push('城市ID是必填项');
  }

  if (typeof region.level !== 'number' || region.level < REGION_LEVEL.MIN || region.level > REGION_LEVEL.MAX) {
    errors.push(`区域等级必须在 ${REGION_LEVEL.MIN}-${REGION_LEVEL.MAX} 之间`);
  }

  if (!region.name || typeof region.name !== 'string') {
    errors.push('区域名称是必填项');
  }

  if (!Array.isArray(region.fsaCodes)) {
    errors.push('FSA代码列表必须是数组');
  } else {
    // 验证FSA代码格式
    region.fsaCodes.forEach((fsa, index) => {
      if (!validateFSAFormat(fsa)) {
        errors.push(`第${index + 1}个FSA代码格式无效: ${fsa}`);
      }
    });

    // 检查FSA代码重复
    const uniqueFSAs = new Set(region.fsaCodes);
    if (uniqueFSAs.size !== region.fsaCodes.length) {
      warnings.push('FSA列表中存在重复项');
    }
  }

  // 验证价格表
  if (!region.priceTable) {
    errors.push('价格表是必填项');
  } else {
    const priceValidation = validateRegionPriceTable(region.priceTable);
    if (!priceValidation.isValid) {
      errors.push(...priceValidation.errors);
    }
    warnings.push(...priceValidation.warnings);
  }

  // 验证元数据
  if (!region.metadata) {
    errors.push('元数据是必填项');
  } else {
    if (!region.metadata.createdAt || isNaN(new Date(region.metadata.createdAt))) {
      errors.push('创建时间无效');
    }

    if (!region.metadata.updatedAt || isNaN(new Date(region.metadata.updatedAt))) {
      errors.push('更新时间无效');
    }

    if (typeof region.metadata.version !== 'number' || region.metadata.version < 1) {
      errors.push('版本号必须是正整数');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 验证卡车配送城市数据
 * @param {TruckDeliveryCity} city - 城市数据
 * @returns {Object} 验证结果
 */
export const validateTruckDeliveryCity = (city) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!city.id || typeof city.id !== 'string') {
    errors.push('城市ID是必填项');
  }

  if (!city.name || typeof city.name !== 'string') {
    errors.push('城市名称是必填项');
  }

  if (!city.province || typeof city.province !== 'string') {
    errors.push('省份代码是必填项');
  }

  // 主题色格式验证
  if (!city.themeColor || typeof city.themeColor !== 'string') {
    errors.push('主题色是必填项');
  } else {
    const colorPattern = /^#[0-9A-F]{6}$/i;
    if (!colorPattern.test(city.themeColor)) {
      errors.push('主题色格式无效，应为 #RRGGBB 格式');
    }
  }

  if (!Array.isArray(city.regions)) {
    errors.push('区域列表必须是数组');
  } else {
    // 验证区域数量
    if (city.regions.length > 10) {
      errors.push('城市最多只能有10个区域');
    }

    // 验证每个区域
    city.regions.forEach((region, index) => {
      const regionValidation = validateTruckDeliveryRegion(region);
      if (!regionValidation.isValid) {
        errors.push(`区域${index + 1}: ${regionValidation.errors.join(', ')}`);
      }
      warnings.push(...regionValidation.warnings);
    });

    // 检查区域等级重复
    const levels = city.regions.map(r => r.level);
    const uniqueLevels = new Set(levels);
    if (uniqueLevels.size !== levels.length) {
      warnings.push('城市中存在重复的区域等级');
    }

    // 检查FSA代码跨区域重复
    const allFSAs = city.regions.flatMap(r => r.fsaCodes);
    const uniqueFSAs = new Set(allFSAs);
    if (uniqueFSAs.size !== allFSAs.length) {
      warnings.push('城市中存在跨区域重复的FSA代码');
    }
  }

  if (typeof city.isActive !== 'boolean') {
    errors.push('激活状态必须是布尔值');
  }

  // 验证元数据 - 兼容多种数据格式
  // 时间戳可能在根级别或metadata中
  const createdAt = city.created_at || city.createdAt || city.metadata?.createdAt;
  const updatedAt = city.updated_at || city.updatedAt || city.metadata?.updatedAt;
  const version = city.version || city.metadata?.version;

  // 如果没有metadata对象，但有根级别的时间戳，创建metadata
  if (!city.metadata && (createdAt || updatedAt || version)) {
    // 不报错，因为数据存在，只是结构不同
  } else if (!city.metadata) {
    errors.push('元数据是必填项');
  }

  // 验证时间戳（无论在哪个级别）
  if (createdAt && !isNaN(new Date(createdAt))) {
    // 时间戳有效
  } else if (!createdAt) {
    errors.push('创建时间缺失');
  } else {
    errors.push('创建时间格式无效');
  }

  if (updatedAt && !isNaN(new Date(updatedAt))) {
    // 时间戳有效
  } else if (!updatedAt) {
    errors.push('更新时间缺失');
  } else {
    errors.push('更新时间格式无效');
  }

  // 版本号验证，允许为0或未定义（新创建的数据）
  if (version !== undefined && version !== null) {
    if (typeof version !== 'number' || version < 0 || !Number.isInteger(version)) {
      errors.push('版本号必须是非负整数');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 获取区域统计信息
 * @param {TruckDeliveryRegion} region - 区域数据
 * @returns {Object} 统计信息
 */
export const getRegionStats = (region) => {
  if (!region) {
    return {
      fsaCount: 0,
      activePriceRanges: 0,
      totalPrice: 0,
      averagePrice: 0
    };
  }

  const fsaCount = region.fsaCodes ? region.fsaCodes.length : 0;
  const activePrices = region.priceTable?.prices?.filter(p => p.isActive) || [];
  const totalPrice = activePrices.reduce((sum, price) => sum + price.price, 0);
  const averagePrice = activePrices.length > 0 ? totalPrice / activePrices.length : 0;

  return {
    fsaCount,
    activePriceRanges: activePrices.length,
    totalPrice,
    averagePrice: Math.round(averagePrice * 100) / 100
  };
};

/**
 * 获取城市统计信息
 * @param {TruckDeliveryCity} city - 城市数据
 * @returns {Object} 统计信息
 */
export const getCityStats = (city) => {
  if (!city || !Array.isArray(city.regions)) {
    return {
      regionCount: 0,
      totalFSAs: 0,
      activePriceRanges: 0,
      averageRegionPrice: 0
    };
  }

  const regionCount = city.regions.length;
  const totalFSAs = city.regions.reduce((sum, region) => sum + (region.fsaCodes?.length || 0), 0);
  
  const regionStats = city.regions.map(region => getRegionStats(region));
  const totalActivePriceRanges = regionStats.reduce((sum, stats) => sum + stats.activePriceRanges, 0);
  const totalRegionPrices = regionStats.reduce((sum, stats) => sum + stats.totalPrice, 0);
  const averageRegionPrice = regionCount > 0 ? totalRegionPrices / regionCount : 0;

  return {
    regionCount,
    totalFSAs,
    activePriceRanges: totalActivePriceRanges,
    averageRegionPrice: Math.round(averageRegionPrice * 100) / 100
  };
};

/**
 * 卡车配送区域级别配置 - 移到这里避免初始化错误
 */
export const TRUCK_ZONE_LEVELS = {
  1: { name: '核心区', color: '#10B981', priority: 'highest' },
  2: { name: '主要区', color: '#3B82F6', priority: 'high' },
  3: { name: '标准区', color: '#8B5CF6', priority: 'medium' },
  4: { name: '外围区', color: '#F59E0B', priority: 'low' },
  5: { name: '偏远区', color: '#EF4444', priority: 'lowest' }
};

// 导出所有类型定义和工厂函数
export default {
  // 常量
  TRUCK_STORAGE_KEYS,
  CURRENCY_TYPES,
  REGION_LEVEL,

  // 工厂函数
  createDefaultWeightRanges,
  createDefaultPriceTable,
  createDefaultTruckRegion,
  createDefaultTruckCity,
  generateRegionColor,

  // 验证函数
  validateWeightRangePrice,
  validateRegionPriceTable,
  validateTruckDeliveryRegion,
  validateTruckDeliveryCity,

  // 统计函数
  getRegionStats,
  getCityStats,

  // 新增卡车配送区域模型
  validateTruckDeliveryZone,
  createDefaultTruckDeliveryZone,
  TRUCK_ZONE_LEVELS,
  getTruckZoneLevelInfo,
  validateTruckDeliveryZones
};

/**
 * 卡车配送区域数据模型（独立于FSA区域）
 * @typedef {Object} TruckDeliveryZone
 * @property {string} id - 区域唯一标识
 * @property {string} name - 区域名称
 * @property {number} level - 配送优先级（1-5）
 * @property {string} cityId - 所属城市ID
 * @property {Array} boundaries - GeoJSON边界数据
 * @property {string[]} fsaCodes - 关联的FSA代码列表
 * @property {Object} coverage - 覆盖范围信息
 * @property {number} coverage.area - 覆盖面积（平方公里）
 * @property {number} coverage.population - 覆盖人口数
 * @property {Object} metrics - 配送指标
 * @property {number} metrics.avgDeliveryTime - 平均配送时间（小时）
 * @property {number} metrics.dailyCapacity - 日配送能力
 * @property {number} metrics.activeDrivers - 活跃司机数
 * @property {string} color - 显示颜色（十六进制）
 * @property {boolean} active - 是否启用
 * @property {Date} createdAt - 创建时间
 * @property {Date} updatedAt - 更新时间
 */

/**
 * 验证卡车配送区域数据
 * @param {any} zone - 待验证的区域数据
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
export function validateTruckDeliveryZone(zone) {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!zone || typeof zone !== 'object') {
    errors.push('区域数据必须是有效的对象');
    return { valid: false, errors, warnings };
  }

  if (!zone.id || typeof zone.id !== 'string') {
    errors.push('区域ID是必填的字符串');
  }

  if (!zone.name || typeof zone.name !== 'string') {
    errors.push('区域名称是必填的字符串');
  }

  if (!zone.cityId || typeof zone.cityId !== 'string') {
    errors.push('城市ID是必填的字符串');
  }

  // 级别验证
  if (typeof zone.level !== 'number' || zone.level < 1 || zone.level > 5) {
    errors.push('区域级别必须是1-5之间的数字');
  }

  // FSA代码验证
  if (!Array.isArray(zone.fsaCodes)) {
    errors.push('FSA代码列表必须是数组');
  } else if (zone.fsaCodes.length === 0) {
    warnings.push('FSA代码列表为空');
  } else {
    zone.fsaCodes.forEach((fsa, index) => {
      if (typeof fsa !== 'string' || !/^[A-Z]\d[A-Z]$/.test(fsa)) {
        errors.push(`FSA代码[${index}]: "${fsa}" 格式不正确`);
      }
    });
  }

  // 边界数据验证
  if (zone.boundaries) {
    if (!Array.isArray(zone.boundaries)) {
      errors.push('边界数据必须是数组');
    }
  } else {
    warnings.push('缺少边界数据');
  }

  // 覆盖范围验证
  if (zone.coverage) {
    if (typeof zone.coverage.area === 'number' && zone.coverage.area < 0) {
      errors.push('覆盖面积不能为负数');
    }
    if (typeof zone.coverage.population === 'number' && zone.coverage.population < 0) {
      errors.push('覆盖人口不能为负数');
    }
  }

  // 指标验证
  if (zone.metrics) {
    if (typeof zone.metrics.avgDeliveryTime === 'number' && zone.metrics.avgDeliveryTime < 0) {
      errors.push('平均配送时间不能为负数');
    }
    if (typeof zone.metrics.dailyCapacity === 'number' && zone.metrics.dailyCapacity < 0) {
      errors.push('日配送能力不能为负数');
    }
    if (typeof zone.metrics.activeDrivers === 'number' && zone.metrics.activeDrivers < 0) {
      errors.push('活跃司机数不能为负数');
    }
  }

  // 颜色验证
  if (zone.color && !/^#[0-9A-Fa-f]{6}$/.test(zone.color)) {
    warnings.push('颜色格式应为六位十六进制（如：#FF5733）');
  }

  // 状态验证
  if (typeof zone.active !== 'boolean') {
    warnings.push('active字段应为布尔值，默认设为true');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 创建默认的卡车配送区域
 * @param {Partial<TruckDeliveryZone>} overrides - 覆盖默认值的字段
 * @returns {TruckDeliveryZone}
 */
export function createDefaultTruckDeliveryZone(overrides = {}) {
  const now = new Date();
  
  return {
    id: `truck_zone_${Date.now()}`,
    name: '新配送区域',
    level: 3,
    cityId: '',
    boundaries: [],
    fsaCodes: [],
    coverage: {
      area: 0,
      population: 0
    },
    metrics: {
      avgDeliveryTime: 2.5,
      dailyCapacity: 100,
      activeDrivers: 5
    },
    color: '#3B82F6',
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}


/**
 * 获取区域级别信息
 * @param {number} level
 * @returns {Object}
 */
export function getTruckZoneLevelInfo(level) {
  return TRUCK_ZONE_LEVELS[level] || TRUCK_ZONE_LEVELS[3];
}

/**
 * 批量验证卡车配送区域
 * @param {Array} zones
 * @returns {{valid: boolean, results: Array}}
 */
export function validateTruckDeliveryZones(zones) {
  if (!Array.isArray(zones)) {
    return {
      valid: false,
      results: [{
        index: -1,
        valid: false,
        errors: ['输入必须是数组'],
        warnings: []
      }]
    };
  }

  const results = zones.map((zone, index) => ({
    index,
    ...validateTruckDeliveryZone(zone)
  }));

  return {
    valid: results.every(r => r.valid),
    results
  };
}