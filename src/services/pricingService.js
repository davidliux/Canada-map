// Pricing Service Module
// For the dynamic-pricing-config specification

import axios from 'axios';
import { validatePricingRule, validatePlateCount } from '../utils/pricing/pricingValidator';
import { cityStorageService } from '../utils/storage/cityStorage.js';

// 在 Vite 中使用 import.meta.env 而不是 process.env
// 使用正确的后端端口 5050
const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:5050/api/v1';

/**
 * Pricing Service - Handles all pricing rule operations
 */
class PricingService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/truck-delivery`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for authentication if needed
    this.apiClient.interceptors.request.use(
      config => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          console.error('Unauthorized access - redirecting to login');
          // window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get pricing rules by region
   * @param {string} regionId - Region ID to filter by
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of pricing rules
   */
  async getRulesByRegion(regionId, options = {}) {
    try {
      const params = {
        regionId,
        isActive: options.isActive !== undefined ? options.isActive : true,
        currency: options.currency,
        page: options.page || 1,
        limit: options.limit || 20
      };

      const response = await this.apiClient.get('/pricing-rules', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get pricing rules by city
   * @param {string} cityId - City ID to filter by
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of pricing rules for all regions in the city
   */
  async getRulesByCity(cityId, options = {}) {
    try {
      const params = {
        cityId,
        isActive: options.isActive !== undefined ? options.isActive : true,
        currency: options.currency,
        page: options.page || 1,
        limit: options.limit || 100, // Higher default for city-level queries
        includeRegionData: true // Include region information in response
      };

      const response = await this.apiClient.get('/pricing-rules/by-city', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing rules by city:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get a single pricing rule by ID
   * @param {string} ruleId - Rule ID
   * @returns {Promise<Object>} Pricing rule details
   */
  async getRule(ruleId) {
    try {
      const response = await this.apiClient.get(`/pricing-rules/${ruleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pricing rule:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a new pricing rule
   * @param {Object} ruleData - Pricing rule configuration
   * @returns {Promise<Object>} Created pricing rule
   */
  async createRule(ruleData) {
    try {
      // Validate rule data before sending
      const validation = validatePricingRule(ruleData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const response = await this.apiClient.post('/pricing-rules', ruleData);
      
      // Invalidate cache for this region
      this.clearCache(ruleData.regionId);
      
      return response.data;
    } catch (error) {
      console.error('Error creating pricing rule:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing pricing rule
   * @param {string} ruleId - Rule ID to update
   * @param {Object} updates - Partial rule updates
   * @returns {Promise<Object>} Updated pricing rule
   */
  async updateRule(ruleId, updates) {
    try {
      // Get existing rule for validation
      const existingRule = await this.getRule(ruleId);
      const updatedRule = { ...existingRule, ...updates };
      
      // Validate complete rule
      const validation = validatePricingRule(updatedRule);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      const response = await this.apiClient.put(`/pricing-rules/${ruleId}`, updates);
      
      // Invalidate cache
      this.clearCache(existingRule.regionId);
      
      return response.data;
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a pricing rule
   * @param {string} ruleId - Rule ID to delete
   * @returns {Promise<void>}
   */
  async deleteRule(ruleId) {
    try {
      // Get rule to clear appropriate cache
      const rule = await this.getRule(ruleId);
      
      await this.apiClient.delete(`/pricing-rules/${ruleId}`);
      
      // Invalidate cache
      this.clearCache(rule.regionId);
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Activate or deactivate a pricing rule
   * @param {string} ruleId - Rule ID
   * @param {boolean} isActive - Active status
   * @returns {Promise<Object>} Updated rule
   */
  async setRuleStatus(ruleId, isActive) {
    try {
      const response = await this.apiClient.patch(`/pricing-rules/${ruleId}/status`, {
        isActive
      });
      
      // Invalidate cache
      const rule = response.data;
      this.clearCache(rule.regionId);
      
      return rule;
    } catch (error) {
      console.error('Error updating rule status:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Calculate price for a given plate count
   * @param {string} regionId - Region ID
   * @param {number} plateCount - Number of plates
   * @param {Object} options - Calculation options
   * @returns {Promise<Object>} Price calculation result
   */
  async calculatePrice(regionId, plateCount, options = {}) {
    try {
      // Validate plate count
      const plateValidation = validatePlateCount(plateCount);
      if (!plateValidation.isValid) {
        throw new Error(plateValidation.error);
      }

      const response = await this.apiClient.post('/calculate-price', {
        regionId,
        plateCount,
        ruleId: options.ruleId,
        currency: options.currency || 'CAD'
      });

      return response.data;
    } catch (error) {
      console.error('Error calculating price:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Calculate prices for multiple plate counts (batch)
   * @param {string} regionId - Region ID
   * @param {Array<number>} plateCounts - Array of plate counts
   * @param {Object} options - Calculation options
   * @returns {Promise<Array>} Array of price calculations
   */
  async calculatePriceBatch(regionId, plateCounts, options = {}) {
    try {
      // Validate all plate counts
      for (const count of plateCounts) {
        const validation = validatePlateCount(count);
        if (!validation.isValid) {
          throw new Error(`Invalid plate count ${count}: ${validation.error}`);
        }
      }

      const response = await this.apiClient.post('/calculate-price-batch', {
        regionId,
        plateCounts,
        ruleId: options.ruleId,
        currency: options.currency || 'CAD'
      });

      return response.data;
    } catch (error) {
      console.error('Error calculating batch prices:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get audit log for a pricing rule
   * @param {string} ruleId - Rule ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Audit log entries
   */
  async getAuditLog(ruleId, options = {}) {
    try {
      const params = {
        startDate: options.startDate,
        endDate: options.endDate,
        userId: options.userId,
        page: options.page || 1,
        limit: options.limit || 50
      };

      const response = await this.apiClient.get(`/pricing-rules/${ruleId}/audit`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit log:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Export pricing configuration for a region
   * @param {string} regionId - Region ID
   * @returns {Promise<Object>} Export data
   */
  async exportConfiguration(regionId) {
    try {
      const response = await this.apiClient.get(`/pricing-rules/export`, {
        params: { regionId }
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting configuration:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Import pricing configuration
   * @param {Object} importData - Configuration data to import
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import result
   */
  async importConfiguration(importData, options = {}) {
    try {
      const response = await this.apiClient.post('/pricing-rules/import', {
        data: importData,
        targetRegions: options.targetRegions,
        overwrite: options.overwrite || false
      });

      // Clear cache for affected regions
      if (options.targetRegions) {
        options.targetRegions.forEach(regionId => this.clearCache(regionId));
      }

      return response.data;
    } catch (error) {
      console.error('Error importing configuration:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get available pricing templates
   * @returns {Promise<Array>} Array of pricing templates
   */
  async getTemplates() {
    try {
      const response = await this.apiClient.get('/pricing-templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Apply a template to a region
   * @param {string} templateId - Template ID
   * @param {string} regionId - Region ID
   * @param {Object} customizations - Optional customizations
   * @returns {Promise<Object>} Created pricing rule
   */
  async applyTemplate(templateId, regionId, customizations = {}) {
    try {
      const response = await this.apiClient.post('/pricing-rules/from-template', {
        templateId,
        regionId,
        customizations
      });

      // Clear cache for this region
      this.clearCache(regionId);

      return response.data;
    } catch (error) {
      console.error('Error applying template:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Validate a pricing rule without saving
   * @param {Object} ruleData - Rule data to validate
   * @returns {Object} Validation result
   */
  validateRule(ruleData) {
    return validatePricingRule(ruleData);
  }

  /**
   * Get regions for a given city using CityStorageService
   * @private
   * @param {string} cityId - City ID to get regions for
   * @returns {Promise<Array>} Array of region objects or empty array
   */
  async getCityRegions(cityId) {
    try {
      if (!cityId) {
        console.warn('City ID is required for getCityRegions');
        return [];
      }

      const cityData = await cityStorageService.getCity(cityId);
      
      if (!cityData) {
        console.warn(`City not found: ${cityId}`);
        return [];
      }

      const regions = cityData.regions || [];
      console.log(`获取城市区域: ${cityData.name} (${cityId}) - ${regions.length} 个区域`);
      
      return regions;
    } catch (error) {
      console.error(`Error getting city regions for ${cityId}:`, error);
      return [];
    }
  }

  /**
   * Clear cached data for a region
   * @param {string} regionId - Region ID
   */
  clearCache(regionId) {
    // Clear any cached data for this region
    const cacheKey = `pricing_rules_${regionId}`;
    localStorage.removeItem(cacheKey);
    sessionStorage.removeItem(cacheKey);
  }

  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'An error occurred';
      const code = error.response.data?.code || 'SERVER_ERROR';
      const err = new Error(message);
      err.code = code;
      err.status = error.response.status;
      return err;
    } else if (error.request) {
      // Request made but no response
      const err = new Error('Network error - please check your connection');
      err.code = 'NETWORK_ERROR';
      return err;
    } else {
      // Something else happened
      return error;
    }
  }

  /**
   * Get pricing statistics for a region
   * @param {string} regionId - Region ID
   * @returns {Promise<Object>} Pricing statistics
   */
  async getRegionStatistics(regionId) {
    try {
      const response = await this.apiClient.get(`/pricing-rules/statistics/${regionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Bulk update multiple pricing rules
   * @param {Array} updates - Array of { ruleId, updates } objects
   * @returns {Promise<Object>} Bulk update result
   */
  async bulkUpdateRules(updates) {
    try {
      const response = await this.apiClient.post('/pricing-rules/bulk-update', {
        updates
      });

      // Clear cache for all affected regions
      updates.forEach(update => {
        this.clearCache(update.regionId);
      });

      return response.data;
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Clone a pricing rule to another region
   * @param {string} sourceRuleId - Source rule ID
   * @param {string} targetRegionId - Target region ID
   * @param {Object} modifications - Optional modifications
   * @returns {Promise<Object>} Cloned rule
   */
  async cloneRule(sourceRuleId, targetRegionId, modifications = {}) {
    try {
      const response = await this.apiClient.post(`/pricing-rules/${sourceRuleId}/clone`, {
        targetRegionId,
        modifications
      });

      // Clear cache for target region
      this.clearCache(targetRegionId);

      return response.data;
    } catch (error) {
      console.error('Error cloning rule:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 获取FSA分组的板数定价
   * @param {string} cityId - 城市ID
   * @param {string} zoneId - 区域ID
   * @param {string} groupId - 分组ID
   * @returns {Promise<Object>} 分组板数定价数据
   */
  async getGroupSkidPricing(cityId, zoneId, groupId) {
    try {
      const key = `skid_pricing_group_${cityId}_${zoneId}_${groupId}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('获取分组板数定价失败:', error);
      return null;
    }
  }

  /**
   * 保存FSA分组的板数定价
   * @param {string} cityId - 城市ID
   * @param {string} zoneId - 区域ID
   * @param {string} groupId - 分组ID
   * @param {Object} pricingData - 定价数据
   * @returns {Promise<boolean>} 保存结果
   */
  async saveGroupSkidPricing(cityId, zoneId, groupId, pricingData) {
    try {
      const key = `skid_pricing_group_${cityId}_${zoneId}_${groupId}`;
      localStorage.setItem(key, JSON.stringify(pricingData));
      console.log('分组板数定价已保存:', { cityId, zoneId, groupId });
      return true;
    } catch (error) {
      console.error('保存分组板数定价失败:', error);
      throw error;
    }
  }

  /**
   * 删除FSA分组的板数定价
   * @param {string} cityId - 城市ID
   * @param {string} zoneId - 区域ID
   * @param {string} groupId - 分组ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteGroupSkidPricing(cityId, zoneId, groupId) {
    try {
      const key = `skid_pricing_group_${cityId}_${zoneId}_${groupId}`;
      localStorage.removeItem(key);
      console.log('分组板数定价已删除:', { cityId, zoneId, groupId });
      return true;
    } catch (error) {
      console.error('删除分组板数定价失败:', error);
      throw error;
    }
  }

  /**
   * 获取板数定价数据
   * @param {string} cityId - 城市ID
   * @returns {Promise<Object>} 板数定价数据
   */
  async getSkidPricing(cityId) {
    try {
      if (!cityId) {
        console.warn('City ID is required for getSkidPricing');
        return {};
      }

      console.log(`获取板数定价数据 - 城市ID: ${cityId}`);
      const response = await this.apiClient.get(`/skid-pricing/${cityId}`);

      if (response.data && response.data.success) {
        return response.data.data || {};
      }

      return {};
    } catch (error) {
      console.error('Error fetching skid pricing:', error);
      // 返回空对象而不是抛出错误，避免页面崩溃
      return {};
    }
  }

  /**
   * 保存板数定价数据
   * @param {string} cityId - 城市ID
   * @param {Object} pricingData - 定价数据
   * @returns {Promise<Object>} 保存结果
   */
  async saveSkidPricing(cityId, pricingData) {
    try {
      if (!cityId) {
        throw new Error('City ID is required for saveSkidPricing');
      }

      console.log(`保存板数定价数据 - 城市ID: ${cityId}`);
      console.log('定价数据:', pricingData);

      const response = await this.apiClient.post(`/skid-pricing/${cityId}`, pricingData);

      if (response.data && response.data.success) {
        console.log('板数定价数据保存成功');
        return response.data.data;
      }

      throw new Error(response.data?.message || '保存失败');
    } catch (error) {
      console.error('Error saving skid pricing:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 更新特定区域的板数定价
   * @param {string} cityId - 城市ID
   * @param {string} zoneId - 区域ID
   * @param {Object} zonePricing - 区域定价数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateZoneSkidPricing(cityId, zoneId, zonePricing) {
    try {
      if (!cityId || !zoneId) {
        throw new Error('City ID and Zone ID are required');
      }

      const response = await this.apiClient.put(`/skid-pricing/${cityId}/${zoneId}`, zonePricing);

      if (response.data && response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data?.message || '更新失败');
    } catch (error) {
      console.error('Error updating zone skid pricing:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 批量导入板数定价数据
   * @param {Array} data - 批量数据
   * @returns {Promise<Object>} 导入结果
   */
  async importSkidPricing(data) {
    try {
      if (!Array.isArray(data)) {
        throw new Error('Import data must be an array');
      }

      const response = await this.apiClient.post('/skid-pricing/batch', { data });

      if (response.data && response.data.success) {
        return response.data.data;
      }

      throw new Error(response.data?.message || '导入失败');
    } catch (error) {
      console.error('Error importing skid pricing:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 导出板数定价数据
   * @param {string} cityId - 城市ID
   * @returns {Promise<Array>} 导出的数据
   */
  async exportSkidPricing(cityId) {
    try {
      if (!cityId) {
        throw new Error('City ID is required for export');
      }

      const response = await this.apiClient.get(`/skid-pricing/export/${cityId}`);

      if (response.data && response.data.success) {
        return response.data.data || [];
      }

      return [];
    } catch (error) {
      console.error('Error exporting skid pricing:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Batch update pricing rules for all regions in a city
   * @param {string} cityId - City ID
   * @param {Object} ruleUpdates - Rule updates to apply to all regions
   * @param {Object} options - Update options
   * @returns {Promise<Object>} Batch update result
   */
  async batchUpdateCityRules(cityId, ruleUpdates, options = {}) {
    try {
      if (!cityId) {
        throw new Error('City ID is required for batch update');
      }

      if (!ruleUpdates || typeof ruleUpdates !== 'object') {
        throw new Error('Rule updates object is required');
      }

      // Get all regions for this city
      const cityRegions = await this.getCityRegions(cityId);
      
      if (!cityRegions || cityRegions.length === 0) {
        console.warn(`No regions found for city: ${cityId}`);
        return {
          success: true,
          affectedRegions: 0,
          results: [],
          message: 'No regions to update in this city'
        };
      }

      console.log(`开始批量更新城市定价规则: ${cityId} - ${cityRegions.length} 个区域`);

      // Validate rule updates if validation is enabled
      if (options.validateUpdates !== false) {
        const validation = this.validateRule(ruleUpdates);
        if (!validation.isValid) {
          throw new Error(`Rule validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Prepare batch update payload
      const batchPayload = {
        cityId,
        ruleUpdates,
        regionIds: cityRegions.map(region => region.id),
        options: {
          overwrite: options.overwrite || false,
          createIfMissing: options.createIfMissing || false,
          applyToActiveOnly: options.applyToActiveOnly !== false, // Default to true
          ...options
        }
      };

      // Send batch update request
      const response = await this.apiClient.post('/pricing-rules/batch-city-update', batchPayload);

      // Clear cache for all affected regions
      cityRegions.forEach(region => {
        this.clearCache(region.id);
      });

      const result = {
        success: true,
        cityId,
        affectedRegions: cityRegions.length,
        results: response.data.results || [],
        summary: response.data.summary || {},
        timestamp: new Date().toISOString()
      };

      console.log(`✅ 城市定价规则批量更新完成: ${cityId} - 影响 ${result.affectedRegions} 个区域`);
      return result;

    } catch (error) {
      console.error('Error in batch city rule update:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Apply multipliers to pricing rule configuration
   * @param {Object} pricingRule - Original pricing rule to apply multipliers to
   * @param {Object} multipliers - Multiplier configuration
   * @param {Object} options - Application options
   * @returns {Object} Modified pricing rule with multipliers applied
   */
  applyMultipliers(pricingRule, multipliers, options = {}) {
    try {
      if (!pricingRule) {
        throw new Error('Pricing rule is required');
      }

      if (!multipliers || typeof multipliers !== 'object') {
        throw new Error('Multipliers configuration is required');
      }

      // Create a deep copy to avoid modifying original rule
      const modifiedRule = JSON.parse(JSON.stringify(pricingRule));

      console.log('应用价格乘数:', {
        ruleId: pricingRule.id,
        ruleName: pricingRule.name,
        multipliers
      });

      // Apply base price multiplier
      if (multipliers.basePrice && typeof multipliers.basePrice === 'number') {
        if (multipliers.basePrice <= 0) {
          throw new Error('Base price multiplier must be positive');
        }
        
        const originalBasePrice = modifiedRule.baseConfig.price;
        modifiedRule.baseConfig.price = Math.round(originalBasePrice * multipliers.basePrice * 100) / 100;
        
        console.log(`基础价格乘数应用: ${originalBasePrice} → ${modifiedRule.baseConfig.price} (×${multipliers.basePrice})`);
      }

      // Apply increment multiplier
      if (multipliers.increment && typeof multipliers.increment === 'number') {
        if (multipliers.increment <= 0) {
          throw new Error('Increment multiplier must be positive');
        }

        const { incrementConfig } = modifiedRule;
        
        if (incrementConfig.type === 'fixed') {
          const originalValue = incrementConfig.value;
          incrementConfig.value = Math.round(originalValue * multipliers.increment * 100) / 100;
          console.log(`固定增量乘数应用: ${originalValue} → ${incrementConfig.value} (×${multipliers.increment})`);
          
        } else if (incrementConfig.type === 'percentage') {
          // For percentage, apply multiplier to the percentage value
          const originalValue = incrementConfig.value;
          incrementConfig.value = Math.round(originalValue * multipliers.increment * 10000) / 10000; // Keep precision
          console.log(`百分比增量乘数应用: ${originalValue} → ${incrementConfig.value} (×${multipliers.increment})`);
          
        } else if (incrementConfig.type === 'tiered' && incrementConfig.tiers) {
          // Apply multiplier to all tier increment values
          incrementConfig.tiers.forEach((tier, index) => {
            const originalValue = tier.incrementValue;
            tier.incrementValue = Math.round(originalValue * multipliers.increment * 100) / 100;
            console.log(`分层增量乘数应用 [层级${index}]: ${originalValue} → ${tier.incrementValue} (×${multipliers.increment})`);
          });
        }
      }

      // Apply price cap multiplier
      if (multipliers.priceCap && typeof multipliers.priceCap === 'number') {
        if (multipliers.priceCap <= 0) {
          throw new Error('Price cap multiplier must be positive');
        }

        if (modifiedRule.vehicleConfig.priceCapPerVehicle) {
          const originalCap = modifiedRule.vehicleConfig.priceCapPerVehicle;
          modifiedRule.vehicleConfig.priceCapPerVehicle = Math.round(originalCap * multipliers.priceCap * 100) / 100;
          console.log(`价格上限乘数应用: ${originalCap} → ${modifiedRule.vehicleConfig.priceCapPerVehicle} (×${multipliers.priceCap})`);
        }
      }

      // Apply regional multiplier (applies to all price components)
      if (multipliers.regional && typeof multipliers.regional === 'number') {
        if (multipliers.regional <= 0) {
          throw new Error('Regional multiplier must be positive');
        }

        console.log(`应用区域乘数: ${multipliers.regional}`);
        
        // Apply to base price
        if (modifiedRule.baseConfig.price) {
          const originalBase = modifiedRule.baseConfig.price;
          modifiedRule.baseConfig.price = Math.round(originalBase * multipliers.regional * 100) / 100;
          console.log(`区域乘数应用到基础价格: ${originalBase} → ${modifiedRule.baseConfig.price}`);
        }

        // Apply to increment values
        const { incrementConfig } = modifiedRule;
        if (incrementConfig.type === 'fixed') {
          const originalValue = incrementConfig.value;
          incrementConfig.value = Math.round(originalValue * multipliers.regional * 100) / 100;
          console.log(`区域乘数应用到固定增量: ${originalValue} → ${incrementConfig.value}`);
          
        } else if (incrementConfig.type === 'tiered' && incrementConfig.tiers) {
          incrementConfig.tiers.forEach((tier, index) => {
            const originalValue = tier.incrementValue;
            tier.incrementValue = Math.round(originalValue * multipliers.regional * 100) / 100;
            console.log(`区域乘数应用到分层增量 [层级${index}]: ${originalValue} → ${tier.incrementValue}`);
          });
        }
        // Note: percentage increments are not affected by regional multiplier as they're relative

        // Apply to price cap
        if (modifiedRule.vehicleConfig.priceCapPerVehicle) {
          const originalCap = modifiedRule.vehicleConfig.priceCapPerVehicle;
          modifiedRule.vehicleConfig.priceCapPerVehicle = Math.round(originalCap * multipliers.regional * 100) / 100;
          console.log(`区域乘数应用到价格上限: ${originalCap} → ${modifiedRule.vehicleConfig.priceCapPerVehicle}`);
        }
      }

      // Apply seasonal multiplier
      if (multipliers.seasonal && typeof multipliers.seasonal === 'number') {
        if (multipliers.seasonal <= 0) {
          throw new Error('Seasonal multiplier must be positive');
        }

        console.log(`应用季节乘数: ${multipliers.seasonal}`);
        
        // Apply seasonal multiplier to all applicable prices
        if (modifiedRule.baseConfig.price) {
          const originalBase = modifiedRule.baseConfig.price;
          modifiedRule.baseConfig.price = Math.round(originalBase * multipliers.seasonal * 100) / 100;
          console.log(`季节乘数应用到基础价格: ${originalBase} → ${modifiedRule.baseConfig.price}`);
        }

        // Apply to increment values (but not percentage types)
        const { incrementConfig } = modifiedRule;
        if (incrementConfig.type === 'fixed') {
          const originalValue = incrementConfig.value;
          incrementConfig.value = Math.round(originalValue * multipliers.seasonal * 100) / 100;
          console.log(`季节乘数应用到固定增量: ${originalValue} → ${incrementConfig.value}`);
          
        } else if (incrementConfig.type === 'tiered' && incrementConfig.tiers) {
          incrementConfig.tiers.forEach((tier, index) => {
            const originalValue = tier.incrementValue;
            tier.incrementValue = Math.round(originalValue * multipliers.seasonal * 100) / 100;
            console.log(`季节乘数应用到分层增量 [层级${index}]: ${originalValue} → ${tier.incrementValue}`);
          });
        }
      }

      // Add metadata about multipliers applied
      modifiedRule.multipliersApplied = {
        multipliers,
        appliedAt: new Date().toISOString(),
        originalRuleId: pricingRule.id,
        options
      };

      // Validate the modified rule if validation is enabled
      if (options.validate !== false) {
        const validation = this.validateRule(modifiedRule);
        if (!validation.isValid) {
          throw new Error(`Rule validation failed after applying multipliers: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      console.log('价格乘数应用完成:', {
        originalRuleId: pricingRule.id,
        modifiedRule: {
          basePrice: modifiedRule.baseConfig.price,
          incrementType: modifiedRule.incrementConfig.type,
          incrementValue: modifiedRule.incrementConfig.value,
          priceCap: modifiedRule.vehicleConfig.priceCapPerVehicle
        }
      });

      return modifiedRule;

    } catch (error) {
      console.error('Error applying multipliers to pricing rule:', error);
      throw error;
    }
  }

  /**
   * Get city pricing rules (for dynamic pricing dashboard)
   * @param {string} cityId - City ID
   * @returns {Promise<Array>} Array of pricing rules for the city
   */
  async getCityPricingRules(cityId) {
    try {
      if (!cityId) {
        throw new Error('City ID is required');
      }

      const response = await this.apiClient.get(`/pricing-rules/city/${cityId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching city pricing rules:', error);
      // 如果API不可用，返回空数组而不是抛出错误
      return [];
    }
  }

  /**
   * Get region pricing rules (for a specific region)
   * @param {string} cityId - City ID
   * @param {string} regionId - Region ID
   * @returns {Promise<Array>} Array of pricing rules for the region
   */
  async getRegionPricing(cityId, regionId) {
    try {
      if (!cityId || !regionId) {
        throw new Error('City ID and Region ID are required');
      }

      const response = await this.apiClient.get(`/pricing-rules/region/${cityId}/${regionId}`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching region pricing:', error);
      return [];
    }
  }

  /**
   * Update region pricing rules
   * @param {string} cityId - City ID
   * @param {string} regionId - Region ID
   * @param {Array} pricingRules - Array of pricing rules
   * @returns {Promise<Object>} Update result
   */
  async updateRegionPricing(cityId, regionId, pricingRules) {
    try {
      const response = await this.apiClient.put(`/truck-delivery/pricing-rules/region/${cityId}/${regionId}`, {
        rules: pricingRules
      });

      this.clearCache(regionId);
      return response.data;
    } catch (error) {
      console.error('Error updating region pricing:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Copy pricing rules between regions
   * @param {string} sourceCityId - Source city ID
   * @param {string} sourceRegionId - Source region ID
   * @param {string} targetCityId - Target city ID
   * @param {string} targetRegionId - Target region ID
   * @param {Object} options - Copy options
   * @returns {Promise<Object>} Copy result
   */
  async copyPricingRules(sourceCityId, sourceRegionId, targetCityId, targetRegionId, options = {}) {
    try {
      const response = await this.apiClient.post('/pricing-rules/copy', {
        source: { cityId: sourceCityId, regionId: sourceRegionId },
        target: { cityId: targetCityId, regionId: targetRegionId },
        options
      });

      this.clearCache(targetRegionId);
      return response.data;
    } catch (error) {
      console.error('Error copying pricing rules:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Copy pricing rules from one region to multiple target regions
   * @param {string} sourceRegionId - Source region ID to copy rules from
   * @param {Array<string>} targetRegionIds - Array of target region IDs
   * @param {Object} options - Copy options
   * @returns {Promise<Object>} Copy operation result
   */
  async copyRulesToRegions(sourceRegionId, targetRegionIds, options = {}) {
    try {
      if (!sourceRegionId) {
        throw new Error('Source region ID is required');
      }

      if (!Array.isArray(targetRegionIds) || targetRegionIds.length === 0) {
        throw new Error('Target region IDs array is required and must not be empty');
      }

      // Remove source region from targets if included
      const filteredTargets = targetRegionIds.filter(id => id !== sourceRegionId);
      if (filteredTargets.length === 0) {
        throw new Error('No valid target regions found (source region cannot be target)');
      }

      console.log(`开始复制定价规则: ${sourceRegionId} -> ${filteredTargets.length} 个目标区域`);

      // Get source region rules to validate they exist
      const sourceRules = await this.getRulesByRegion(sourceRegionId, { isActive: true });
      if (!sourceRules || sourceRules.length === 0) {
        throw new Error(`No active pricing rules found in source region: ${sourceRegionId}`);
      }

      console.log(`找到 ${sourceRules.length} 条源区域定价规则`);

      // Prepare copy payload
      const copyPayload = {
        sourceRegionId,
        targetRegionIds: filteredTargets,
        options: {
          overwriteExisting: options.overwriteExisting || false,
          copyInactiveRules: options.copyInactiveRules || false,
          preserveOriginalIds: options.preserveOriginalIds || false,
          applyModifications: options.applyModifications || {},
          ...options
        }
      };

      // Validate modifications if provided
      if (options.applyModifications && Object.keys(options.applyModifications).length > 0) {
        console.log('验证修改配置...');
        const sampleRule = { ...sourceRules[0], ...options.applyModifications };
        const validation = this.validateRule(sampleRule);
        if (!validation.isValid) {
          throw new Error(`Modification validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
        }
      }

      // Send copy request
      const response = await this.apiClient.post('/pricing-rules/copy-to-regions', copyPayload);

      // Clear cache for all affected regions (source and targets)
      this.clearCache(sourceRegionId);
      filteredTargets.forEach(regionId => {
        this.clearCache(regionId);
      });

      const result = {
        success: true,
        sourceRegionId,
        targetRegionIds: filteredTargets,
        copiedRulesCount: sourceRules.length,
        results: response.data.results || [],
        summary: response.data.summary || {},
        timestamp: new Date().toISOString()
      };

      console.log(`✅ 定价规则复制完成: ${result.copiedRulesCount} 条规则复制到 ${filteredTargets.length} 个区域`);
      return result;

    } catch (error) {
      console.error('Error copying rules to regions:', error);
      throw this.handleError(error);
    }
  }
}

// Create singleton instance
const pricingService = new PricingService();

export default pricingService;