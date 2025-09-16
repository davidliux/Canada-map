/**
 * 卡车配送城市存储服务
 * 
 * 提供完整的城市数据管理功能，包括：
 * - 城市的增删改查操作
 * - FSA冲突检测和索引管理
 * - 数据完整性验证
 * - 事件通知机制
 */

import { TRUCK_STORAGE_KEYS, validateTruckDeliveryCity } from '../../types/truckDelivery.js';
import { dataUpdateNotifier } from '../dataUpdateNotifier.js';
import { apiGet, apiPost, apiPut, apiPatch } from '../apiClient.js';

/**
 * 卡车配送城市存储服务类
 */
export class CityStorageService {
  constructor() {
    // 初始化时确保FSA索引存在
    this._initializeFSAIndex();
  }

  /**
   * 初始化FSA索引
   * @private
   */
  _initializeFSAIndex() {
    const index = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_FSA_INDEX);
    if (!index) {
      localStorage.setItem(TRUCK_STORAGE_KEYS.TRUCK_FSA_INDEX, JSON.stringify({}));
      console.log('📦 已初始化FSA-城市索引');
    }
  }

  /**
   * 获取所有城市列表
   * @returns {Promise<Object[]>} 城市列表，包含基本信息
   */
  async getAllCities() {
    try {
      // 尝试从服务器获取
      try {
        console.log('📥 尝试从服务器获取城市列表...');
        const serverCities = await apiGet('/truck-delivery/cities', { includeZones: 'true' });
        
        // 同步到本地存储
        if (serverCities && Array.isArray(serverCities)) {
          // 更新本地城市列表
          const cityIds = serverCities.map(city => city.id);
          localStorage.setItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES, JSON.stringify(cityIds));
          
          // 保存每个城市的数据到本地（处理数据格式）
          for (const city of serverCities) {
            const now = new Date().toISOString();
            
            // 确保城市数据格式正确，处理zones作为regions
            const processedCity = {
              ...city,
              metadata: city.metadata || {
                createdAt: now,
                updatedAt: now,
                version: 1
              },
              // 将zones转换为regions格式
              regions: (city.zones || city.regions || []).map(zone => ({
                id: zone.id,
                name: zone.name,
                cityId: city.id,
                level: zone.level || 1,
                fsaCodes: zone.fsa_codes || zone.fsaCodes || [],
                metadata: zone.metadata || {
                  createdAt: now,
                  updatedAt: now,
                  version: 1
                },
                priceTable: zone.priceTable || {
                  regionId: zone.id,
                  prices: [],
                  currency: 'CAD'
                }
              }))
            };
            
            const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + city.id;
            localStorage.setItem(cityKey, JSON.stringify(processedCity));
          }
          
          console.log(`✅ 从服务器同步了 ${serverCities.length} 个城市`);
          console.log('CityStorage - 服务器返回的第一个城市原始数据:', serverCities[0]);
          console.log('CityStorage - 第一个城市的regions字段:', serverCities[0]?.regions);
          
          // 返回城市列表（格式化，包含regions以便计算统计）
          return serverCities.map(cityData => {
            // 直接使用服务器返回的regions，已经是正确格式
            const regions = cityData.regions || [];
            
            console.log(`CityStorage - 处理城市 ${cityData.name}:`, {
              原始regions长度: cityData.regions?.length,
              处理后regions长度: regions.length,
              第一个region: regions[0]
            });
            
            const stats = this._calculateCityStats({ ...cityData, regions });
            return {
              id: cityData.id,
              name: cityData.name,
              province: cityData.province,
              themeColor: cityData.themeColor,
              isActive: cityData.isActive,
              regionCount: stats.regionCount,
              totalFSAs: stats.totalFSAs,
              regions: regions, // 包含regions字段
              metadata: cityData.metadata
            };
          });
        }
      } catch (apiError) {
        console.warn('⚠️ 无法从服务器获取城市列表，使用本地数据:', apiError.message);
      }

      // 如果服务器获取失败，使用本地数据
      const citiesData = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES);
      const cityList = citiesData ? JSON.parse(citiesData) : [];
      
      // 返回城市信息（包含regions字段以便统计）
      const cities = cityList.map(cityId => {
        const cityData = this._getCityFromStorage(cityId);
        if (!cityData) return null;
        
        const stats = this._calculateCityStats(cityData);
        
        return {
          id: cityData.id,
          name: cityData.name,
          province: cityData.province,
          themeColor: cityData.themeColor,
          isActive: cityData.isActive,
          regionCount: stats.regionCount,
          totalFSAs: stats.totalFSAs,
          regions: cityData.regions || [], // 包含regions字段
          metadata: cityData.metadata
        };
      }).filter(Boolean);

      console.log(`📦 获取到 ${cities.length} 个城市（本地）`);
      return cities;
    } catch (error) {
      console.error('获取城市列表失败:', error);
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

      // 首先尝试从服务器获取最新数据
      try {
        console.log(`📥 尝试从服务器获取城市数据: ${cityId}`);
        const serverCity = await apiGet(`/truck-delivery/cities/${cityId}`);
        
        if (serverCity) {
          const now = new Date().toISOString();
          
          // 处理服务器返回的数据格式，将zones转换为regions
          const processedCity = {
            ...serverCity,
            metadata: serverCity.metadata || {
              createdAt: now,
              updatedAt: now,
              version: 1
            },
            // 将zones转换为regions格式
            regions: (serverCity.zones || serverCity.regions || []).map(zone => ({
              id: zone.id,
              name: zone.name,
              cityId: cityId,
              level: zone.level || 1,
              fsaCodes: zone.fsa_codes || zone.fsaCodes || [],
              metadata: zone.metadata || {
                createdAt: now,
                updatedAt: now,
                version: 1
              },
              priceTable: zone.priceTable || {
                regionId: zone.id,
                prices: [],
                currency: 'CAD'
              }
            }))
          };
          
          // 保存到本地缓存
          const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityId;
          localStorage.setItem(cityKey, JSON.stringify(processedCity));
          
          console.log(`✅ 从服务器获取城市数据成功: ${processedCity.name}`);
          return processedCity;
        }
      } catch (apiError) {
        console.warn('⚠️ 无法从服务器获取城市数据，使用本地缓存:', apiError.message);
      }

      // 如果服务器获取失败，尝试从本地存储获取
      let cityData = this._getCityFromStorage(cityId);
      if (!cityData) {
        console.warn(`城市不存在: ${cityId}`);
        return null;
      }

      // 修复数据格式（如果需要）
      const now = new Date().toISOString();
      cityData = {
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

      // 验证数据完整性（仅记录警告，不阻止返回）
      const validation = validateTruckDeliveryCity(cityData);
      if (!validation.isValid && validation.errors.length > 0) {
        console.debug(`城市数据验证警告 ${cityId}:`, validation.errors);
      }

      console.log(`📦 获取城市: ${cityData.name} (${cityId})`);
      return cityData;
    } catch (error) {
      console.error(`获取城市失败 ${cityId}:`, error);
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

      // 验证数据完整性
      const validation = validateTruckDeliveryCity(cityData);
      if (!validation.isValid) {
        console.error('城市数据验证失败:', validation.errors);
        return false;
      }

      if (validation.warnings.length > 0) {
        console.warn('城市数据警告:', validation.warnings);
      }

      // 检查FSA冲突
      const conflicts = await this.validateFSAConflicts(cityData);
      if (conflicts.hasConflicts) {
        console.error('FSA冲突检测失败:', conflicts.conflicts);
        return false;
      }

      // 更新更新时间和版本号
      const now = new Date().toISOString();
      
      // 确保每个区域都有必要的字段，处理zones和regions
      const processedRegions = (cityData.zones || cityData.regions || []).map(zone => ({
        id: zone.id,
        name: zone.name,
        cityId: cityData.id,
        level: zone.level || 1,
        fsaCodes: zone.fsa_codes || zone.fsaCodes || [],
        metadata: zone.metadata || {
          createdAt: zone.metadata?.createdAt || now,
          updatedAt: now,
          version: (zone.metadata?.version || 0) + 1
        },
        priceTable: zone.priceTable || {
          regionId: zone.id,
          prices: [],
          currency: 'CAD'
        }
      }));
      
      const updatedCityData = {
        ...cityData,
        regions: processedRegions,
        metadata: {
          ...cityData.metadata,
          createdAt: cityData.metadata?.createdAt || now,
          updatedAt: now,
          version: (cityData.metadata?.version || 0) + 1
        }
      };

      // 检查是否为新城市
      const isNewCity = !this._getCityFromStorage(cityData.id);

      // 先保存到localStorage（作为本地缓存）
      const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityData.id;
      localStorage.setItem(cityKey, JSON.stringify(updatedCityData));

      // 如果是新城市，更新城市列表
      if (isNewCity) {
        await this._addCityToList(cityData.id);
      }

      // 更新FSA索引
      await this.updateFSAIndex(cityData.id, updatedCityData);

      // 尝试保存到服务器
      try {
        console.log('📤 正在保存城市到服务器...');
        if (isNewCity) {
          // 新城市使用POST
          await apiPost('/truck-delivery/cities', updatedCityData);
          console.log('✅ 新城市已同步到服务器');
        } else {
          // 更新现有城市使用PUT
          await apiPut(`/truck-delivery/cities/${cityData.id}`, updatedCityData);
          console.log('✅ 城市更新已同步到服务器');
        }
      } catch (apiError) {
        console.warn('⚠️ 无法同步到服务器，数据已保存到本地:', apiError.message);
        // API失败但本地保存成功，仍然认为是成功的
      }

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

      // 获取城市数据以备记录
      const cityData = this._getCityFromStorage(cityId);
      if (!cityData) {
        console.warn(`城市不存在: ${cityId}`);
        return true; // 已经不存在，认为删除成功
      }

      // 从存储中删除城市数据
      const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityId;
      localStorage.removeItem(cityKey);

      // 从城市列表中移除
      await this._removeCityFromList(cityId);

      // 清理相关的区域和价格数据
      await this._cleanupCityRelatedData(cityId);

      // 从FSA索引中移除该城市的所有FSA
      await this._removeFromFSAIndex(cityId);

      // 触发数据更新通知
      dataUpdateNotifier.notify({
        type: 'city_deleted',
        cityId: cityId,
        cityName: cityData.name,
        timestamp: new Date().toISOString()
      });

      console.log(`🗑️ 城市删除成功: ${cityData.name} (${cityId})`);
      return true;
    } catch (error) {
      console.error(`删除城市失败 ${cityId}:`, error);
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
      const fsaIndex = this._getFSAIndex();
      const conflicts = [];
      
      // 收集城市中所有的FSA代码
      const allFSAs = cityData.regions?.flatMap(region => region.fsaCodes || []) || [];
      
      // 检查每个FSA是否已被其他城市使用
      for (const fsa of allFSAs) {
        const existingCityId = fsaIndex[fsa];
        if (existingCityId && existingCityId !== cityData.id) {
          const existingCity = this._getCityFromStorage(existingCityId);
          conflicts.push({
            fsa,
            conflictWithCity: existingCityId,
            conflictWithCityName: existingCity?.name || '未知城市'
          });
        }
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
        totalFSAs: allFSAs.length,
        uniqueFSAs: new Set(allFSAs).size
      };
    } catch (error) {
      console.error('FSA冲突检测失败:', error);
      return {
        hasConflicts: true,
        conflicts: [`检测过程出错: ${error.message}`],
        totalFSAs: 0,
        uniqueFSAs: 0
      };
    }
  }

  /**
   * 更新FSA索引
   * @param {string} cityId - 城市ID
   * @param {Object} cityData - 城市数据
   * @returns {Promise<boolean>} 更新是否成功
   */
  async updateFSAIndex(cityId, cityData) {
    try {
      const fsaIndex = this._getFSAIndex();
      
      // 首先移除该城市的所有FSA映射
      for (const [fsa, mappedCityId] of Object.entries(fsaIndex)) {
        if (mappedCityId === cityId) {
          delete fsaIndex[fsa];
        }
      }

      // 添加城市中所有区域的FSA映射
      const allFSAs = cityData.regions?.flatMap(region => region.fsaCodes || []) || [];
      for (const fsa of allFSAs) {
        fsaIndex[fsa] = cityId;
      }

      // 保存更新后的索引
      localStorage.setItem(TRUCK_STORAGE_KEYS.TRUCK_FSA_INDEX, JSON.stringify(fsaIndex));

      console.log(`🔄 FSA索引更新成功: 城市 ${cityId} 映射了 ${allFSAs.length} 个FSA`);
      return true;
    } catch (error) {
      console.error(`更新FSA索引失败 ${cityId}:`, error);
      return false;
    }
  }

  /**
   * 获取FSA对应的城市ID
   * @param {string} fsaCode - FSA代码
   * @returns {string|null} 城市ID
   */
  getCityByFSA(fsaCode) {
    try {
      const fsaIndex = this._getFSAIndex();
      return fsaIndex[fsaCode] || null;
    } catch (error) {
      console.error(`获取FSA映射失败 ${fsaCode}:`, error);
      return null;
    }
  }

  /**
   * 获取FSA索引统计信息
   * @returns {Object} 索引统计
   */
  getFSAIndexStats() {
    try {
      const fsaIndex = this._getFSAIndex();
      const totalFSAs = Object.keys(fsaIndex).length;
      const cityCount = new Set(Object.values(fsaIndex)).size;
      
      // 按城市统计FSA数量
      const cityStats = {};
      for (const [fsa, cityId] of Object.entries(fsaIndex)) {
        if (!cityStats[cityId]) {
          cityStats[cityId] = 0;
        }
        cityStats[cityId]++;
      }

      return {
        totalFSAs,
        cityCount,
        cityStats,
        indexSize: JSON.stringify(fsaIndex).length
      };
    } catch (error) {
      console.error('获取FSA索引统计失败:', error);
      return {
        totalFSAs: 0,
        cityCount: 0,
        cityStats: {},
        indexSize: 0
      };
    }
  }

  // === 私有方法 ===

  /**
   * 从存储中获取城市数据
   * @private
   * @param {string} cityId - 城市ID
   * @returns {Object|null} 城市数据
   */
  _getCityFromStorage(cityId) {
    try {
      const cityKey = TRUCK_STORAGE_KEYS.TRUCK_CITY_PREFIX + cityId;
      const data = localStorage.getItem(cityKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`从存储获取城市数据失败 ${cityId}:`, error);
      return null;
    }
  }

  /**
   * 获取FSA索引
   * @private
   * @returns {Object} FSA索引对象
   */
  _getFSAIndex() {
    try {
      const data = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_FSA_INDEX);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('获取FSA索引失败:', error);
      return {};
    }
  }

  /**
   * 将城市添加到城市列表
   * @private
   * @param {string} cityId - 城市ID
   */
  async _addCityToList(cityId) {
    try {
      const citiesData = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES);
      const cityList = citiesData ? JSON.parse(citiesData) : [];
      
      if (!cityList.includes(cityId)) {
        cityList.push(cityId);
        localStorage.setItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES, JSON.stringify(cityList));
      }
    } catch (error) {
      console.error(`添加城市到列表失败 ${cityId}:`, error);
    }
  }

  /**
   * 从城市列表中移除城市
   * @private
   * @param {string} cityId - 城市ID
   */
  async _removeCityFromList(cityId) {
    try {
      const citiesData = localStorage.getItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES);
      const cityList = citiesData ? JSON.parse(citiesData) : [];
      
      const filteredList = cityList.filter(id => id !== cityId);
      localStorage.setItem(TRUCK_STORAGE_KEYS.TRUCK_CITIES, JSON.stringify(filteredList));
    } catch (error) {
      console.error(`从城市列表移除失败 ${cityId}:`, error);
    }
  }

  /**
   * 清理城市相关的数据
   * @private
   * @param {string} cityId - 城市ID
   */
  async _cleanupCityRelatedData(cityId) {
    try {
      // 清理区域数据
      const regionKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(TRUCK_STORAGE_KEYS.TRUCK_REGION_PREFIX));
      
      for (const key of regionKeys) {
        try {
          const regionData = JSON.parse(localStorage.getItem(key));
          if (regionData && regionData.cityId === cityId) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // 忽略解析错误，直接删除
          localStorage.removeItem(key);
        }
      }

      // 清理价格数据
      const priceKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(TRUCK_STORAGE_KEYS.TRUCK_PRICE_PREFIX));
      
      for (const key of priceKeys) {
        try {
          const priceData = JSON.parse(localStorage.getItem(key));
          // 这里需要通过region反查，先跳过复杂逻辑
          // 实际使用中可以根据regionId清理对应的价格数据
        } catch (e) {
          // 忽略错误
        }
      }

      console.log(`🧹 清理城市相关数据完成: ${cityId}`);
    } catch (error) {
      console.error(`清理城市相关数据失败 ${cityId}:`, error);
    }
  }

  /**
   * 从FSA索引中移除城市
   * @private
   * @param {string} cityId - 城市ID
   */
  async _removeFromFSAIndex(cityId) {
    try {
      const fsaIndex = this._getFSAIndex();
      
      // 移除该城市的所有FSA映射
      for (const [fsa, mappedCityId] of Object.entries(fsaIndex)) {
        if (mappedCityId === cityId) {
          delete fsaIndex[fsa];
        }
      }

      localStorage.setItem(TRUCK_STORAGE_KEYS.TRUCK_FSA_INDEX, JSON.stringify(fsaIndex));
      console.log(`🔄 从FSA索引移除城市: ${cityId}`);
    } catch (error) {
      console.error(`从FSA索引移除城市失败 ${cityId}:`, error);
    }
  }

  /**
   * 计算城市统计信息
   * @private
   * @param {Object} cityData - 城市数据
   * @returns {Object} 统计信息
   */
  _calculateCityStats(cityData) {
    if (!cityData || !Array.isArray(cityData.regions)) {
      return {
        regionCount: 0,
        totalFSAs: 0,
        activePriceRanges: 0
      };
    }

    const regionCount = cityData.regions.length;
    const totalFSAs = cityData.regions.reduce((sum, region) => 
      sum + (region.fsaCodes?.length || 0), 0);
    const activePriceRanges = cityData.regions.reduce((sum, region) => 
      sum + (region.priceTable?.prices?.filter(p => p.isActive).length || 0), 0);

    return {
      regionCount,
      totalFSAs,
      activePriceRanges
    };
  }
}

// 创建并导出默认实例
export const cityStorageService = new CityStorageService();

// 导出类以供测试或其他用途
export default cityStorageService;