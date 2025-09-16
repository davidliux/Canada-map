// Provider Service
// 服务商管理核心服务

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProviderService {
  /**
   * 获取服务商列表
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Array>} 服务商列表
   */
  async getProviders(filters = {}) {
    try {
      const where = {};
      
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.type) {
        where.type = filters.type;
      }
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const providers = await prisma.provider.findMany({
        where,
        include: {
          serviceAreas: {
            where: { isActive: true }
          },
          pricingModels: {
            where: { isActive: true },
            take: 5
          },
          surcharges: {
            where: { isActive: true },
            take: 5
          }
        },
        orderBy: [
          { priority: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return providers;
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw new Error('Failed to fetch providers');
    }
  }

  /**
   * 获取单个服务商详情
   * @param {string} id - 服务商ID
   * @returns {Promise<Object>} 服务商详情
   */
  async getProviderById(id) {
    try {
      const provider = await prisma.provider.findUnique({
        where: { id },
        include: {
          serviceAreas: true,
          pricingModels: {
            orderBy: { priority: 'asc' }
          },
          surcharges: {
            orderBy: { priority: 'asc' }
          },
          creator: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!provider) {
        throw new Error('Provider not found');
      }

      return provider;
    } catch (error) {
      console.error('Error fetching provider:', error);
      throw error;
    }
  }

  /**
   * 创建新服务商
   * @param {Object} data - 服务商数据
   * @param {string} userId - 创建者ID
   * @returns {Promise<Object>} 创建的服务商
   */
  async createProvider(data, userId) {
    try {
      const provider = await prisma.provider.create({
        data: {
          code: data.code,
          name: data.name,
          type: data.type || 'EXPRESS',
          status: data.status || 'PENDING',
          description: data.description,
          contactInfo: data.contactInfo || {},
          capabilities: data.capabilities || [],
          businessRules: data.businessRules || {},
          integration: data.integration || {},
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

      // 记录审计日志
      await this.logAudit('CREATE', provider.id, null, provider, userId);

      return provider;
    } catch (error) {
      console.error('Error creating provider:', error);
      if (error.code === 'P2002') {
        throw new Error('Provider code already exists');
      }
      throw new Error('Failed to create provider');
    }
  }

  /**
   * 更新服务商信息
   * @param {string} id - 服务商ID
   * @param {Object} data - 更新数据
   * @param {string} userId - 操作者ID
   * @returns {Promise<Object>} 更新后的服务商
   */
  async updateProvider(id, data, userId) {
    try {
      // 获取原始数据用于审计
      const oldProvider = await this.getProviderById(id);
      
      const updatedProvider = await prisma.provider.update({
        where: { id },
        data: {
          name: data.name,
          type: data.type,
          status: data.status,
          description: data.description,
          contactInfo: data.contactInfo,
          capabilities: data.capabilities,
          businessRules: data.businessRules,
          integration: data.integration,
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

      // 记录审计日志
      await this.logAudit('UPDATE', id, oldProvider, updatedProvider, userId);

      // 创建配置版本记录
      await this.createConfigVersion(id, 'provider', oldProvider, updatedProvider, userId);

      return updatedProvider;
    } catch (error) {
      console.error('Error updating provider:', error);
      throw new Error('Failed to update provider');
    }
  }

  /**
   * 删除服务商
   * @param {string} id - 服务商ID
   * @param {string} userId - 操作者ID
   * @returns {Promise<boolean>} 删除结果
   */
  async deleteProvider(id, userId) {
    try {
      // 检查是否有关联的报价
      const quoteCount = await prisma.providerQuote.count({
        where: { providerId: id }
      });

      if (quoteCount > 0) {
        throw new Error('Cannot delete provider with existing quotes');
      }

      const provider = await this.getProviderById(id);
      
      await prisma.provider.delete({
        where: { id }
      });

      // 记录审计日志
      await this.logAudit('DELETE', id, provider, null, userId);

      return true;
    } catch (error) {
      console.error('Error deleting provider:', error);
      throw error;
    }
  }

  /**
   * 激活服务商
   * @param {string} id - 服务商ID
   * @param {string} userId - 操作者ID
   * @returns {Promise<Object>} 更新后的服务商
   */
  async activateProvider(id, userId) {
    try {
      const oldProvider = await this.getProviderById(id);
      
      const provider = await prisma.provider.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          isActive: true
        }
      });

      await this.logAudit('ACTIVATE', id, oldProvider, provider, userId);
      
      return provider;
    } catch (error) {
      console.error('Error activating provider:', error);
      throw new Error('Failed to activate provider');
    }
  }

  /**
   * 停用服务商
   * @param {string} id - 服务商ID
   * @param {string} userId - 操作者ID
   * @returns {Promise<Object>} 更新后的服务商
   */
  async deactivateProvider(id, userId) {
    try {
      const oldProvider = await this.getProviderById(id);
      
      const provider = await prisma.provider.update({
        where: { id },
        data: {
          status: 'INACTIVE',
          isActive: false
        }
      });

      await this.logAudit('DEACTIVATE', id, oldProvider, provider, userId);
      
      return provider;
    } catch (error) {
      console.error('Error deactivating provider:', error);
      throw new Error('Failed to deactivate provider');
    }
  }

  /**
   * 获取可用的服务商（根据地址）
   * @param {Object} address - 地址信息
   * @returns {Promise<Array>} 可用的服务商列表
   */
  async getAvailableProviders(address) {
    try {
      // 获取所有激活的服务商
      const providers = await prisma.provider.findMany({
        where: {
          status: 'ACTIVE',
          isActive: true
        },
        include: {
          serviceAreas: {
            where: { isActive: true }
          }
        },
        orderBy: { priority: 'asc' }
      });

      // 过滤出服务该地址的服务商
      const availableProviders = [];
      
      for (const provider of providers) {
        const servesArea = await this.checkServiceArea(provider, address);
        if (servesArea) {
          availableProviders.push(provider);
        }
      }

      return availableProviders;
    } catch (error) {
      console.error('Error getting available providers:', error);
      throw new Error('Failed to get available providers');
    }
  }

  /**
   * 检查服务商是否服务特定区域
   * @param {Object} provider - 服务商
   * @param {Object} address - 地址信息
   * @returns {Promise<boolean>} 是否服务该区域
   */
  async checkServiceArea(provider, address) {
    try {
      if (!provider.serviceAreas || provider.serviceAreas.length === 0) {
        return false;
      }

      for (const area of provider.serviceAreas) {
        // 检查FSA代码
        if (address.fsaCode && area.fsaCodes) {
          const fsaCodes = Array.isArray(area.fsaCodes) ? area.fsaCodes : JSON.parse(area.fsaCodes);
          if (fsaCodes.includes(address.fsaCode)) {
            return true;
          }
        }

        // 检查城市
        if (address.city && area.cities) {
          const cities = Array.isArray(area.cities) ? area.cities : JSON.parse(area.cities);
          if (cities.includes(address.city)) {
            return true;
          }
        }

        // 检查邮编范围
        if (address.postalCode && area.postalCodeRanges) {
          const ranges = Array.isArray(area.postalCodeRanges) 
            ? area.postalCodeRanges 
            : JSON.parse(area.postalCodeRanges);
          
          for (const range of ranges) {
            if (this.isPostalCodeInRange(address.postalCode, range)) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking service area:', error);
      return false;
    }
  }

  /**
   * 检查邮编是否在范围内
   * @param {string} postalCode - 邮编
   * @param {Object} range - 范围对象
   * @returns {boolean} 是否在范围内
   */
  isPostalCodeInRange(postalCode, range) {
    // 简单的字符串比较，实际可能需要更复杂的逻辑
    return postalCode >= range.start && postalCode <= range.end;
  }

  /**
   * 记录审计日志
   * @param {string} action - 操作类型
   * @param {string} providerId - 服务商ID
   * @param {Object} oldValue - 旧值
   * @param {Object} newValue - 新值
   * @param {string} userId - 用户ID
   */
  async logAudit(action, providerId, oldValue, newValue, userId) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: `PROVIDER_${action}`,
          tableName: 'providers',
          recordId: providerId,
          oldValues: oldValue ? JSON.stringify(oldValue) : null,
          newValues: newValue ? JSON.stringify(newValue) : null
        }
      });
    } catch (error) {
      console.error('Error logging audit:', error);
      // 审计日志失败不应影响主要操作
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
      // 获取最新版本号
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
          configData: oldConfig,
          changeLog: `Updated from version ${nextVersion - 1}`,
          createdBy: userId
        }
      });
    } catch (error) {
      console.error('Error creating config version:', error);
      // 版本记录失败不应影响主要操作
    }
  }

  /**
   * 获取服务商统计信息
   * @param {string} providerId - 服务商ID
   * @returns {Promise<Object>} 统计信息
   */
  async getProviderStats(providerId) {
    try {
      const [
        serviceAreaCount,
        pricingModelCount,
        surchargeCount,
        quoteCount,
        recentQuotes
      ] = await Promise.all([
        prisma.providerServiceArea.count({
          where: { providerId, isActive: true }
        }),
        prisma.providerPricingModel.count({
          where: { providerId, isActive: true }
        }),
        prisma.providerSurcharge.count({
          where: { providerId, isActive: true }
        }),
        prisma.providerQuote.count({
          where: { providerId }
        }),
        prisma.providerQuote.findMany({
          where: { providerId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            quoteNumber: true,
            totalPrice: true,
            currency: true,
            createdAt: true
          }
        })
      ]);

      return {
        serviceAreaCount,
        pricingModelCount,
        surchargeCount,
        quoteCount,
        recentQuotes
      };
    } catch (error) {
      console.error('Error getting provider stats:', error);
      throw new Error('Failed to get provider statistics');
    }
  }
}

module.exports = new ProviderService();