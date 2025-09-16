// Pricing Configuration Service
// 服务商定价配置管理服务

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PricingConfigService {
  /**
   * 获取服务商的定价模型列表
   * @param {string} providerId - 服务商ID
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 定价模型列表
   */
  async getPricingModels(providerId, filters = {}) {
    try {
      const where = { providerId };
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      if (filters.zones && filters.zones.length > 0) {
        // 查找包含指定zone的定价模型
        where.zones = {
          path: '$[*]',
          array_contains: filters.zones
        };
      }

      const models = await prisma.providerPricingModel.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return models;
    } catch (error) {
      console.error('Error fetching pricing models:', error);
      throw new Error('Failed to fetch pricing models');
    }
  }

  /**
   * 获取单个定价模型详情
   * @param {string} id - 定价模型ID
   * @returns {Promise<Object>} 定价模型详情
   */
  async getPricingModelById(id) {
    try {
      const model = await prisma.providerPricingModel.findUnique({
        where: { id },
        include: {
          provider: true,
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!model) {
        throw new Error('Pricing model not found');
      }

      return model;
    } catch (error) {
      console.error('Error fetching pricing model:', error);
      throw error;
    }
  }

  /**
   * 创建定价模型
   * @param {string} providerId - 服务商ID
   * @param {Object} data - 定价模型数据
   * @param {string} userId - 创建者ID
   * @returns {Promise<Object>} 创建的定价模型
   */
  async createPricingModel(providerId, data, userId) {
    try {
      // 验证服务商存在
      const provider = await prisma.provider.findUnique({
        where: { id: providerId }
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      // 验证配置格式
      this.validatePricingConfiguration(data.type, data.configuration);

      const model = await prisma.providerPricingModel.create({
        data: {
          providerId,
          name: data.name,
          type: data.type,
          unit: data.unit || 'PLATE',
          configuration: data.configuration,
          zones: data.zones || [],
          effectiveDate: new Date(data.effectiveDate),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          priority: data.priority || 100,
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdBy: userId
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      // 创建版本记录
      await this.createConfigVersion(providerId, 'pricing', null, model, userId);

      return model;
    } catch (error) {
      console.error('Error creating pricing model:', error);
      throw new Error('Failed to create pricing model');
    }
  }

  /**
   * 更新定价模型
   * @param {string} id - 定价模型ID
   * @param {Object} data - 更新数据
   * @param {string} userId - 操作者ID
   * @returns {Promise<Object>} 更新后的定价模型
   */
  async updatePricingModel(id, data, userId) {
    try {
      // 获取原始数据
      const oldModel = await this.getPricingModelById(id);
      
      // 验证配置格式（如果有更新）
      if (data.configuration) {
        this.validatePricingConfiguration(data.type || oldModel.type, data.configuration);
      }

      const updatedModel = await prisma.providerPricingModel.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          unit: data.unit,
          configuration: data.configuration,
          zones: data.zones,
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
          priority: data.priority,
          isActive: data.isActive,
          version: { increment: 1 }
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      // 创建版本记录
      await this.createConfigVersion(oldModel.providerId, 'pricing', oldModel, updatedModel, userId);

      return updatedModel;
    } catch (error) {
      console.error('Error updating pricing model:', error);
      throw new Error('Failed to update pricing model');
    }
  }

  /**
   * 删除定价模型
   * @param {string} id - 定价模型ID
   * @param {string} userId - 操作者ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deletePricingModel(id, userId) {
    try {
      const model = await this.getPricingModelById(id);
      
      await prisma.providerPricingModel.delete({
        where: { id }
      });

      // 记录删除版本
      await this.createConfigVersion(model.providerId, 'pricing', model, null, userId);

      return true;
    } catch (error) {
      console.error('Error deleting pricing model:', error);
      throw new Error('Failed to delete pricing model');
    }
  }

  /**
   * 获取服务商的附加费用列表
   * @param {string} providerId - 服务商ID
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 附加费用列表
   */
  async getSurcharges(providerId, filters = {}) {
    try {
      const where = { providerId };
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      const surcharges = await prisma.providerSurcharge.findMany({
        where,
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return surcharges;
    } catch (error) {
      console.error('Error fetching surcharges:', error);
      throw new Error('Failed to fetch surcharges');
    }
  }

  /**
   * 创建附加费用
   * @param {string} providerId - 服务商ID
   * @param {Object} data - 附加费用数据
   * @returns {Promise<Object>} 创建的附加费用
   */
  async createSurcharge(providerId, data) {
    try {
      const surcharge = await prisma.providerSurcharge.create({
        data: {
          providerId,
          code: data.code,
          name: data.name,
          description: data.description,
          type: data.type,
          calculation: data.calculation || 'FIXED',
          value: data.value,
          conditions: data.conditions || [],
          stackable: data.stackable !== undefined ? data.stackable : true,
          priority: data.priority || 100,
          effectiveDate: new Date(data.effectiveDate),
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });

      return surcharge;
    } catch (error) {
      console.error('Error creating surcharge:', error);
      if (error.code === 'P2002') {
        throw new Error('Surcharge code already exists for this provider');
      }
      throw new Error('Failed to create surcharge');
    }
  }

  /**
   * 更新附加费用
   * @param {string} id - 附加费用ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新后的附加费用
   */
  async updateSurcharge(id, data) {
    try {
      const updatedSurcharge = await prisma.providerSurcharge.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          calculation: data.calculation,
          value: data.value,
          conditions: data.conditions,
          stackable: data.stackable,
          priority: data.priority,
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
          isActive: data.isActive
        }
      });

      return updatedSurcharge;
    } catch (error) {
      console.error('Error updating surcharge:', error);
      throw new Error('Failed to update surcharge');
    }
  }

  /**
   * 删除附加费用
   * @param {string} id - 附加费用ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteSurcharge(id) {
    try {
      await prisma.providerSurcharge.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting surcharge:', error);
      throw new Error('Failed to delete surcharge');
    }
  }

  /**
   * 获取服务商的服务区域
   * @param {string} providerId - 服务商ID
   * @returns {Promise<Array>} 服务区域列表
   */
  async getServiceAreas(providerId) {
    try {
      const areas = await prisma.providerServiceArea.findMany({
        where: { 
          providerId,
          isActive: true 
        },
        orderBy: { priority: 'asc' }
      });

      return areas;
    } catch (error) {
      console.error('Error fetching service areas:', error);
      throw new Error('Failed to fetch service areas');
    }
  }

  /**
   * 创建服务区域
   * @param {string} providerId - 服务商ID
   * @param {Object} data - 服务区域数据
   * @returns {Promise<Object>} 创建的服务区域
   */
  async createServiceArea(providerId, data) {
    try {
      const area = await prisma.providerServiceArea.create({
        data: {
          providerId,
          zoneId: data.zoneId,
          zoneName: data.zoneName,
          regions: data.regions || [],
          fsaCodes: data.fsaCodes || [],
          postalCodeRanges: data.postalCodeRanges || [],
          cities: data.cities || [],
          priority: data.priority || 100,
          isActive: data.isActive !== undefined ? data.isActive : true
        }
      });

      return area;
    } catch (error) {
      console.error('Error creating service area:', error);
      if (error.code === 'P2002') {
        throw new Error('Zone ID already exists for this provider');
      }
      throw new Error('Failed to create service area');
    }
  }

  /**
   * 更新服务区域
   * @param {string} id - 服务区域ID
   * @param {Object} data - 更新数据
   * @returns {Promise<Object>} 更新后的服务区域
   */
  async updateServiceArea(id, data) {
    try {
      const updatedArea = await prisma.providerServiceArea.update({
        where: { id },
        data: {
          zoneName: data.zoneName,
          regions: data.regions,
          fsaCodes: data.fsaCodes,
          postalCodeRanges: data.postalCodeRanges,
          cities: data.cities,
          priority: data.priority,
          isActive: data.isActive
        }
      });

      return updatedArea;
    } catch (error) {
      console.error('Error updating service area:', error);
      throw new Error('Failed to update service area');
    }
  }

  /**
   * 删除服务区域
   * @param {string} id - 服务区域ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteServiceArea(id) {
    try {
      await prisma.providerServiceArea.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      console.error('Error deleting service area:', error);
      throw new Error('Failed to delete service area');
    }
  }

  /**
   * 验证定价配置格式
   * @param {string} type - 定价类型
   * @param {Object} configuration - 配置对象
   * @throws {Error} 如果配置格式不正确
   */
  validatePricingConfiguration(type, configuration) {
    if (!configuration) {
      throw new Error('Configuration is required');
    }

    switch (type) {
      case 'WEIGHT_ZONE':
        if (!configuration.weightRanges || !configuration.zonePrices) {
          throw new Error('Weight zone configuration requires weightRanges and zonePrices');
        }
        break;

      case 'FIRST_CONT':
        if (!configuration.firstUnit || !configuration.continuationUnit) {
          throw new Error('First/continuation configuration requires firstUnit and continuationUnit');
        }
        if (!configuration.firstUnit.price || !configuration.continuationUnit.price) {
          throw new Error('First/continuation units must have price defined');
        }
        break;

      case 'FIXED_TABLE':
        if (!configuration.priceTable || !Array.isArray(configuration.priceTable)) {
          throw new Error('Fixed table configuration requires priceTable array');
        }
        break;

      case 'LINEAR':
        if (configuration.pricePerUnit === undefined) {
          throw new Error('Linear configuration requires pricePerUnit');
        }
        break;

      case 'TIERED':
        if (!configuration.tiers || !Array.isArray(configuration.tiers)) {
          throw new Error('Tiered configuration requires tiers array');
        }
        break;

      case 'CUSTOM':
        if (!configuration.formula) {
          throw new Error('Custom configuration requires formula');
        }
        break;

      default:
        throw new Error(`Unknown pricing type: ${type}`);
    }
  }

  /**
   * 创建配置版本记录
   * @param {string} providerId - 服务商ID
   * @param {string} configType - 配置类型
   * @param {Object} oldConfig - 旧配置
   * @param {Object} newConfig - 新配置
   * @param {string} userId - 用户ID
   */
  async createConfigVersion(providerId, configType, oldConfig, newConfig, userId) {
    try {
      const latestVersion = await prisma.providerConfigVersion.findFirst({
        where: {
          providerId,
          configType
        },
        orderBy: { version: 'desc' }
      });

      const nextVersion = latestVersion ? latestVersion.version + 1 : 1;

      await prisma.providerConfigVersion.create({
        data: {
          providerId,
          version: nextVersion,
          configType,
          configData: oldConfig || {},
          changeLog: this.generateChangeLog(oldConfig, newConfig),
          createdBy: userId
        }
      });
    } catch (error) {
      console.error('Error creating config version:', error);
      // 版本记录失败不应影响主要操作
    }
  }

  /**
   * 生成变更日志
   * @param {Object} oldConfig - 旧配置
   * @param {Object} newConfig - 新配置
   * @returns {string} 变更日志
   */
  generateChangeLog(oldConfig, newConfig) {
    if (!oldConfig) {
      return 'Initial configuration created';
    }
    if (!newConfig) {
      return 'Configuration deleted';
    }
    
    const changes = [];
    
    // 比较主要字段
    if (oldConfig.name !== newConfig.name) {
      changes.push(`Name changed from "${oldConfig.name}" to "${newConfig.name}"`);
    }
    if (oldConfig.type !== newConfig.type) {
      changes.push(`Type changed from "${oldConfig.type}" to "${newConfig.type}"`);
    }
    if (oldConfig.isActive !== newConfig.isActive) {
      changes.push(`Status changed to ${newConfig.isActive ? 'active' : 'inactive'}`);
    }
    
    return changes.length > 0 ? changes.join('; ') : 'Configuration updated';
  }

  /**
   * 复制定价模型
   * @param {string} sourceId - 源定价模型ID
   * @param {string} targetProviderId - 目标服务商ID
   * @param {string} userId - 操作者ID
   * @returns {Promise<Object>} 复制的定价模型
   */
  async copyPricingModel(sourceId, targetProviderId, userId) {
    try {
      const sourceModel = await this.getPricingModelById(sourceId);
      
      const copiedModel = await this.createPricingModel(targetProviderId, {
        name: `${sourceModel.name} (Copy)`,
        type: sourceModel.type,
        unit: sourceModel.unit,
        configuration: sourceModel.configuration,
        zones: sourceModel.zones,
        effectiveDate: new Date(),
        priority: sourceModel.priority,
        isActive: false // 默认不激活复制的模型
      }, userId);

      return copiedModel;
    } catch (error) {
      console.error('Error copying pricing model:', error);
      throw new Error('Failed to copy pricing model');
    }
  }
}

module.exports = new PricingConfigService();