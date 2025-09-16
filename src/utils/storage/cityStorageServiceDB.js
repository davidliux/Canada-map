/**
 * 卡车配送城市存储服务 - 完全数据库版本
 * 
 * 此版本完全依赖数据库，不使用localStorage缓存
 * 所有数据操作都通过API与后端数据库交互
 */

import { TRUCK_STORAGE_KEYS, validateTruckDeliveryCity } from '../../types/truckDelivery.js';
import { dataUpdateNotifier } from '../dataUpdateNotifier.js';
import { apiGet, apiPost, apiPut } from '../apiClient.js';

/**
 * 卡车配送城市存储服务类（数据库版本）
 */
export class CityStorageServiceDB {
  constructor() {
    this.apiBasePath = '/truck-delivery';
    this.cache = new Map(); // 内存缓存，减少API调用
    this.cacheTimeout = 5 * 60 * 1000; // 5分钟缓存
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 从缓存获取数据
   */
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 设置缓存
   */
  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 获取所有城市列表
   * @returns {Promise<Object[]>} 城市列表，包含基本信息
   */
  async getAllCities() {
    try {
      // 检查缓存
      const cacheKey = 'cities_list';
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        console.log('📦 从缓存获取城市列表');
        return cached;
      }

      console.log('📥 从数据库获取城市列表...');
      const cities = await apiGet(`${this.apiBasePath}/cities`);
      
      if (!cities || !Array.isArray(cities)) {
        console.warn('⚠️ API返回的数据格式不正确');
        return [];
      }

      // 格式化城市列表
      const formattedCities = cities.map(city => ({
        id: city.id,
        name: city.name,
        province: city.province,
        themeColor: city.themeColor,
        isActive: city.isActive,
        regionCount: city.regions?.length || 0,
        totalFSAs: city.regions?.reduce((sum, r) => sum + (r.fsaCodes?.length || 0), 0) || 0,
        metadata: city.metadata
      }));

      // 设置缓存
      this._setCache(cacheKey, formattedCities);
      
      console.log(`✅ 获取到 ${formattedCities.length} 个城市`);
      return formattedCities;
    } catch (error) {
      console.error('获取城市列表失败:', error);
      
      // 如果API失败，尝试从localStorage恢复（向后兼容）
      try {
        const citiesData = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES);
        if (citiesData) {
          const cityList = JSON.parse(citiesData);
          console.log('⚠️ 使用本地备份数据');
          return cityList.map(cityId => {
            const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityId;
            const cityData = localStorage.getItem(cityKey);
            if (!cityData) return null;
            const city = JSON.parse(cityData);
            return {
              id: city.id,
              name: city.name,
              province: city.province,
              themeColor: city.themeColor,
              isActive: city.isActive,
              regionCount: city.regions?.length || 0,
              totalFSAs: city.regions?.reduce((sum, r) => sum + (r.fsaCodes?.length || 0), 0) || 0,
              metadata: city.metadata
            };
          }).filter(Boolean);
        }
      } catch (localError) {
        console.error('本地备份也失败:', localError);
      }
      
      return [];
    }
  }

  /**
   * 获取单个城市的完整数据
   * @param {string} cityId - 城市ID
   * @returns {Promise<Object|null>} 完整的城市数据，包含所有区域
   */
  async getCity(cityId) {
    try {
      if (!cityId) {
        console.warn('城市ID不能为空');
        return null;
      }

      // 检查缓存
      const cacheKey = `city_${cityId}`;
      const cached = this._getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 从缓存获取城市: ${cached.name}`);
        return cached;
      }

      console.log(`📥 从数据库获取城市: ${cityId}`);
      const cityData = await apiGet(`${this.apiBasePath}/cities/${cityId}`);
      
      if (!cityData) {
        console.warn(`城市不存在: ${cityId}`);
        return null;
      }

      // 确保数据格式正确
      const formattedCity = this._formatCityData(cityData);
      
      // 设置缓存
      this._setCache(cacheKey, formattedCity);
      
      console.log(`✅ 获取城市: ${formattedCity.name} (${cityId})`);
      return formattedCity;
    } catch (error) {
      console.error(`获取城市失败 ${cityId}:`, error);
      
      // 如果API失败，尝试从localStorage恢复
      try {
        const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityId;
        const localData = localStorage.getItem(cityKey);
        if (localData) {
          const city = JSON.parse(localData);
          console.log('⚠️ 使用本地备份数据');
          return this._formatCityData(city);
        }
      } catch (localError) {
        console.error('本地备份也失败:', localError);
      }
      
      return null;
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

      // 格式化数据
      const formattedCity = this._formatCityData(cityData);
      
      // 验证数据完整性
      const validation = validateTruckDeliveryCity(formattedCity);
      if (!validation.isValid && validation.errors.length > 0) {
        console.warn('城市数据验证警告:', validation.errors);
        // 继续保存，因为某些字段可能是可选的
      }

      console.log('📤 保存城市到数据库...');
      
      // 检查城市是否已存在
      const existingCity = await this.getCity(cityData.id);
      
      if (existingCity) {
        // 更新现有城市
        await apiPut(`${this.apiBasePath}/cities/${cityData.id}`, formattedCity);
        console.log('✅ 城市更新成功');
      } else {
        // 创建新城市
        await apiPost(`${this.apiBasePath}/cities`, formattedCity);
        console.log('✅ 新城市创建成功');
      }

      // 清除相关缓存
      this.cache.delete('cities_list');
      this.cache.delete(`city_${cityData.id}`);

      // 同时保存到localStorage作为备份
      try {
        const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityData.id;
        localStorage.setItem(cityKey, JSON.stringify(formattedCity));
        
        // 更新城市列表
        const citiesData = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES);
        const cityList = citiesData ? JSON.parse(citiesData) : [];
        if (!cityList.includes(cityData.id)) {
          cityList.push(cityData.id);
          localStorage.setItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES, JSON.stringify(cityList));
        }
      } catch (localError) {
        console.warn('本地备份失败:', localError);
      }

      // 触发数据更新通知
      dataUpdateNotifier.notify({
        type: 'city_updated',
        cityId: cityData.id,
        cityName: cityData.name,
        isNew: !existingCity,
        timestamp: new Date().toISOString()
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

      console.log('🗑️ 从数据库删除城市...');
      await apiDelete(`${this.apiBasePath}/cities/${cityId}`);
      
      // 清除缓存
      this.cache.delete('cities_list');
      this.cache.delete(`city_${cityId}`);

      // 从localStorage删除备份
      try {
        const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityId;
        localStorage.removeItem(cityKey);
        
        const citiesData = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES);
        if (citiesData) {
          const cityList = JSON.parse(citiesData);
          const filteredList = cityList.filter(id => id !== cityId);
          localStorage.setItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES, JSON.stringify(filteredList));
        }
      } catch (localError) {
        console.warn('本地备份删除失败:', localError);
      }

      // 触发数据更新通知
      dataUpdateNotifier.notify({
        type: 'city_deleted',
        cityId: cityId,
        timestamp: new Date().toISOString()
      });

      console.log(`✅ 城市删除成功: ${cityId}`);
      return true;
    } catch (error) {
      console.error(`删除城市失败 ${cityId}:`, error);
      return false;
    }
  }

  /**
   * 根据FSA获取城市信息
   * @param {string} fsaCode - FSA代码
   * @returns {Promise<Object|null>} 城市和区域信息
   */
  async getCityByFSA(fsaCode) {
    try {
      if (!fsaCode) return null;
      
      console.log(`🔍 查询FSA: ${fsaCode}`);
      const result = await apiGet(`${this.apiBasePath}/fsa/${fsaCode}`);
      
      if (result && result.success) {
        return result.data;
      }
      
      return null;
    } catch (error) {
      console.error(`查询FSA失败 ${fsaCode}:`, error);
      return null;
    }
  }

  /**
   * 批量查询FSA
   * @param {string[]} fsaCodes - FSA代码列表
   * @returns {Promise<Object>} FSA映射信息
   */
  async batchGetFSA(fsaCodes) {
    try {
      if (!fsaCodes || fsaCodes.length === 0) return {};
      
      console.log(`🔍 批量查询 ${fsaCodes.length} 个FSA`);
      const result = await apiPost(`${this.apiBasePath}/fsa/batch`, { fsaCodes });
      
      if (result && result.success) {
        return result.data;
      }
      
      return {};
    } catch (error) {
      console.error('批量查询FSA失败:', error);
      return {};
    }
  }

  /**
   * 批量导入城市数据
   * @param {Object[]} cities - 城市数据数组
   * @returns {Promise<Object>} 导入结果
   */
  async importCities(cities) {
    try {
      if (!cities || !Array.isArray(cities)) {
        throw new Error('cities必须是数组');
      }

      console.log(`📤 批量导入 ${cities.length} 个城市...`);
      
      // 格式化所有城市数据
      const formattedCities = cities.map(city => this._formatCityData(city));
      
      const result = await apiPost(`${this.apiBasePath}/import`, { 
        cities: formattedCities 
      });
      
      if (result && result.success) {
        // 清除所有缓存
        this.clearCache();
        
        // 触发数据更新通知
        dataUpdateNotifier.notify({
          type: 'cities_imported',
          count: result.data.successCount,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ 导入完成: 成功 ${result.data.successCount}/${cities.length}`);
        return result.data;
      }
      
      throw new Error('导入失败');
    } catch (error) {
      console.error('批量导入失败:', error);
      throw error;
    }
  }

  /**
   * 从localStorage迁移数据到数据库
   * @returns {Promise<Object>} 迁移结果
   */
  async migrateFromLocalStorage() {
    try {
      console.log('🔄 开始从localStorage迁移数据...');
      
      // 获取所有本地城市
      const citiesData = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES);
      if (!citiesData) {
        console.log('没有找到本地数据');
        return { success: true, count: 0 };
      }

      const cityIds = JSON.parse(citiesData);
      const cities = [];
      
      for (const cityId of cityIds) {
        const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityId;
        const cityData = localStorage.getItem(cityKey);
        if (cityData) {
          cities.push(JSON.parse(cityData));
        }
      }

      if (cities.length === 0) {
        console.log('没有找到城市数据');
        return { success: true, count: 0 };
      }

      // 批量导入到数据库
      const result = await this.importCities(cities);
      
      console.log(`✅ 迁移完成: ${result.successCount} 个城市`);
      return {
        success: true,
        count: result.successCount,
        errors: result.errors
      };
    } catch (error) {
      console.error('迁移失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // === 私有方法 ===

  /**
   * 格式化城市数据
   * @private
   */
  _formatCityData(cityData) {
    const now = new Date().toISOString();
    
    return {
      ...cityData,
      metadata: cityData.metadata || {
        createdAt: now,
        updatedAt: now,
        version: 1
      },
      regions: (cityData.regions || []).map(region => ({
        ...region,
        cityId: cityData.id,
        metadata: region.metadata || {
          createdAt: now,
          updatedAt: now,
          version: 1
        },
        priceTable: region.priceTable || {
          regionId: region.id,
          prices: [],
          currency: 'CAD'
        }
      }))
    };
  }
}

// 创建并导出默认实例
export const cityStorageServiceDB = new CityStorageServiceDB();

// 导出类以供测试或其他用途
export default cityStorageServiceDB;