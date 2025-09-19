/**
 * 卡车配送API服务
 * 与后端PostgreSQL数据库交互
 */

// 开发环境使用相对路径以利用Vite代理，生产环境使用完整URL
const isDev = import.meta.env.DEV;
const API_BASE = isDev 
  ? '/api/v1'  // 开发环境使用相对路径，会被Vite代理到localhost:5050
  : (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1');
// 确保API_BASE包含/v1
const API_BASE_WITH_VERSION = API_BASE.endsWith('/v1') ? API_BASE : `${API_BASE}/v1`;
const TRUCK_API = `${API_BASE_WITH_VERSION}/truck-delivery`;

/**
 * 通用请求处理函数
 */
async function apiRequest(url, options = {}) {
  try {
    // 尝试从 localStorage 获取认证令牌（可选）
    const token = localStorage.getItem('accessToken');

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 如果有令牌，添加到请求头
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('API错误响应:', JSON.stringify({
        url,
        status: response.status,
        error: data.error,
        data: data
      }, null, 2));
      throw new Error(data.error?.message || data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
}

/**
 * 城市管理API
 */
export const cityApi = {
  // 获取所有城市
  async getAll(includeStats = true) {
    const url = `${TRUCK_API}/cities?includeStats=${includeStats}`;
    const result = await apiRequest(url);
    return result.data || [];
  },

  // 获取单个城市详情
  async getById(id) {
    const url = `${TRUCK_API}/cities/${id}`;
    const result = await apiRequest(url);
    return result.data;
  },

  // 创建城市
  async create(cityData) {
    const url = `${TRUCK_API}/cities`;
    const result = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(cityData),
    });
    return result.data;
  },

  // 更新城市
  async update(id, updates) {
    const url = `${TRUCK_API}/cities/${id}`;
    const result = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return result.data;
  },

  // 删除城市
  async delete(id) {
    const url = `${TRUCK_API}/cities/${id}`;
    await apiRequest(url, {
      method: 'DELETE',
    });
  },
};

/**
 * 区域管理API
 */
export const zoneApi = {
  // 获取城市的所有区域
  async getByCityId(cityId, includeInactive = false) {
    const url = `${TRUCK_API}/cities/${cityId}/zones?includeInactive=${includeInactive}`;
    const result = await apiRequest(url);
    return result.data || [];
  },

  // 获取单个区域详情
  async getById(id) {
    const url = `${TRUCK_API}/zones/${id}`;
    const result = await apiRequest(url);
    return result.data;
  },

  // 创建区域
  async create(zoneData) {
    const url = `${TRUCK_API}/zones`;
    const result = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(zoneData),
    });
    return result.data;
  },

  // 更新区域
  async update(id, updates) {
    const url = `${TRUCK_API}/zones/${id}`;
    const result = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return result.data;
  },

  // 删除区域
  async delete(id) {
    const url = `${TRUCK_API}/zones/${id}`;
    await apiRequest(url, {
      method: 'DELETE',
    });
  },

  // 批量导入区域
  async importBatch(cityId, zones) {
    const promises = zones.map(zone => 
      this.create({ ...zone, city_id: cityId })
    );
    return Promise.allSettled(promises);
  },
};

/**
 * 价格管理API
 */
export const priceApi = {
  // 获取区域价格表
  async getByZoneId(zoneId) {
    const url = `${TRUCK_API}/zones/${zoneId}/prices`;
    const result = await apiRequest(url);
    return result.data || [];
  },

  // 批量更新价格
  async updateBatch(zoneId, prices) {
    const url = `${TRUCK_API}/zones/${zoneId}/prices`;
    const result = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify({ prices }),
    });
    return result.data;
  },
};

/**
 * 搜索API
 */
export const searchApi = {
  // 搜索FSA/城市/区域
  async search(query) {
    if (!query || query.length < 2) {
      return [];
    }
    
    const url = `${TRUCK_API}/search/fsa?q=${encodeURIComponent(query)}`;
    const result = await apiRequest(url);
    return result.data || [];
  },
};

/**
 * 统计API
 */
export const statsApi = {
  // 获取总体统计
  async getOverview() {
    const url = `${TRUCK_API}/stats`;
    const result = await apiRequest(url);
    return result.data || {
      total_cities: 0,
      total_zones: 0,
      total_drivers: 0,
      total_capacity: 0,
      active_orders: 0,
      today_orders: 0,
    };
  },
};

/**
 * 数据转换工具
 */
