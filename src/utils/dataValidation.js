// FSA数据验证和完整性检查工具

import { completeFSAData } from '../data/canadaFSAData.js';

/**
 * 验证FSA代码格式
 * 加拿大FSA格式：字母-数字-字母 (例如: V6B, M5V, T2P)
 */
export const validateFSAFormat = (fsa) => {
  if (!fsa || typeof fsa !== 'string') return false;
  
  // 标准FSA格式：第一个字符是字母，第二个是数字，第三个是字母
  const fsaPattern = /^[A-Z][0-9][A-Z]$/;
  return fsaPattern.test(fsa.toUpperCase());
};

/**
 * 验证FSA是否在可配送列表中
 */
export const isFSADeliverable = (fsa) => {
  if (!validateFSAFormat(fsa)) return false;
  return completeFSAData.includes(fsa.toUpperCase());
};

/**
 * 根据FSA代码获取省份信息
 */
export const getFSAProvince = (fsa) => {
  if (!validateFSAFormat(fsa)) return null;
  
  const firstChar = fsa.charAt(0).toUpperCase();
  const provinceMap = {
    'A': { name: '纽芬兰与拉布拉多省', code: 'NL' },
    'B': { name: '新斯科舍省', code: 'NS' },
    'C': { name: '爱德华王子岛省', code: 'PE' },
    'E': { name: '新不伦瑞克省', code: 'NB' },
    'G': { name: '魁北克省', code: 'QC' },
    'H': { name: '魁北克省', code: 'QC' },
    'J': { name: '魁北克省', code: 'QC' },
    'K': { name: '安大略省', code: 'ON' },
    'L': { name: '安大略省', code: 'ON' },
    'M': { name: '安大略省', code: 'ON' },
    'N': { name: '安大略省', code: 'ON' },
    'P': { name: '安大略省', code: 'ON' },
    'R': { name: '马尼托巴省', code: 'MB' },
    'S': { name: '萨斯喀彻温省', code: 'SK' },
    'T': { name: '阿尔伯塔省', code: 'AB' },
    'V': { name: '不列颠哥伦比亚省', code: 'BC' },
    'X': { name: '西北地区/努纳武特地区', code: 'NT/NU' },
    'Y': { name: '育空地区', code: 'YT' }
  };
  
  return provinceMap[firstChar] || null;
};

/**
 * 验证GeoJSON特征数据完整性
 */
