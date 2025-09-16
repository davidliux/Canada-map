/**
 * 卡车配送城市数据库服务
 * 
 * 完全基于数据库的城市数据管理，不使用 localStorage
 * - 所有数据直接从数据库读写
 * - 提供与原有接口兼容的方法
 * - 支持数据完整性验证
 */

import { validateTruckDeliveryCity } from '../../types/truckDelivery.js';
import { dataUpdateNotifier } from '../dataUpdateNotifier.js';
import { apiGet, apiPost, apiPut, apiDelete } from '../apiClient.js';

/**
 * 城市数据库服务类
 */
export class CityDatabaseService {
  constructor() {
    this.cache = new Map(); // 内存缓存，用于减少数据库访问
    this.cacheTimeout = 5000; // 缓存有效期 5 秒
  }

  /**
   * 清除缓存
   * @private
   */
  _clearCache(cityId = null) {
    if (cityId) {
      this.cache.delete(cityId);
      this.cache.delete('all_cities');
    } else {
      this.cache.clear();
    }
  }

  /**
   * 获取所有城市列表
   * @returns {Promise<Object[]>} 城市列表
   */
  async getAllCities() {
    try {
      // 检查缓存
      const cached = this.cache.get('all_cities');
      if (cached && cached.timestamp > Date.now() - this.cacheTimeout) {
        console.log('📦 使用缓存的城市列表');
        return cached.data;
      }

      console.log('📥 从数据库获取城市列表...');
      const response = await apiGet('/truck-delivery/cities');
      
      // 处理包装的响应格式
      const serverCities = response?.data || response;
      
      if (serverCities && Array.isArray(serverCities)) {
        // 更新缓存
        this.cache.set('all_cities', {
          data: serverCities,
          timestamp: Date.now()
        });

        console.log(`✅ 从数据库获取了 ${serverCities.length} 个城市`);
        
        // 返回城市列表（格式化）
        return serverCities.map(dbCity => {
          const formattedCity = this._formatCityData(dbCity);
          // 使用数据库中的统计字段 (total_regions 和 total_fsas)
          // 如果这些字段不存在，尝试从 regions 数组计算
          const regionCount = parseInt(dbCity.total_regions) ||
                            parseInt(dbCity.total_zones) ||
                            formattedCity.regions?.length || 0;
          const totalFSAs = parseInt(dbCity.total_fsas) ||
                           formattedCity.regions?.reduce((sum, r) => sum + (r.fsaCodes?.length || 0), 0) || 0;

          return {
            ...formattedCity,
            regionCount: regionCount,
            totalFSAs: totalFSAs
          };
        });
      }
      
      return [];
    } catch (error) {
      console.error('获取城市列表失败:', error);
      throw error; // 向上抛出错误，让调用者处理
    }
  }

  /**
   * 获取单个城市详细数据
   * @param {string} cityId - 城市ID
   * @returns {Promise<Object|null>} 城市详细数据
   */
  async getCity(cityId) {
    try {
      if (!cityId) {
        console.error('城市ID不能为空');
        return null;
      }

      // 检查缓存
      const cached = this.cache.get(cityId);
      if (cached && cached.timestamp > Date.now() - this.cacheTimeout) {
        console.log(`📦 使用缓存的城市数据: ${cached.data.name}`);
        return cached.data;
      }

      console.log(`📥 从数据库获取城市: ${cityId}`);
      const response = await apiGet(`/truck-delivery/cities/${cityId}`);
      
      // 处理包装的响应格式
      const cityData = response?.data || response;
      
      if (cityData) {
        // 转换数据格式
        const formattedCity = this._formatCityData(cityData);
        
        // 计算实际的区域和FSA统计
        if (formattedCity.regions && formattedCity.regions.length > 0) {
          const stats = this._calculateCityStats(formattedCity);
          formattedCity.regionCount = stats.regionCount;
          formattedCity.totalFSAs = stats.totalFSAs;
        }
        
        // 更新缓存
        this.cache.set(cityId, {
          data: formattedCity,
          timestamp: Date.now()
        });

        console.log(`✅ 获取城市成功: ${formattedCity.name} (${cityId})`);
        return formattedCity;
      }
      
      console.warn(`城市不存在: ${cityId}`);
      return null;
    } catch (error) {
      console.error('获取城市失败:', error);
      throw error;
    }
  }

