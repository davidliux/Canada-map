const regionService = require('../services/regionService');
const { cacheGet, cacheSet, cacheDel, getCacheKey } = require('../config/cache');
const logger = require('../utils/logger');

class RegionController {
  // 获取所有区域
  async getAllRegions(req, res, next) {
    try {
      const { includeInactive, includeStats } = req.query;
      
      // Try cache first
      const cacheKey = getCacheKey('regions', includeInactive ? 'all' : 'active');
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached });
      }
      
      const regions = await regionService.getAllRegions({
        includeInactive: includeInactive === 'true',
        includeStats: includeStats === 'true'
      });
      
      // Cache for 5 minutes
      await cacheSet(cacheKey, regions, 300);
      
      res.json({ success: true, data: regions });
    } catch (error) {
      next(error);
    }
  }

  // 获取单个区域详情
  async getRegionById(req, res, next) {
    try {
      const { id } = req.params;
      
      const region = await regionService.getRegionById(id);
      if (!region) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Region not found' }
        });
      }
      
      res.json({ success: true, data: region });
    } catch (error) {
      next(error);
    }
  }

  // 创建新区域
  async createRegion(req, res, next) {
    try {
      const regionData = req.body;
      const userId = req.user?.id;
      
      const region = await regionService.createRegion(regionData, userId);
      
      // Clear cache
      await cacheDel('postal:regions:*');
      
      res.status(201).json({
        success: true,
        data: region,
        message: 'Region created successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 更新区域
  async updateRegion(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const userId = req.user?.id;
      
      const region = await regionService.updateRegion(id, updateData, userId);
      
      // Clear cache
      await cacheDel('postal:regions:*');
      await cacheDel(`postal:region:${id}:*`);
      
      res.json({
        success: true,
        data: region,
        message: 'Region updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 删除区域
  async deleteRegion(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      await regionService.deleteRegion(id, userId);
      
      // Clear cache
      await cacheDel('postal:regions:*');
      await cacheDel(`postal:region:${id}:*`);
      
      res.json({
        success: true,
        message: 'Region deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // 获取区域的FSA列表
  async getRegionFSAs(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50, search } = req.query;
      
      const result = await regionService.getRegionFSAs(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // 获取区域的邮编列表
  async getRegionPostalCodes(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 100, search } = req.query;
      
      const result = await regionService.getRegionPostalCodes(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  // 获取区域统计信息
  async getRegionStats(req, res, next) {
    try {
      const { id } = req.params;
      
      // Try cache first
      const cacheKey = getCacheKey('region', id, 'stats');
      const cached = await cacheGet(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached });
      }
      
      const stats = await regionService.getRegionStats(id);
      
      // Cache for 10 minutes
      await cacheSet(cacheKey, stats, 600);
      
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }

  // 批量分配FSA到区域
  async assignFSAsToRegion(req, res, next) {
    try {
      const { id } = req.params;
      const { fsaCodes } = req.body;
      const userId = req.user?.id;
      
      if (!Array.isArray(fsaCodes) || fsaCodes.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'FSA codes array is required' }
        });
      }
      
      const result = await regionService.assignFSAsToRegion(id, fsaCodes, userId);
      
      // Clear cache
      await cacheDel(`postal:region:${id}:*`);
      
      res.json({
        success: true,
        data: result,
        message: `${result.assigned} FSAs assigned successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  // 从区域移除FSA
  async removeFSAsFromRegion(req, res, next) {
    try {
      const { id } = req.params;
      const { fsaCodes } = req.body;
      const userId = req.user?.id;
      
      if (!Array.isArray(fsaCodes) || fsaCodes.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'FSA codes array is required' }
        });
      }
      
      const result = await regionService.removeFSAsFromRegion(id, fsaCodes, userId);
      
      // Clear cache
      await cacheDel(`postal:region:${id}:*`);
      
      res.json({
        success: true,
        data: result,
        message: `${result.removed} FSAs removed successfully`
      });
    } catch (error) {
      next(error);
    }
  }

  // 批量导入邮编
  async batchImportPostalCodes(req, res, next) {
    try {
      const { id } = req.params;
      const { postalCodes } = req.body;
      const userId = req.user?.id;
      
      if (!Array.isArray(postalCodes) || postalCodes.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Postal codes array is required' }
        });
      }
      
      const result = await regionService.batchImportPostalCodes(id, postalCodes, userId);
      
      // Clear cache
      await cacheDel(`postal:region:${id}:*`);
      
      res.json({
        success: true,
        data: result,
        message: `Import completed: ${result.success} successful, ${result.failed} failed`
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RegionController();