export const validateGeoJSONFeature = (feature) => {
  const errors = [];
  
  // 检查基本结构
  if (!feature || typeof feature !== 'object') {
    errors.push('特征不是有效的对象');
    return { isValid: false, errors };
  }
  
  if (feature.type !== 'Feature') {
    errors.push('特征类型不是 "Feature"');
  }
  
  // 检查属性
  if (!feature.properties) {
    errors.push('缺少properties属性');
  } else {
    if (!feature.properties.CFSAUID) {
      errors.push('缺少CFSAUID属性');
    } else if (!validateFSAFormat(feature.properties.CFSAUID)) {
      errors.push(`FSA代码格式无效: ${feature.properties.CFSAUID}`);
    }
    
    if (typeof feature.properties.LANDAREA !== 'number') {
      errors.push('LANDAREA应该是数字类型');
    }
  }
  
  // 检查几何数据
  if (!feature.geometry) {
    errors.push('缺少geometry属性');
  } else {
    if (!['Polygon', 'MultiPolygon'].includes(feature.geometry.type)) {
      errors.push(`几何类型应该是Polygon或MultiPolygon，当前是: ${feature.geometry.type}`);
    }
    
    if (!feature.geometry.coordinates || !Array.isArray(feature.geometry.coordinates)) {
      errors.push('坐标数据无效');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 验证整个GeoJSON数据集
 */
export const validateGeoJSONDataset = (geojson) => {
  const report = {
    isValid: true,
    totalFeatures: 0,
    validFeatures: 0,
    invalidFeatures: 0,
    errors: [],
    warnings: [],
    summary: {}
  };
  
  // 检查根级别结构
  if (!geojson || geojson.type !== 'FeatureCollection') {
    report.isValid = false;
    report.errors.push('数据不是有效的FeatureCollection');
    return report;
  }
  
  if (!Array.isArray(geojson.features)) {
    report.isValid = false;
    report.errors.push('features应该是数组');
    return report;
  }
  
  report.totalFeatures = geojson.features.length;
  
  // 验证每个特征
  const provinces = {};
  const duplicateFSAs = new Set();
  const fsaCounts = {};
  
  geojson.features.forEach((feature, index) => {
    const validation = validateGeoJSONFeature(feature);
    
    if (validation.isValid) {
      report.validFeatures++;
      
      const fsa = feature.properties.CFSAUID;
      const province = getFSAProvince(fsa);
      
      // 统计省份分布
      if (province) {
        provinces[province.code] = (provinces[province.code] || 0) + 1;
      }
      
      // 检查重复FSA
      if (fsaCounts[fsa]) {
        duplicateFSAs.add(fsa);
        report.warnings.push(`发现重复的FSA: ${fsa}`);
      }
      fsaCounts[fsa] = (fsaCounts[fsa] || 0) + 1;
      
    } else {
      report.invalidFeatures++;
      report.errors.push(`特征 ${index}: ${validation.errors.join(', ')}`);
    }
  });
  
  // 检查是否有重复
  if (duplicateFSAs.size > 0) {
    report.warnings.push(`发现 ${duplicateFSAs.size} 个重复的FSA代码`);
  }
  
  // 生成汇总
  report.summary = {
    provinces,
    duplicateFSAs: Array.from(duplicateFSAs),
    coverage: `${((report.validFeatures / report.totalFeatures) * 100).toFixed(2)}%`
  };
  
  report.isValid = report.invalidFeatures === 0;
  
  return report;
};

/**
 * 检查可配送FSA列表的覆盖率
 */
export const checkDeliveryCoverage = (geojsonData) => {
  const availableFSAs = new Set(
    geojsonData.features
      .filter(f => f.properties && f.properties.CFSAUID)
      .map(f => f.properties.CFSAUID)
  );
  
  const covered = completeFSAData.filter(fsa => availableFSAs.has(fsa));
  const missing = completeFSAData.filter(fsa => !availableFSAs.has(fsa));
  
  return {
    totalConfigured: completeFSAData.length,
    covered: covered.length,
    missing: missing.length,
    missingFSAs: missing,
    coverageRate: `${((covered.length / completeFSAData.length) * 100).toFixed(2)}%`
  };
};

/**
 * 生成数据质量报告
 */
export const generateDataQualityReport = (geojsonData) => {
  console.log('🔍 开始数据质量检查...');
  
  const validation = validateGeoJSONDataset(geojsonData);
  const coverage = checkDeliveryCoverage(geojsonData);
  
  const report = {
    timestamp: new Date().toISOString(),
    validation,
    coverage,
    recommendations: []
  };
  
  // 生成建议
  if (validation.invalidFeatures > 0) {
    report.recommendations.push('清理无效的特征数据');
  }
  
  if (coverage.missing.length > 0) {
    report.recommendations.push(`补充缺失的 ${coverage.missing.length} 个FSA边界数据`);
  }
  
  if (validation.warnings.length > 0) {
    report.recommendations.push('检查并移除重复的FSA条目');
  }
  
  console.log('📊 数据质量报告:', {
    '总特征数': validation.totalFeatures,
    '有效特征': validation.validFeatures,
    '配送覆盖率': coverage.coverageRate,
    '数据质量': validation.isValid ? '✅ 良好' : '⚠️ 需要修复'
  });
  
  return report;
};

// 导出常用的验证函数
export default {
  validateFSAFormat,
  isFSADeliverable,
  getFSAProvince,
  validateGeoJSONFeature,
  validateGeoJSONDataset,
  checkDeliveryCoverage,
  generateDataQualityReport
}; 