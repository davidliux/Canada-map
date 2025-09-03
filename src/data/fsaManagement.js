/**
 * FSA分区管理数据结构和工具函数
 * 用于管理邮编分区的邮编绑定和价格配置
 */

// 默认重量区间配置
export const DEFAULT_WEIGHT_RANGES = [
  { id: 'range_1', min: 0, max: 11.000, label: '0-11.000 KGS' },
  { id: 'range_2', min: 11.001, max: 15.000, label: '11.001-15.000 KGS' },
  { id: 'range_3', min: 15.001, max: 20.000, label: '15.001-20.000 KGS' },
  { id: 'range_4', min: 20.001, max: 25.000, label: '20.001-25.000 KGS' },
  { id: 'range_5', min: 25.001, max: 30.000, label: '25.001-30.000 KGS' },
  { id: 'range_6', min: 30.001, max: 35.000, label: '30.001-35.000 KGS' },
  { id: 'range_7', min: 35.001, max: 40.000, label: '35.001-40.000 KGS' },
  { id: 'range_8', min: 40.001, max: 45.000, label: '40.001-45.000 KGS' },
  { id: 'range_9', min: 45.001, max: 50.000, label: '45.001-50.000 KGS' },
  { id: 'range_10', min: 50.001, max: 55.000, label: '50.001-55.000 KGS' },
  { id: 'range_11', min: 55.001, max: 60.000, label: '55.001-60.000 KGS' },
  { id: 'range_12', min: 60.001, max: 64.000, label: '60.001-64.000 KGS' },
  { id: 'range_13', min: 64.001, max: Infinity, label: '64.000+ KGS' }
];

/**
 * FSA分区配置数据结构
 * @typedef {Object} FSAConfiguration
 * @property {string} fsaCode - FSA代码 (如 'V6B')
 * @property {string} province - 省份代码
 * @property {string} region - 地区名称
 * @property {string[]} postalCodes - 绑定的邮编列表
 * @property {WeightRangePrice[]} weightRanges - 重量区间价格配置
 * @property {boolean} isActive - 是否启用配送
 * @property {string} lastUpdated - 最后更新时间
 * @property {Object} metadata - 元数据信息
 */

/**
 * 重量区间价格配置
 * @typedef {Object} WeightRangePrice
 * @property {string} id - 区间唯一标识
 * @property {number} min - 最小重量 (KGS)
 * @property {number} max - 最大重量 (KGS)
 * @property {string} label - 显示标签
 * @property {number} price - 配送价格 (CAD)
 * @property {boolean} isActive - 是否启用此区间
 */

/**
 * 创建默认的FSA配置
 * @param {string} fsaCode - FSA代码
 * @param {string} province - 省份
 * @param {string} region - 地区
 * @returns {FSAConfiguration}
 */
export const createDefaultFSAConfig = (fsaCode, province = '', region = '') => {
  return {
    fsaCode,
    province,
    region,
    postalCodes: [],
    weightRanges: DEFAULT_WEIGHT_RANGES.map(range => ({
      ...range,
      price: 0,
      isActive: true
    })),
    isActive: true,
    lastUpdated: new Date().toISOString(),
    metadata: {
      createdAt: new Date().toISOString(),
      version: '1.0.0',
      notes: ''
    }
  };
};

/**
 * 验证FSA配置数据
 * @param {FSAConfiguration} config - 配置对象
 * @returns {Object} 验证结果
 */
export const validateFSAConfig = (config) => {
  const errors = [];
  const warnings = [];

  // 必填字段验证
  if (!config.fsaCode || typeof config.fsaCode !== 'string') {
    errors.push('FSA代码是必填项');
  }

  if (!Array.isArray(config.postalCodes)) {
    errors.push('邮编列表必须是数组');
  }

  if (!Array.isArray(config.weightRanges)) {
    errors.push('重量区间配置必须是数组');
  }

  // 重量区间验证
  if (config.weightRanges) {
    config.weightRanges.forEach((range, index) => {
      if (typeof range.min !== 'number' || typeof range.max !== 'number') {
        errors.push(`重量区间 ${index + 1}: 最小值和最大值必须是数字`);
      }
      
      if (range.min >= range.max && range.max !== Infinity) {
        errors.push(`重量区间 ${index + 1}: 最小值必须小于最大值`);
      }

      if (typeof range.price !== 'number' || range.price < 0) {
        errors.push(`重量区间 ${index + 1}: 价格必须是非负数字`);
      }
    });

    // 检查重量区间是否有重叠
    const sortedRanges = [...config.weightRanges].sort((a, b) => a.min - b.min);
    for (let i = 0; i < sortedRanges.length - 1; i++) {
      const current = sortedRanges[i];
      const next = sortedRanges[i + 1];
      if (current.max >= next.min) {
        warnings.push(`重量区间重叠: ${current.label} 和 ${next.label}`);
      }
    }
  }

  // 邮编格式验证
  if (config.postalCodes) {
    config.postalCodes.forEach((code, index) => {
      if (typeof code !== 'string' || !/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/.test(code)) {
        warnings.push(`邮编 ${index + 1}: ${code} 格式可能不正确`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * 格式化重量区间标签
 * @param {number} min - 最小重量
 * @param {number} max - 最大重量
 * @returns {string}
 */
export const formatWeightRangeLabel = (min, max) => {
  if (max === Infinity) {
    return `${min.toFixed(3)}+ KGS`;
  }
  return `${min.toFixed(3)}-${max.toFixed(3)} KGS`;
};

/**
 * 计算指定重量的配送价格
 * @param {number} weight - 重量 (KGS)
 * @param {WeightRangePrice[]} weightRanges - 重量区间配置
 * @returns {number|null} 价格或null（如果没有匹配的区间）
 */
export const calculateShippingPrice = (weight, weightRanges) => {
  const activeRanges = weightRanges.filter(range => range.isActive);
  
  for (const range of activeRanges) {
    if (weight >= range.min && weight <= range.max) {
      return range.price;
    }
  }
  
  return null;
};

/**
 * 生成重量区间ID
 * @param {number} min - 最小重量
 * @param {number} max - 最大重量
 * @returns {string}
 */
export const generateWeightRangeId = (min, max) => {
  const maxStr = max === Infinity ? 'inf' : max.toString().replace('.', '_');
  return `range_${min.toString().replace('.', '_')}_${maxStr}`;
};

/**
 * 排序重量区间
 * @param {WeightRangePrice[]} ranges - 重量区间数组
 * @returns {WeightRangePrice[]}
 */
export const sortWeightRanges = (ranges) => {
  return [...ranges].sort((a, b) => a.min - b.min);
};
