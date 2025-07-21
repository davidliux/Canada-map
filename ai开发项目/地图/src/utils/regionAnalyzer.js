/**
 * 区域分析工具
 * 用于分析区域的省份分布和智能缩放
 */

// 省份映射表
const PROVINCE_MAPPING = {
  'V': { code: 'BC', name: '不列颠哥伦比亚省', color: '#3B82F6' },
  'T': { code: 'AB', name: '阿尔伯塔省', color: '#F59E0B' },
  'S': { code: 'SK', name: '萨斯喀彻温省', color: '#10B981' },
  'R': { code: 'MB', name: '马尼托巴省', color: '#EF4444' },
  'P': { code: 'ON', name: '安大略省', color: '#22C55E' },
  'L': { code: 'ON', name: '安大略省', color: '#22C55E' },
  'M': { code: 'ON', name: '安大略省', color: '#22C55E' },
  'N': { code: 'ON', name: '安大略省', color: '#22C55E' },
  'K': { code: 'ON', name: '安大略省', color: '#22C55E' },
  'H': { code: 'QC', name: '魁北克省', color: '#8B5CF6' },
  'J': { code: 'QC', name: '魁北克省', color: '#8B5CF6' },
  'G': { code: 'QC', name: '魁北克省', color: '#8B5CF6' },
  'E': { code: 'NB', name: '新不伦瑞克省', color: '#F97316' },
  'B': { code: 'NS', name: '新斯科舍省', color: '#06B6D4' },
  'C': { code: 'PE', name: '爱德华王子岛省', color: '#84CC16' },
  'A': { code: 'NL', name: '纽芬兰和拉布拉多省', color: '#EC4899' },
  'X': { code: 'NU', name: '努纳武特地区', color: '#6366F1' },
  'Y': { code: 'YT', name: '育空地区', color: '#14B8A6' }
};

// 省份边界配置
const PROVINCE_BOUNDS = {
  'BC': { center: [53.7267, -127.6476], zoom: 6 },
  'AB': { center: [53.9333, -116.5765], zoom: 6 },
  'SK': { center: [52.9399, -106.4509], zoom: 6 },
  'MB': { center: [53.7609, -98.8139], zoom: 6 },
  'ON': { center: [51.2538, -85.3232], zoom: 5 },
  'QC': { center: [53.9218, -72.7441], zoom: 5 },
  'NB': { center: [46.5653, -66.4619], zoom: 7 },
  'NS': { center: [44.6820, -63.7443], zoom: 7 },
  'PE': { center: [46.5107, -63.4168], zoom: 8 },
  'NL': { center: [53.1355, -57.6604], zoom: 6 },
  'NU': { center: [70.2998, -83.1076], zoom: 4 },
  'YT': { center: [64.2823, -135.0000], zoom: 5 },
  'all': { center: [56.1304, -106.3468], zoom: 4 }
};

/**
 * 根据FSA代码获取省份信息
 * @param {string} fsaCode - FSA代码（如 'H1A'）
 * @returns {Object} 省份信息
 */
export const getProvinceFromFSA = (fsaCode) => {
  if (!fsaCode || typeof fsaCode !== 'string') {
    return { code: 'unknown', name: '未知省份', color: '#6B7280' };
  }
  
  const firstChar = fsaCode.charAt(0).toUpperCase();
  return PROVINCE_MAPPING[firstChar] || { code: 'unknown', name: '未知省份', color: '#6B7280' };
};

/**
 * 分析区域的省份分布
 * @param {string[]} postalCodes - 邮编列表
 * @returns {Object} 省份分布分析结果
 */
