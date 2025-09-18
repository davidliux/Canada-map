import fsaBoundariesData from '../../public/data/canada_fsa_boundaries.json';

// 从GeoJSON中提取所有FSA代码（1643个）
const extractAllFSAs = () => {
  return fsaBoundariesData.features.map(feature => feature.properties.CFSAUID);
};

// 使用所有FSA（1643个）
export const deliverableFSAs = extractAllFSAs();

// 为了兼容旧代码，导出completeFSAData作为别名
export const completeFSAData = deliverableFSAs;

// 省份名称映射
export const provinceNames = {
  'BC': 'British Columbia',
  'AB': 'Alberta',
  'SK': 'Saskatchewan',
  'MB': 'Manitoba',
  'ON': 'Ontario',
  'QC': 'Quebec',
  'NB': 'New Brunswick',
  'NS': 'Nova Scotia',
  'PE': 'Prince Edward Island',
  'NL': 'Newfoundland and Labrador',
  'YT': 'Yukon',
  'NT': 'Northwest Territories',
  'NU': 'Nunavut'
};

// 按省份分组FSA数据
export const getFSAsByProvince = () => {
  const provinces = {
    'BC': [], 'ON': [], 'QC': [], 'AB': [], 'MB': [], 'SK': [],
    'NS': [], 'NB': [], 'NL': [], 'PE': [], 'YT': [], 'NT': [], 'NU': []
  };

  // 省份代码映射
  const provinceCodeMap = {
    '10': 'NL', '11': 'PE', '12': 'NS', '13': 'NB', '24': 'QC',
    '35': 'ON', '46': 'MB', '47': 'SK', '48': 'AB', '59': 'BC',
    '60': 'YT', '61': 'NT', '62': 'NU'
  };

  fsaBoundariesData.features.forEach(feature => {
    const fsa = feature.properties.CFSAUID;
    const pruid = feature.properties.PRUID;
    const province = provinceCodeMap[pruid];

    if (province && provinces[province]) {
      provinces[province].push(fsa);
    }
  });

  return provinces;
};

// 检查FSA是否可送达（现在所有FSA都可送达）
export const isDeliverable = (fsa) => {
  return deliverableFSAs.includes(fsa);
};

// 获取统计信息
export const getDeliveryStats = () => {
  const byProvince = getFSAsByProvince();
  return {
    total: deliverableFSAs.length,
    byProvince: Object.keys(byProvince).reduce((acc, province) => {
      acc[province] = byProvince[province].length;
      return acc;
    }, {})
  };
};

// 获取FSA的详细信息（包含边界数据）
export const getFSADetails = (fsa) => {
  const feature = fsaBoundariesData.features.find(
    f => f.properties.CFSAUID === fsa
  );

  if (!feature) return null;

  return {
    fsa: feature.properties.CFSAUID,
    province: feature.properties.province || feature.properties.PRNAME,
    region: feature.properties.region,
    deliverable: feature.properties.deliverable,
    landArea: feature.properties.LANDAREA,
    geometry: feature.geometry
  };
};

// 获取所有FSA的GeoJSON数据（用于地图显示）
export const getFSAGeoJSON = () => {
  // 直接返回所有FSA边界数据（1643个）
  // 所有这些FSA都被认为是可配送的
  const allFeatures = fsaBoundariesData.features;

  console.log(`地图数据: ${allFeatures.length}个FSA边界数据`);

  return {
    type: 'FeatureCollection',
    features: allFeatures
  };
};

// 获取指定省份的FSA GeoJSON数据
export const getFSAGeoJSONByProvince = (provinceCode) => {
  const provinceCodeMap = {
    'BC': '59',
    'AB': '48',
    'SK': '47',
    'MB': '46',
    'ON': '35',
    'QC': '24',
    'NB': '13',
    'NS': '12',
    'PE': '11',
    'NL': '10',
    'YT': '60',
    'NT': '61',
    'NU': '62'
  };

  const pruid = provinceCodeMap[provinceCode];
  if (!pruid) return null;

  return {
    type: 'FeatureCollection',
    features: fsaBoundariesData.features.filter(
      feature => feature.properties.PRUID === pruid && feature.properties.deliverable
    )
  };
};