  /**
   * 保存/更新城市数据
   * @param {Object} cityData - 城市数据
   * @returns {Promise<boolean>} 保存是否成功
   */
  async saveCity(cityData) {
    try {
      if (!cityData || !cityData.id) {
        console.error('城市数据或ID不能为空');
        return false;
      }

      // 先准备时间戳，确保数据完整
      const now = new Date().toISOString();

      // 预处理城市数据，添加必要的时间戳和元数据
      const preprocessedCityData = {
        ...cityData,
        metadata: {
          ...cityData.metadata,
          createdAt: cityData.metadata?.createdAt || cityData.created_at || cityData.createdAt || now,
          updatedAt: cityData.metadata?.updatedAt || cityData.updated_at || cityData.updatedAt || now,
          version: cityData.metadata?.version || cityData.version || 0
        }
      };

      // 验证预处理后的数据完整性
      const validation = validateTruckDeliveryCity(preprocessedCityData);
      if (!validation.isValid) {
        console.error('城市数据验证失败:', validation.errors);
        return false;
      }

      if (validation.warnings.length > 0) {
        console.warn('城市数据警告:', validation.warnings);
      }

      // 处理区域数据
      const processedRegions = (preprocessedCityData.regions || []).map(region => ({
        ...region,
        cityId: preprocessedCityData.id,
        metadata: {
          createdAt: region.metadata?.createdAt || now,
          updatedAt: now,
          version: (region.metadata?.version || 0) + 1
        },
        priceTable: region.priceTable || {
          regionId: region.id,
          prices: [],
          currency: 'CAD'
        }
      }));

      const updatedCityData = {
        ...preprocessedCityData,
        regions: processedRegions,
        metadata: {
          ...preprocessedCityData.metadata,
          createdAt: preprocessedCityData.metadata.createdAt,
          updatedAt: now,
          version: (preprocessedCityData.metadata.version || 0) + 1
        }
      };

      // 检查是否为新城市
      let isNewCity = false;
      try {
        await apiGet(`/truck-delivery/cities/${cityData.id}`);
      } catch (error) {
        if (error.message && error.message.includes('404')) {
          isNewCity = true;
        }
      }

      // 保存到数据库（转换格式）
      const dbData = this._formatCityForDatabase(updatedCityData);
      console.log('📤 正在保存城市到数据库...');
      if (isNewCity) {
        await apiPost('/truck-delivery/cities', dbData);
        console.log('✅ 新城市已保存到数据库');
      } else {
        await apiPut(`/truck-delivery/cities/${cityData.id}`, dbData);
        console.log('✅ 城市更新已保存到数据库');
      }

      // 清除相关缓存
      this._clearCache(cityData.id);

      // 触发数据更新通知
      dataUpdateNotifier.notify({
        type: 'city_updated',
        cityId: cityData.id,
        cityName: cityData.name,
        isNew: isNewCity,
        timestamp: now
      });

      console.log(`✅ 城市保存成功: ${cityData.name} (${cityData.id})`);
      return true;
    } catch (error) {
      console.error('保存城市失败:', error);
      return false;
    }
  }