export const analyzeRegionProvinces = (postalCodes) => {
  if (!postalCodes || !Array.isArray(postalCodes)) {
    return {
      provinces: {},
      primaryProvince: null,
      totalCodes: 0,
      provinceCount: 0
    };
  }

  const provinces = {};
  
  // 统计每个省份的邮编数量
  postalCodes.forEach(code => {
    const province = getProvinceFromFSA(code);
    const provinceCode = province.code;
    
    if (!provinces[provinceCode]) {
      provinces[provinceCode] = {
        code: provinceCode,
        name: province.name,
        color: province.color,
        postalCodes: [],
        count: 0
      };
    }
    
    provinces[provinceCode].postalCodes.push(code);
    provinces[provinceCode].count++;
  });

  // 找到邮编数量最多的省份
  let primaryProvince = null;
  let maxCount = 0;
  
  Object.values(provinces).forEach(province => {
    if (province.count > maxCount) {
      maxCount = province.count;
      primaryProvince = province;
    }
  });

  // 按邮编数量排序省份列表
  const sortedProvinces = Object.values(provinces).sort((a, b) => b.count - a.count);

  return {
    provinces,
    sortedProvinces,
    primaryProvince,
    totalCodes: postalCodes.length,
    provinceCount: Object.keys(provinces).length
  };
};

/**
 * 获取省份的地理边界
 * @param {string} provinceCode - 省份代码
 * @returns {Object} 省份边界信息
 */
export const getProvinceBounds = (provinceCode) => {
  return PROVINCE_BOUNDS[provinceCode] || PROVINCE_BOUNDS['all'];
};

/**
 * 计算智能缩放目标
 * @param {string[]} postalCodes - 邮编列表
 * @param {Object} mapData - 地图数据
 * @returns {Object} 缩放目标信息
 */
export const calculateSmartZoomTarget = (postalCodes, mapData) => {
  const analysis = analyzeRegionProvinces(postalCodes);
  
  if (!analysis.primaryProvince) {
    return {
      type: 'default',
      target: PROVINCE_BOUNDS['all'],
      analysis
    };
  }

  // 如果只有一个省份，直接缩放到该省份
  if (analysis.provinceCount === 1) {
    return {
      type: 'single_province',
      target: getProvinceBounds(analysis.primaryProvince.code),
      analysis
    };
  }

  // 如果有多个省份，缩放到主要省份
  return {
    type: 'multi_province_smart',
    target: getProvinceBounds(analysis.primaryProvince.code),
    analysis
  };
};

/**
 * 生成省份导航列表
 * @param {Object} analysis - 省份分析结果
 * @returns {Array} 导航项列表
 */
export const generateProvinceNavigation = (analysis) => {
  if (!analysis.sortedProvinces || analysis.sortedProvinces.length === 0) {
    return [];
  }

  return analysis.sortedProvinces.map((province, index) => ({
    code: province.code,
    name: province.name,
    color: province.color,
    count: province.count,
    percentage: ((province.count / analysis.totalCodes) * 100).toFixed(1),
    isPrimary: index === 0,
    bounds: getProvinceBounds(province.code)
  }));
};

/**
 * 格式化省份统计信息
 * @param {Object} analysis - 省份分析结果
 * @returns {string} 格式化的统计信息
 */
export const formatProvinceStats = (analysis) => {
  if (!analysis.primaryProvince) {
    return '无数据';
  }

  if (analysis.provinceCount === 1) {
    return `${analysis.primaryProvince.name} (${analysis.totalCodes}个邮编)`;
  }

  return `主要: ${analysis.primaryProvince.name} (${analysis.primaryProvince.count}个) + ${analysis.provinceCount - 1}个其他省份`;
};

/**
 * 检查是否需要显示省份导航
 * @param {Object} analysis - 省份分析结果
 * @returns {boolean} 是否需要显示导航
 */
export const shouldShowProvinceNavigation = (analysis) => {
  return analysis && analysis.provinceCount > 1;
};

export default {
  getProvinceFromFSA,
  analyzeRegionProvinces,
  getProvinceBounds,
  calculateSmartZoomTarget,
  generateProvinceNavigation,
  formatProvinceStats,
  shouldShowProvinceNavigation
};
