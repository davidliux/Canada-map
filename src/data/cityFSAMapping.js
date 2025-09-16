// 城市FSA映射数据
// 定义主要城市及其对应的FSA区域

export const cityFSAMapping = {
  // Alberta
  Calgary: {
    province: 'AB',
    center: [51.0447, -114.0719],
    zoom: 11,
    fsaCodes: [
      'T1X', 'T1Y', 'T2A', 'T2B', 'T2C', 'T2E', 'T2G', 'T2H', 'T2J', 'T2K',
      'T2L', 'T2M', 'T2N', 'T2P', 'T2R', 'T2S', 'T2T', 'T2V', 'T2W', 'T2X',
      'T2Y', 'T2Z', 'T3A', 'T3B', 'T3C', 'T3E', 'T3G', 'T3H', 'T3J', 'T3K',
      'T3L', 'T3M', 'T3N', 'T3P', 'T3R', 'T3S', 'T3Z'
    ]
  },
  Edmonton: {
    province: 'AB',
    center: [53.5461, -113.4938],
    zoom: 11,
    fsaCodes: [
      'T5A', 'T5B', 'T5C', 'T5E', 'T5G', 'T5H', 'T5J', 'T5K', 'T5L', 'T5M',
      'T5N', 'T5P', 'T5R', 'T5S', 'T5T', 'T5V', 'T5W', 'T5X', 'T5Y', 'T5Z',
      'T6A', 'T6B', 'T6C', 'T6E', 'T6G', 'T6H', 'T6J', 'T6K', 'T6L', 'T6M',
      'T6N', 'T6P', 'T6R', 'T6S', 'T6T', 'T6V', 'T6W', 'T6X'
    ]
  },

  // British Columbia
  Vancouver: {
    province: 'BC',
    center: [49.2827, -123.1207],
    zoom: 11,
    fsaCodes: [
      'V5A', 'V5B', 'V5C', 'V5E', 'V5G', 'V5H', 'V5J', 'V5K', 'V5L', 'V5M',
      'V5N', 'V5P', 'V5R', 'V5S', 'V5T', 'V5V', 'V5W', 'V5X', 'V5Y', 'V5Z',
      'V6A', 'V6B', 'V6C', 'V6E', 'V6G', 'V6H', 'V6J', 'V6K', 'V6L', 'V6M',
      'V6N', 'V6P', 'V6R', 'V6S', 'V6T', 'V6V', 'V6W', 'V6X', 'V6Y', 'V6Z',
      'V7A', 'V7B', 'V7C', 'V7E', 'V7G', 'V7H', 'V7J', 'V7K', 'V7L', 'V7M',
      'V7N', 'V7P', 'V7R', 'V7S', 'V7T', 'V7V', 'V7X', 'V7Y'
    ]
  },
  Victoria: {
    province: 'BC',
    center: [48.4284, -123.3656],
    zoom: 12,
    fsaCodes: ['V8N', 'V8P', 'V8R', 'V8S', 'V8T', 'V8V', 'V8W', 'V8X', 'V8Y', 'V8Z', 'V9A', 'V9B', 'V9C']
  },

  // Ontario
  Toronto: {
    province: 'ON',
    center: [43.6532, -79.3832],
    zoom: 11,
    fsaCodes: [
      'M1B', 'M1C', 'M1E', 'M1G', 'M1H', 'M1J', 'M1K', 'M1L', 'M1M', 'M1N',
      'M1P', 'M1R', 'M1S', 'M1T', 'M1V', 'M1W', 'M1X', 'M2H', 'M2J', 'M2K',
      'M2L', 'M2M', 'M2N', 'M2P', 'M2R', 'M3A', 'M3B', 'M3C', 'M3H', 'M3J',
      'M3K', 'M3L', 'M3M', 'M3N', 'M4A', 'M4B', 'M4C', 'M4E', 'M4G', 'M4H',
      'M4J', 'M4K', 'M4L', 'M4M', 'M4N', 'M4P', 'M4R', 'M4S', 'M4T', 'M4V',
      'M4W', 'M4X', 'M4Y', 'M5A', 'M5B', 'M5C', 'M5E', 'M5G', 'M5H', 'M5J',
      'M5K', 'M5L', 'M5M', 'M5N', 'M5P', 'M5R', 'M5S', 'M5T', 'M5V', 'M5W',
      'M5X', 'M6A', 'M6B', 'M6C', 'M6E', 'M6G', 'M6H', 'M6J', 'M6K', 'M6L',
      'M6M', 'M6N', 'M6P', 'M6R', 'M6S', 'M7A', 'M7R', 'M7Y', 'M8V', 'M8W',
      'M8X', 'M8Y', 'M8Z', 'M9A', 'M9B', 'M9C', 'M9L', 'M9M', 'M9N', 'M9P',
      'M9R', 'M9V', 'M9W'
    ]
  },
  Ottawa: {
    province: 'ON',
    center: [45.4215, -75.6972],
    zoom: 11,
    fsaCodes: [
      'K1A', 'K1B', 'K1C', 'K1E', 'K1G', 'K1H', 'K1J', 'K1K', 'K1L', 'K1M',
      'K1N', 'K1P', 'K1R', 'K1S', 'K1T', 'K1V', 'K1W', 'K1X', 'K1Y', 'K1Z',
      'K2A', 'K2B', 'K2C', 'K2E', 'K2G', 'K2H', 'K2J', 'K2K', 'K2L', 'K2M',
      'K2P', 'K2R', 'K2S', 'K2T', 'K2V', 'K2W', 'K4A', 'K4B', 'K4C', 'K4K',
      'K4M', 'K4P', 'K4R'
    ]
  },
  Mississauga: {
    province: 'ON',
    center: [43.5890, -79.6441],
    zoom: 12,
    fsaCodes: [
      'L4T', 'L4V', 'L4W', 'L4X', 'L4Y', 'L4Z', 'L5A', 'L5B', 'L5C', 'L5E',
      'L5G', 'L5H', 'L5J', 'L5K', 'L5L', 'L5M', 'L5N', 'L5P', 'L5R', 'L5S',
      'L5T', 'L5V', 'L5W'
    ]
  },

  // Quebec
  Montreal: {
    province: 'QC',
    center: [45.5017, -73.5673],
    zoom: 11,
    fsaCodes: [
      'H1A', 'H1B', 'H1C', 'H1E', 'H1G', 'H1H', 'H1J', 'H1K', 'H1L', 'H1M',
      'H1N', 'H1P', 'H1R', 'H1S', 'H1T', 'H1V', 'H1W', 'H1X', 'H1Y', 'H1Z',
      'H2A', 'H2B', 'H2C', 'H2E', 'H2G', 'H2H', 'H2J', 'H2K', 'H2L', 'H2M',
      'H2N', 'H2P', 'H2R', 'H2S', 'H2T', 'H2V', 'H2W', 'H2X', 'H2Y', 'H2Z',
      'H3A', 'H3B', 'H3C', 'H3E', 'H3G', 'H3H', 'H3J', 'H3K', 'H3L', 'H3M',
      'H3N', 'H3P', 'H3R', 'H3S', 'H3T', 'H3V', 'H3W', 'H3X', 'H3Y', 'H3Z',
      'H4A', 'H4B', 'H4C', 'H4E', 'H4G', 'H4H', 'H4J', 'H4K', 'H4L', 'H4M',
      'H4N', 'H4P', 'H4R', 'H4S', 'H4T', 'H4V', 'H4W', 'H4X', 'H4Y', 'H4Z',
      'H5A', 'H5B', 'H7A', 'H7B', 'H7C', 'H7E', 'H7G', 'H7H', 'H7J', 'H7K',
      'H7L', 'H7M', 'H7N', 'H7P', 'H7R', 'H7S', 'H7T', 'H7V', 'H7W', 'H7X',
      'H7Y', 'H8N', 'H8P', 'H8R', 'H8S', 'H8T', 'H8Y', 'H8Z', 'H9A', 'H9B',
      'H9C', 'H9E', 'H9G', 'H9H', 'H9J', 'H9K', 'H9P', 'H9R', 'H9S', 'H9W', 'H9X'
    ]
  },
  QuebecCity: {
    province: 'QC',
    center: [46.8139, -71.2080],
    zoom: 11,
    fsaCodes: [
      'G1A', 'G1B', 'G1C', 'G1E', 'G1G', 'G1H', 'G1J', 'G1K', 'G1L', 'G1M',
      'G1N', 'G1P', 'G1R', 'G1S', 'G1T', 'G1V', 'G1W', 'G1X', 'G1Y', 'G2A',
      'G2B', 'G2C', 'G2E', 'G2G', 'G2J', 'G2K', 'G2L', 'G2M', 'G2N', 'G3A',
      'G3E', 'G3G', 'G3H', 'G3J', 'G3K'
    ]
  },

  // Manitoba
  Winnipeg: {
    province: 'MB',
    center: [49.8951, -97.1384],
    zoom: 11,
    fsaCodes: [
      'R2C', 'R2E', 'R2G', 'R2H', 'R2J', 'R2K', 'R2L', 'R2M', 'R2N', 'R2P',
      'R2R', 'R2V', 'R2W', 'R2X', 'R2Y', 'R3A', 'R3B', 'R3C', 'R3E', 'R3G',
      'R3H', 'R3J', 'R3K', 'R3L', 'R3M', 'R3N', 'R3P', 'R3R', 'R3S', 'R3T',
      'R3V', 'R3W', 'R3X', 'R3Y'
    ]
  },

  // Saskatchewan
  Regina: {
    province: 'SK',
    center: [50.4452, -104.6189],
    zoom: 11,
    fsaCodes: ['S4L', 'S4M', 'S4N', 'S4P', 'S4R', 'S4S', 'S4T', 'S4V', 'S4W', 'S4X', 'S4Y', 'S4Z']
  },
  Saskatoon: {
    province: 'SK',
    center: [52.1579, -106.6702],
    zoom: 11,
    fsaCodes: ['S7H', 'S7J', 'S7K', 'S7L', 'S7M', 'S7N', 'S7P', 'S7R', 'S7S', 'S7T', 'S7V', 'S7W']
  },

  // Nova Scotia
  Halifax: {
    province: 'NS',
    center: [44.6488, -63.5752],
    zoom: 11,
    fsaCodes: ['B3A', 'B3B', 'B3E', 'B3G', 'B3H', 'B3J', 'B3K', 'B3L', 'B3M', 'B3N', 'B3P', 'B3R', 'B3S', 'B3T', 'B3V', 'B3Z', 'B4A', 'B4B', 'B4C', 'B4E', 'B4G']
  }
};

// 获取所有城市列表
export const getAllCities = () => {
  return Object.keys(cityFSAMapping).sort();
};

// 根据城市名获取FSA列表
export const getCityFSAs = (cityName) => {
  return cityFSAMapping[cityName]?.fsaCodes || [];
};

// 根据城市名获取地图中心和缩放级别
export const getCityMapView = (cityName) => {
  const city = cityFSAMapping[cityName];
  if (!city) return null;

  return {
    center: city.center,
    zoom: city.zoom
  };
};

// 根据FSA查找所属城市
export const findCityByFSA = (fsa) => {
  for (const [cityName, cityData] of Object.entries(cityFSAMapping)) {
    if (cityData.fsaCodes.includes(fsa)) {
      return cityName;
    }
  }
  return null;
};

// 获取省份的主要城市
export const getCitiesByProvince = (province) => {
  const cities = [];
  for (const [cityName, cityData] of Object.entries(cityFSAMapping)) {
    if (cityData.province === province) {
      cities.push(cityName);
    }
  }
  return cities.sort();
};