  /**
   * 删除城市
   * @param {string} cityId - 城市ID
   * @returns {Promise<boolean>} 删除是否成功
   */
  async deleteCity(cityId) {
    try {
      if (!cityId) {
        console.error('城市ID不能为空');
        return false;
      }

      // 获取城市信息用于通知
      const cityData = await this.getCity(cityId);
      const cityName = cityData?.name || 'Unknown';

      // 从数据库删除
      console.log(`🗑️ 正在从数据库删除城市: ${cityId}`);
      await apiDelete(`/truck-delivery/cities/${cityId}`);
      
      // 清除缓存
      this._clearCache(cityId);

      // 触发数据更新通知
      dataUpdateNotifier.notify({
        type: 'city_deleted',
        cityId: cityId,
        cityName: cityName,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ 城市删除成功: ${cityName} (${cityId})`);
      return true;
    } catch (error) {
      console.error('删除城市失败:', error);
      return false;
    }
  }

  /**
   * 验证FSA冲突
   * @param {Object} cityData - 城市数据
   * @returns {Promise<Object>} 冲突检测结果
   */
  async validateFSAConflicts(cityData) {
    try {
      if (!cityData || !cityData.regions) {
        return { hasConflicts: false, conflicts: [] };
      }

      // 收集所有FSA
      const fsaMap = new Map();
      const conflicts = [];

      // 获取所有其他城市的FSA
      const allCities = await this.getAllCities();
      for (const city of allCities) {
        if (city.id === cityData.id) continue;
        
        const fullCity = await this.getCity(city.id);
        if (fullCity && fullCity.regions) {
          for (const region of fullCity.regions) {
            if (region.fsaCodes) {
              for (const fsa of region.fsaCodes) {
                if (!fsaMap.has(fsa)) {
                  fsaMap.set(fsa, {
                    cityId: city.id,
                    cityName: city.name,
                    regionId: region.id,
                    regionName: region.name
                  });
                }
              }
            }
          }
        }
      }

      // 检查当前城市的FSA是否冲突
      for (const region of cityData.regions) {
        if (region.fsaCodes) {
          for (const fsa of region.fsaCodes) {
            const existing = fsaMap.get(fsa);
            if (existing) {
              conflicts.push({
                fsa,
                currentRegion: region.name,
                conflictCity: existing.cityName,
                conflictRegion: existing.regionName
              });
            }
          }
        }
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts
      };
    } catch (error) {
      console.error('FSA冲突检测失败:', error);
      return { hasConflicts: false, conflicts: [], error: error.message };
    }
  }

  /**
   * 生成区域颜色
   * @private
   */
  _generateRegionColor(level, baseColor, totalLevels) {
    // Region 1 直接使用城市主题色
    if (level === 1) {
      return baseColor;
    }
    
    // 将基础颜色转换为HSL以便调整
    const hexToHSL = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const l = (max + min) / 2;
      
      if (max === min) {
        return { h: 0, s: 0, l };
      }
      
      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      let h;
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
      
      return { h: h * 360, s: s * 100, l: l * 100 };
    };
    
    const hslToHex = (h, s, l) => {
      h = h / 360;
      s = s / 100;
      l = l / 100;
      
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      let r, g, b;
      
      if (s === 0) {
        r = g = b = l;
      } else {
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
    
    const hsl = hexToHSL(baseColor);
    
    // 调整亮度：level越高越亮
    const lightnessStep = 15; // 每级增加15%亮度
    const targetLightness = Math.min(hsl.l + (level - 1) * lightnessStep, 85);
    
    // 同时略微调整饱和度，使颜色更自然
    const saturationFactor = Math.max(hsl.s * (1 - (level - 1) * 0.15), 20);
    
    return hslToHex(hsl.h, saturationFactor, targetLightness);
  }

  /**
   * 格式化城市数据（数据库字段 -> 前端字段）
   * @private
   */
  _formatCityData(dbCity) {
    if (!dbCity) return null;
    
    // 处理区域数据 - 数据库使用 zones 字段
    const rawRegions = dbCity.zones || dbCity.regions || [];
    
    // 格式化区域数据，确保每个区域都有颜色
    const regions = rawRegions.map(zone => {
      // 获取或生成颜色
      let displayColor = zone.color || zone.displayColor || zone.display_color;
      
      // 如果没有颜色，根据等级生成
      if (!displayColor && zone.level) {
        // 直接导入颜色生成函数
        displayColor = this._generateRegionColor(
          zone.level,
          dbCity.theme_color || dbCity.themeColor || '#2196F3',
          Math.max(rawRegions.length, 4)
        );
      }
      
      return {
        id: zone.id,
        cityId: zone.city_id || zone.cityId || dbCity.id,
        name: zone.name,
        level: zone.level,
        fsaCodes: zone.fsa_codes || zone.fsaCodes || [],
        displayColor: displayColor,
        priceTable: zone.priceTable || zone.price_table || {
          regionId: zone.id,
          prices: [],
          currency: 'CAD'
        },
        metadata: zone.metadata || {
          createdAt: zone.created_at || zone.createdAt || new Date().toISOString(),
          updatedAt: zone.updated_at || zone.updatedAt || new Date().toISOString(),
          version: zone.version || 1
        }
      };
    });
    
    // 调试日志
    const actualRegionCount = regions.length;
    const actualFSACount = regions.reduce((sum, r) => sum + (r.fsaCodes?.length || 0), 0);
    
    // 如果没有zones数据但有统计字段，使用统计字段
    const displayRegionCount = actualRegionCount > 0 ? actualRegionCount : (parseInt(dbCity.total_zones) || 0);
    const displayFSACount = actualFSACount > 0 ? actualFSACount : (parseInt(dbCity.total_fsas) || 0);
    
    console.log(`格式化城市 ${dbCity.name}: ${displayRegionCount} 个区域, FSA总数: ${displayFSACount}`);

    return {
      id: dbCity.id,
      name: dbCity.name,
      province: dbCity.province,
      themeColor: dbCity.theme_color || dbCity.themeColor || '#2196F3',
      isActive: dbCity.is_active !== undefined ? dbCity.is_active : dbCity.isActive,
      regions: regions,
      metadata: dbCity.metadata || {
        createdAt: dbCity.created_at || dbCity.createdAt,
        updatedAt: dbCity.updated_at || dbCity.updatedAt,
        version: 1
      },
      centerLat: parseFloat(dbCity.center_lat) || 0,
      centerLng: parseFloat(dbCity.center_lng) || 0,
      totalRegions: parseInt(dbCity.total_zones) || dbCity.total_regions || 0,
      totalFSAs: parseInt(dbCity.total_fsas) || dbCity.total_fsas || 0,
      totalPopulation: dbCity.total_population || 0
    };
  }

  /**
   * 格式化城市数据（前端字段 -> 数据库字段）
   * @private
   */
  _formatCityForDatabase(cityData) {
    if (!cityData) return null;
    
    // 格式化区域数据为数据库格式
    const zones = (cityData.regions || []).map(region => ({
      id: region.id,
      city_id: region.cityId || cityData.id,
      name: region.name,
      level: region.level,
      fsa_codes: region.fsaCodes || [],
      color: region.displayColor || region.color
      // 不发送 priceTable 到数据库（单独管理）
      // 不发送 metadata 到数据库（由数据库管理）
    }));
    
    const totalFSAs = zones.reduce((sum, z) => sum + (z.fsa_codes?.length || 0), 0);
    console.log(`保存城市 ${cityData.name} 到数据库: ${zones.length} 个区域, FSA总数: ${totalFSAs}`);
    
    return {
      id: cityData.id,
      name: cityData.name,
      province: cityData.province,
      theme_color: cityData.themeColor,
      is_active: cityData.isActive,
      zones: zones,
      metadata: cityData.metadata,
      center_lat: cityData.centerLat?.toString() || '0',
      center_lng: cityData.centerLng?.toString() || '0',
      total_zones: zones.length,
      total_fsas: totalFSAs
    };
  }

  /**
   * 计算城市统计信息
   * @private
   */
  _calculateCityStats(cityData) {
    if (!cityData) {
      return { regionCount: 0, totalFSAs: 0 };
    }

    const regions = cityData.regions || cityData.zones || [];
    const regionCount = regions.length;
    const totalFSAs = regions.reduce((sum, region) => {
      const fsaCount = region.fsaCodes?.length || region.fsa_codes?.length || 0;
      return sum + fsaCount;
    }, 0);
    
    console.log(`统计 ${cityData.name}: ${regionCount} 个区域, ${totalFSAs} 个FSA`);

    return { regionCount, totalFSAs };
  }

  /**
   * 批量创建城市
   * @param {Object[]} citiesData - 城市数据数组
   * @returns {Promise<Object>} 创建结果
   */
  async createBulkCities(citiesData) {
    try {
      console.log(`📤 正在批量创建 ${citiesData.length} 个城市...`);
      const results = {
        success: [],
        failed: []
      };

      for (const cityData of citiesData) {
        try {
          const saved = await this.saveCity(cityData);
          if (saved) {
            results.success.push(cityData.name);
          } else {
            results.failed.push({ name: cityData.name, reason: '保存失败' });
          }
        } catch (error) {
          results.failed.push({ name: cityData.name, reason: error.message });
        }
      }

      console.log(`✅ 批量创建完成: 成功 ${results.success.length}, 失败 ${results.failed.length}`);
      return results;
    } catch (error) {
      console.error('批量创建城市失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const cityDatabaseService = new CityDatabaseService();

// 导出服务
export { cityDatabaseService };
export default cityDatabaseService;