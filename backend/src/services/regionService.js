const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class RegionService {
  
  /**
   * 获取所有区域
   */
  async getAllRegions(options = {}) {
    const { includeInactive = false, includeStats = false } = options;
    
    try {
      const whereClause = includeInactive ? {} : { isActive: true };
      
      const regions = await prisma.deliveryRegion.findMany({
        where: whereClause,
        include: {
          postalCodes: true,
          weightRanges: {
            orderBy: { displayOrder: 'asc' }
          }
        },
        orderBy: { displayOrder: 'asc' }
      });

      // 转换数据格式以匹配前端期望的结构
      const formattedRegions = regions.map(region => ({
        id: region.id,
        name: region.name,
        description: region.description,
        isActive: region.isActive,
        colorCode: region.colorCode,
        displayOrder: region.displayOrder,
        createdBy: region.createdBy,
        createdAt: region.createdAt,
        updatedAt: region.updatedAt,
        // 将postalCodes转换为fsaCodes数组
        fsaCodes: region.postalCodes.map(pc => pc.fsaCode),
        postalCodes: region.postalCodes,
        weightRanges: region.weightRanges.map(wr => ({
          id: wr.id,
          regionId: wr.regionId,
          label: wr.rangeName,
          min: parseFloat(wr.minWeight),
          max: parseFloat(wr.maxWeight),
          price: parseFloat(wr.price),
          isActive: wr.isActive,
          displayOrder: wr.displayOrder,
          createdAt: wr.createdAt,
          updatedAt: wr.updatedAt
        })),
        lastUpdated: region.updatedAt
      }));

      return formattedRegions;
    } catch (error) {
      logger.error('获取所有区域失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取单个区域
   */
  async getRegionById(id) {
    try {
      const region = await prisma.deliveryRegion.findUnique({
        where: { id: id.toString() },
        include: {
          postalCodes: true,
          weightRanges: {
            orderBy: { displayOrder: 'asc' }
          }
        }
      });

      if (!region) {
        return null;
      }

      // 转换数据格式
      return {
        id: region.id,
        name: region.name,
        description: region.description,
        isActive: region.isActive,
        colorCode: region.colorCode,
        displayOrder: region.displayOrder,
        createdBy: region.createdBy,
        createdAt: region.createdAt,
        updatedAt: region.updatedAt,
        fsaCodes: region.postalCodes.map(pc => pc.fsaCode),
        postalCodes: region.postalCodes,
        weightRanges: region.weightRanges.map(wr => ({
          id: wr.id,
          regionId: wr.regionId,
          label: wr.rangeName,
          min: parseFloat(wr.minWeight),
          max: parseFloat(wr.maxWeight),
          price: parseFloat(wr.price),
          isActive: wr.isActive,
          displayOrder: wr.displayOrder,
          createdAt: wr.createdAt,
          updatedAt: wr.updatedAt
        })),
        lastUpdated: region.updatedAt
      };
    } catch (error) {
      logger.error(`获取区域 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 创建新区域
   */
  async createRegion(regionData, userId) {
    try {
      const region = await prisma.deliveryRegion.create({
        data: {
          ...regionData,
          createdBy: userId
        },
        include: {
          postalCodes: true,
          weightRanges: true
        }
      });

      return region;
    } catch (error) {
      logger.error('创建区域失败:', error);
      throw error;
    }
  }

  /**
   * 更新区域
   */
  async updateRegion(id, updateData, userId) {
    try {
      const region = await prisma.deliveryRegion.update({
        where: { id: id.toString() },
        data: updateData,
        include: {
          postalCodes: true,
          weightRanges: true
        }
      });

      return region;
    } catch (error) {
      logger.error(`更新区域 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 删除区域
   */
  async deleteRegion(id, userId) {
    try {
      await prisma.deliveryRegion.delete({
        where: { id: id.toString() }
      });
    } catch (error) {
      logger.error(`删除区域 ${id} 失败:`, error);
      throw error;
    }
  }

  /**
   * 获取区域的FSA列表
   */
  async getRegionFSAs(id, options = {}) {
    const { page = 1, limit = 50, search } = options;
    
    try {
      const whereClause = {
        regionId: id.toString()
      };

      if (search) {
        whereClause.fsaCode = {
          contains: search.toUpperCase()
        };
      }

      const [postalCodes, total] = await Promise.all([
        prisma.postalCode.findMany({
          where: whereClause,
          select: {
            fsaCode: true,
            province: true,
            city: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { fsaCode: 'asc' }
        }),
        prisma.postalCode.count({ where: whereClause })
      ]);

      return {
        fsas: postalCodes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error(`获取区域 ${id} FSA列表失败:`, error);
      throw error;
    }
  }

  /**
   * 获取区域的邮编列表（兼容方法）
   */
  async getRegionPostalCodes(id, options = {}) {
    return this.getRegionFSAs(id, options);
  }

  /**
   * 获取区域统计信息
   */
  async getRegionStats(id) {
    try {
      const [region, fsaCount, weightRangeCount] = await Promise.all([
        prisma.deliveryRegion.findUnique({
          where: { id: id.toString() }
        }),
        prisma.postalCode.count({
          where: { regionId: id.toString() }
        }),
        prisma.weightRange.count({
          where: { regionId: id.toString(), isActive: true }
        })
      ]);

      if (!region) {
        return null;
      }

      return {
        regionId: id,
        regionName: region.name,
        isActive: region.isActive,
        totalFSAs: fsaCount,
        activeWeightRanges: weightRangeCount,
        lastUpdated: region.updatedAt
      };
    } catch (error) {
      logger.error(`获取区域 ${id} 统计失败:`, error);
      throw error;
    }
  }

  /**
   * 分配FSAs到区域
   */
  async assignFSAsToRegion(regionId, fsaCodes, userId) {
    try {
      let assigned = 0;
      let failed = 0;
      const errors = [];

      for (const fsaCode of fsaCodes) {
        try {
          await prisma.postalCode.create({
            data: {
              regionId: regionId.toString(),
              fsaCode: fsaCode.toUpperCase(),
              isActive: true,
              createdBy: userId
            }
          });
          assigned++;
        } catch (error) {
          // 如果FSA已存在，尝试更新区域分配
          try {
            await prisma.postalCode.updateMany({
              where: { fsaCode: fsaCode.toUpperCase() },
              data: { regionId: regionId.toString() }
            });
            assigned++;
          } catch (updateError) {
            failed++;
            errors.push(`FSA ${fsaCode}: ${updateError.message}`);
          }
        }
      }

      return { assigned, failed, errors };
    } catch (error) {
      logger.error(`分配FSA到区域 ${regionId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 从区域移除FSAs
   */
  async removeFSAsFromRegion(regionId, fsaCodes, userId) {
    try {
      const result = await prisma.postalCode.deleteMany({
        where: {
          regionId: regionId.toString(),
          fsaCode: { in: fsaCodes.map(code => code.toUpperCase()) }
        }
      });

      return { removed: result.count };
    } catch (error) {
      logger.error(`从区域 ${regionId} 移除FSA失败:`, error);
      throw error;
    }
  }

  /**
   * 批量导入邮编
   */
  async batchImportPostalCodes(regionId, postalCodes, userId) {
    try {
      let success = 0;
      let failed = 0;
      const errors = [];

      for (const postalData of postalCodes) {
        try {
          const fsaCode = postalData.code ? postalData.code.substring(0, 3).toUpperCase() : null;
          
          if (!fsaCode) {
            failed++;
            errors.push(`Invalid postal code: ${postalData.code}`);
            continue;
          }

          await prisma.postalCode.upsert({
            where: {
              regionId_fsaCode: {
                regionId: regionId.toString(),
                fsaCode: fsaCode
              }
            },
            update: {
              province: postalData.province,
              city: postalData.city,
              isActive: true
            },
            create: {
              regionId: regionId.toString(),
              fsaCode: fsaCode,
              province: postalData.province,
              city: postalData.city,
              isActive: true,
              createdBy: userId
            }
          });
          success++;
        } catch (error) {
          failed++;
          errors.push(`${postalData.code}: ${error.message}`);
        }
      }

      return { success, failed, errors };
    } catch (error) {
      logger.error(`批量导入邮编到区域 ${regionId} 失败:`, error);
      throw error;
    }
  }
}

module.exports = new RegionService();