export const dataTransform = {
  // 将后端数据转换为前端格式
  transformCity(backendCity) {
    return {
      id: backendCity.id,
      name: backendCity.name,
      province: backendCity.province,
      center: backendCity.center_lat && backendCity.center_lng
        ? [parseFloat(backendCity.center_lat), parseFloat(backendCity.center_lng)]
        : null,
      themeColor: backendCity.theme_color,
      regions: parseInt(backendCity.total_zones) || 0,
      totalFSAs: backendCity.total_fsas || 0,
      totalDrivers: parseInt(backendCity.total_drivers) || 0,
      totalCapacity: parseInt(backendCity.total_capacity) || 0,
      isActive: backendCity.is_active,
      metadata: backendCity.metadata,
    };
  },

  // 将前端数据转换为后端格式
  prepareCityForBackend(frontendCity) {
    return {
      name: frontendCity.name,
      province: frontendCity.province,
      center_lat: frontendCity.center?.[0],
      center_lng: frontendCity.center?.[1],
      theme_color: frontendCity.themeColor,
      metadata: frontendCity.metadata || {},
    };
  },

  // 转换区域数据
  transformZone(backendZone) {
    return {
      id: backendZone.id,
      cityId: backendZone.city_id,
      name: backendZone.name,
      level: backendZone.level,
      fsaCodes: backendZone.fsa_codes || [],
      boundaries: backendZone.boundaries,
      coverage: {
        area: parseFloat(backendZone.coverage_area) || 0,
        population: backendZone.coverage_population || 0,
      },
      metrics: {
        avgDeliveryTime: parseFloat(backendZone.avg_delivery_time) || 0,
        dailyCapacity: backendZone.daily_capacity || 0,
        activeDrivers: backendZone.active_drivers || 0,
      },
      color: backendZone.color,
      active: backendZone.is_active,
      prices: backendZone.prices || [],
    };
  },

  // 准备区域数据用于后端
  prepareZoneForBackend(frontendZone) {
    return {
      city_id: frontendZone.cityId,
      name: frontendZone.name,
      level: frontendZone.level,
      fsa_codes: frontendZone.fsaCodes || [],
      boundaries: frontendZone.boundaries,
      coverage_area: frontendZone.coverage?.area,
      coverage_population: frontendZone.coverage?.population,
      avg_delivery_time: frontendZone.metrics?.avgDeliveryTime,
      daily_capacity: frontendZone.metrics?.dailyCapacity,
      active_drivers: frontendZone.metrics?.activeDrivers,
      color: frontendZone.color,
      is_active: frontendZone.active !== false,
    };
  },
};

/**
 * 缓存管理
 */
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

export const cacheManager = {
  get(key) {
    const item = cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    
    return item.data;
  },

  set(key, data) {
    cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  },

  clear() {
    cache.clear();
  },

  delete(key) {
    cache.delete(key);
  },
};

/**
 * 板数定价配置API
 */
export const pricingConfigApi = {
  // 获取定价配置
  async getConfigurations(cityId) {
    const url = `${TRUCK_API}/pricing-configs?cityId=${cityId}`;
    return apiRequest(url);
  },

  // 保存定价配置
  async saveConfiguration(config) {
    const method = config.id ? 'PUT' : 'POST';
    const url = config.id
      ? `${TRUCK_API}/pricing-configs/${config.id}`
      : `${TRUCK_API}/pricing-configs`;

    return apiRequest(url, {
      method,
      body: JSON.stringify(config)
    });
  },

  // 删除定价配置
  async deleteConfiguration(configId) {
    const url = `${TRUCK_API}/pricing-configs/${configId}`;
    return apiRequest(url, { method: 'DELETE' });
  },

  // 批量更新配置
  async batchUpdate(configs) {
    const url = `${TRUCK_API}/pricing-configs/batch`;
    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(configs)
    });
  }
};

/**
 * 分组管理API
 */
export const groupApi = {
  // 获取区域的所有分组
  async getByZoneId(zoneId) {
    const url = `${TRUCK_API}/zones/${zoneId}/groups`;
    const result = await apiRequest(url);

    // 转换分组数据格式（snake_case to camelCase）
    const transformedGroups = (result.data || []).map(group => ({
      ...group,
      fsaCodes: group.fsa_codes || [],  // 转换 fsa_codes 为 fsaCodes
      customPricing: group.custom_pricing || group.customPricing,  // 兼容处理
      displayColor: group.display_color || group.displayColor  // 兼容处理
    }));

    // 确保返回正确的数据格式
    return {
      success: true,
      data: transformedGroups
    };
  },

  // 创建分组
  async create(group) {
    const url = `${TRUCK_API}/groups`;
    // 转换为后端需要的格式（camelCase to snake_case）
    const backendGroup = {
      ...group,
      fsa_codes: group.fsaCodes || group.fsa_codes || [],
      custom_pricing: group.customPricing || group.custom_pricing,
      display_color: group.displayColor || group.display_color
    };
    // 删除前端格式的字段，避免冗余
    delete backendGroup.fsaCodes;
    delete backendGroup.customPricing;
    delete backendGroup.displayColor;

    return apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(backendGroup)
    });
  },

  // 更新分组
  async update(groupId, updates) {
    const url = `${TRUCK_API}/groups/${groupId}`;
    // 转换为后端需要的格式（camelCase to snake_case）
    const backendUpdates = { ...updates };
    if (updates.fsaCodes !== undefined) {
      backendUpdates.fsa_codes = updates.fsaCodes;
      delete backendUpdates.fsaCodes;
    }
    if (updates.customPricing !== undefined) {
      backendUpdates.custom_pricing = updates.customPricing;
      delete backendUpdates.customPricing;
    }
    if (updates.displayColor !== undefined) {
      backendUpdates.display_color = updates.displayColor;
      delete backendUpdates.displayColor;
    }

    return apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(backendUpdates)
    });
  },

  // 删除分组
  async delete(groupId) {
    const url = `${TRUCK_API}/groups/${groupId}`;
    return apiRequest(url, { method: 'DELETE' });
  }
};

// 为了向后兼容，导出简化的API方法
export const getCities = async () => {
  const data = await cityApi.getAll();
  return { success: true, data };
};

export const getZonesByCity = async (cityId) => {
  const data = await zoneApi.getByCityId(cityId);
  return { success: true, data };
};

export const getFSAGroupsByZone = async (zoneId) => {
  return groupApi.getByZoneId(zoneId);
};

export const getSkidPricingConfigurations = (cityId) => pricingConfigApi.getConfigurations(cityId);
export const saveSkidPricingConfiguration = (config) => pricingConfigApi.saveConfiguration(config);

// 导出完整的API对象
const truckDeliveryApi = {
  cities: cityApi,
  zones: zoneApi,
  prices: priceApi,
  groups: groupApi,
  pricingConfigs: pricingConfigApi,
  search: searchApi,
  stats: statsApi,
  transform: dataTransform,
  cache: cacheManager,
};

export default truckDeliveryApi;