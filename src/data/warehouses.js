// 仓库配置数据
export const WAREHOUSES = {
  YYZ: {
    id: 'YYZ',
    name: 'YYZ仓库',
    fsa: 'L4W',
    fullName: 'Toronto Pearson International Airport Warehouse',
    shortName: 'YYZ',
    // 基于L4W FSA的坐标 (密西沙加地区)
    coordinates: {
      lat: 43.6776,
      lng: -79.6248
    },
    color: '#FF6B6B', // 红色标记
    icon: '🏭',
    timezone: 'America/Toronto',
    serviceAreas: ['ON', 'QC', 'MB'], // 主要服务省份
    description: '多伦多地区主仓库'
  },
  YVR: {
    id: 'YVR',
    name: 'YVR仓库',
    fsa: 'V6V',
    fullName: 'Vancouver International Airport Warehouse',
    shortName: 'YVR',
    // 基于V6V FSA的坐标 (列治文地区)
    coordinates: {
      lat: 49.1943,
      lng: -123.1815
    },
    color: '#4ECDC4', // 青色标记
    icon: '🏭',
    timezone: 'America/Vancouver',
    serviceAreas: ['BC', 'AB', 'SK'], // 主要服务省份
    description: '温哥华地区主仓库'
  }
};

// 根据FSA获取最近的仓库
export const getNearestWarehouse = (fsaCoordinates, warehouses = WAREHOUSES) => {
  let nearestWarehouse = null;
  let shortestDistance = Infinity;

  Object.values(warehouses).forEach(warehouse => {
    const distance = calculateDistance(
      fsaCoordinates.lat,
      fsaCoordinates.lng,
      warehouse.coordinates.lat,
      warehouse.coordinates.lng
    );

    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestWarehouse = warehouse;
    }
  });

  return {
    warehouse: nearestWarehouse,
    distance: shortestDistance
  };
};

// 计算两点之间的距离（Haversine公式）
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 地球半径（公里）
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 保留一位小数
};

// 角度转弧度
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

// 获取仓库服务区域信息
export const getWarehouseServiceInfo = (warehouseId) => {
  const warehouse = WAREHOUSES[warehouseId];
  if (!warehouse) return null;

  return {
    id: warehouse.id,
    name: warehouse.name,
    fsa: warehouse.fsa,
    serviceAreas: warehouse.serviceAreas,
    timezone: warehouse.timezone
  };
};

// 根据省份推荐仓库
export const getRecommendedWarehouseByProvince = (province) => {
  // 东部省份主要由YYZ服务
  const easternProvinces = ['ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'MB'];
  // 西部省份主要由YVR服务
  const westernProvinces = ['BC', 'AB', 'SK', 'YT', 'NT'];

  if (easternProvinces.includes(province)) {
    return WAREHOUSES.YYZ;
  } else if (westernProvinces.includes(province)) {
    return WAREHOUSES.YVR;
  }

  // 默认返回YYZ
  return WAREHOUSES.YYZ;
};

export default WAREHOUSES;