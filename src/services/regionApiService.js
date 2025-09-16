/**
 * 区域管理 API 服务层
 * 负责与后端 API 通信，管理区域、邮编和价格配置数据
 */

import { apiGet, apiPost, apiPut, apiPatch } from '../utils/apiClient';

// API 基础路径
const API_BASE = '/regions';

/**
 * 区域管理 API 服务
 */
class RegionApiService {
  /**
   * 获取所有区域配置
   * @param {boolean} includeInactive - 是否包含未激活的区域
   * @param {boolean} includeStats - 是否包含统计信息
   * @returns {Promise<Object>} 区域配置对象
   */
  async getAllRegions(includeInactive = false, includeStats = false) {
    try {
      const params = {};
      if (includeInactive) params.include_inactive = 'true';
      if (includeStats) params.include_stats = 'true';

      const regions = await apiGet(API_BASE, params);

      // 如果返回的是空数组，返回空对象
      if (!regions || regions.length === 0) {
        return {};
      }

      // 转换为前端期望的格式 { regionId: regionData }
      return regions.reduce((acc, region) => {
        acc[region.id] = {
          ...region,
          postalCodes: region.postalCodes || [],
          // 从postalCodes提取fsaCodes（前3个字符）
          fsaCodes: region.postalCodes ? [...new Set(region.postalCodes.map(pc => pc.substring(0, 3)))] : [],
          // 转换weightRanges字段名以匹配前端期望的格式
          weightRanges: (region.weightRanges || []).map(range => ({
            ...range,
            min: parseFloat(range.minWeight || range.min || 0),
            max: parseFloat(range.maxWeight || range.max || 0),
            label: range.rangeName || range.label || `${range.minWeight || range.min || 0}-${range.maxWeight || range.max || 0} KGS`,
            price: parseFloat(range.price || 0)
          }))
        };
        return acc;
      }, {});
    } catch (error) {
      console.error('获取区域列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个区域详情
   * @param {string} regionId - 区域ID
   * @returns {Promise<Object>} 区域详情
   */
  async getRegionById(regionId) {
    try {
      const region = await apiGet(`${API_BASE}/${regionId}`);
      return {
        ...region,
        postalCodes: region.postalCodes || [],
        // 从postalCodes提取fsaCodes（前3个字符）
        fsaCodes: region.postalCodes ? [...new Set(region.postalCodes.map(pc => pc.substring(0, 3)))] : [],
        // 转换weightRanges字段名以匹配前端期望的格式
        weightRanges: (region.weightRanges || []).map(range => ({
          ...range,
          min: parseFloat(range.minWeight || range.min || 0),
          max: parseFloat(range.maxWeight || range.max || 0),
          label: range.rangeName || range.label || `${range.minWeight || range.min || 0}-${range.maxWeight || range.max || 0} KGS`,
          price: parseFloat(range.price || 0)
        }))
      };
    } catch (error) {
      console.error(`获取区域 ${regionId} 详情失败:`, error);
      throw error;
    }
  }

  /**
   * 创建新区域
   * @param {Object} regionData - 区域数据
   * @returns {Promise<Object>} 创建的区域
   */
  async createRegion(regionData) {
    try {
      return await apiPost(API_BASE, regionData);
    } catch (error) {
      console.error('创建区域失败:', error);
      throw error;
    }
  }

  /**
   * 更新区域配置
   * @param {string} regionId - 区域ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的区域
   */
  async updateRegion(regionId, updateData) {
    try {
      // 先尝试PUT方法（标准RESTful）
      return await apiPut(`${API_BASE}/${regionId}`, updateData);
    } catch (error) {
      console.error(`更新区域 ${regionId} 失败:`, error);
      // 如果PUT失败，尝试PATCH方法
      try {
        console.log(`尝试使用PATCH方法更新区域 ${regionId}`);
        return await apiPatch(`${API_BASE}/${regionId}`, updateData);
      } catch (patchError) {
        console.error(`PATCH方法也失败:`, patchError);
        throw error; // 抛出原始错误
      }
    }
  }

  /**
   * 删除区域
   * @param {string} regionId - 区域ID
   * @returns {Promise<void>}
   */
  async deleteRegion(regionId) {
    try {
      return await apiPost(`${API_BASE}/${regionId}/delete`, {});
    } catch (error) {
      console.error(`删除区域 ${regionId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取区域的邮编列表
   * @param {string} regionId - 区域ID
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 邮编列表结果
   */
  async getRegionPostalCodes(regionId, params = {}) {
    try {
      const result = await apiGet(`${API_BASE}/${regionId}/postal-codes`, params);
      return result.items || [];
    } catch (error) {
      console.error(`获取区域 ${regionId} 邮编失败:`, error);
      throw error;
    }
  }

  /**
   * 批量分配FSA到区域
   * @param {string} regionId - 区域ID
   * @param {string[]} fsaCodes - FSA代码数组
   * @returns {Promise<Object>} 分配结果
   */
  async assignFSAsToRegion(regionId, fsaCodes) {
    try {
      return await apiPost(`${API_BASE}/${regionId}/assign-fsas`, { fsaCodes });
    } catch (error) {
      console.error(`分配FSA到区域 ${regionId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 从区域移除FSA
   * @param {string} regionId - 区域ID
   * @param {string[]} fsaCodes - FSA代码数组
   * @returns {Promise<Object>} 移除结果
   */
  async removeFSAsFromRegion(regionId, fsaCodes) {
    try {
      return await apiPost(`${API_BASE}/${regionId}/remove-fsas`, { fsaCodes });
    } catch (error) {
      console.error(`从区域 ${regionId} 移除FSA失败:`, error);
      throw error;
    }
  }

  /**
   * 批量导入邮编
   * @param {string} regionId - 区域ID
   * @param {string[]} postalCodes - 邮编数组
   * @returns {Promise<Object>} 导入结果
   */
  async batchImportPostalCodes(regionId, postalCodes) {
    try {
      return await apiPost(`${API_BASE}/${regionId}/import-postal-codes`, { postalCodes });
    } catch (error) {
      console.error(`批量导入邮编到区域 ${regionId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取区域统计信息
   * @param {string} regionId - 区域ID
   * @returns {Promise<Object>} 统计信息
   */
  async getRegionStats(regionId) {
    try {
      return await apiGet(`${API_BASE}/${regionId}/stats`);
    } catch (error) {
      console.error(`获取区域 ${regionId} 统计信息失败:`, error);
      throw error;
    }
  }

  /**
   * 批量更新区域价格
   * @param {string} regionId - 区域ID
   * @param {Array} weightRanges - 重量区间价格配置
   * @returns {Promise<Object>} 更新结果
   */
  async updateRegionPrices(regionId, weightRanges) {
    try {
      return await apiPost(`${API_BASE}/${regionId}/prices`, { weightRanges });
    } catch (error) {
      console.error(`更新区域 ${regionId} 价格失败:`, error);
      throw error;
    }
  }

  /**
   * 批量操作 - 同时更新多个区域
   * @param {Object} updates - 批量更新数据 { regionId: updateData }
   * @returns {Promise<Object>} 批量操作结果
   */
  async batchUpdateRegions(updates) {
    try {
      return await apiPost(`${API_BASE}/batch-update`, { updates });
    } catch (error) {
      console.error('批量更新区域失败:', error);
      throw error;
    }
  }

  /**
   * 导出区域配置
   * @param {string[]} regionIds - 要导出的区域ID列表，空数组表示导出所有
   * @returns {Promise<Object>} 导出的配置数据
   */
  async exportRegions(regionIds = []) {
    try {
      return await apiPost(`${API_BASE}/export`, { regionIds });
    } catch (error) {
      console.error('导出区域配置失败:', error);
      throw error;
    }
  }

  /**
   * 导入区域配置
   * @param {Object} configData - 要导入的配置数据
   * @param {boolean} overwrite - 是否覆盖现有配置
   * @returns {Promise<Object>} 导入结果
   */
  async importRegions(configData, overwrite = false) {
    try {
      return await apiPost(`${API_BASE}/import`, { configData, overwrite });
    } catch (error) {
      console.error('导入区域配置失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const regionApiService = new RegionApiService();

// 导出服务实例
export default regionApiService;

// 也导出类，以便需要时创建新实例
export { RegionApiService };