// Provider Routes
// 服务商管理API路由

const express = require('express');
const router = express.Router();
// 暂时使用mock服务，因为数据库连接有问题
const providerService = require('../services/providerServiceMock');

/**
 * GET /api/providers
 * 获取服务商列表
 */
router.get('/', async (req, res) => {
  try {
    const { status, type, isActive, search, page = 1, limit = 20 } = req.query;
    
    const filters = {
      status,
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search
    };

    const providers = await providerService.getProviders(filters);
    
    // 简单分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProviders = providers.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedProviders,
      pagination: {
        total: providers.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(providers.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch providers'
    });
  }
});

/**
 * GET /api/providers/available
 * 根据地址获取可用服务商
 */
router.post('/available', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    const providers = await providerService.getAvailableProviders(address);
    
    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching available providers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available providers'
    });
  }
});

/**
 * GET /api/providers/:id
 * 获取服务商详情
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const provider = await providerService.getProviderById(id);
    
    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Error fetching provider:', error);
    
    if (error.message === 'Provider not found') {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch provider'
    });
  }
});

/**
 * GET /api/providers/:id/stats
 * 获取服务商统计信息
 */
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await providerService.getProviderStats(id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch provider statistics'
    });
  }
});

/**
 * POST /api/providers
 * 创建新服务商
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id; // 假设有认证中间件设置了req.user
    const providerData = req.body;

    // 验证必填字段
    if (!providerData.code || !providerData.name) {
      return res.status(400).json({
        success: false,
        error: 'Code and name are required'
      });
    }

    const provider = await providerService.createProvider(providerData, userId);
    
    res.status(201).json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Error creating provider:', error);
    
    if (error.message === 'Provider code already exists') {
      return res.status(409).json({
        success: false,
        error: 'Provider code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create provider'
    });
  }
});

/**
 * PUT /api/providers/:id
 * 更新服务商信息
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    const provider = await providerService.updateProvider(id, updateData, userId);
    
    res.json({
      success: true,
      data: provider
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update provider'
    });
  }
});

/**
 * DELETE /api/providers/:id
 * 删除服务商
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    await providerService.deleteProvider(id, userId);
    
    res.json({
      success: true,
      message: 'Provider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    
    if (error.message === 'Cannot delete provider with existing quotes') {
      return res.status(409).json({
        success: false,
        error: 'Cannot delete provider with existing quotes'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete provider'
    });
  }
});

/**
 * POST /api/providers/:id/activate
 * 激活服务商
 */
router.post('/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const provider = await providerService.activateProvider(id, userId);
    
    res.json({
      success: true,
      data: provider,
      message: 'Provider activated successfully'
    });
  } catch (error) {
    console.error('Error activating provider:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to activate provider'
    });
  }
});

/**
 * POST /api/providers/:id/deactivate
 * 停用服务商
 */
router.post('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const provider = await providerService.deactivateProvider(id, userId);
    
    res.json({
      success: true,
      data: provider,
      message: 'Provider deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating provider:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to deactivate provider'
    });
  }
});

/**
 * POST /api/providers/import
 * 批量导入服务商
 */
router.post('/import', async (req, res) => {
  try {
    const { providers } = req.body;
    const userId = req.user?.id;
    
    if (!Array.isArray(providers) || providers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid import data'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    for (const providerData of providers) {
      try {
        const provider = await providerService.createProvider(providerData, userId);
        results.success.push({
          code: provider.code,
          id: provider.id
        });
      } catch (error) {
        results.failed.push({
          code: providerData.code,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: results,
      message: `Imported ${results.success.length} providers, ${results.failed.length} failed`
    });
  } catch (error) {
    console.error('Error importing providers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to import providers'
    });
  }
});

/**
 * GET /api/providers/export
 * 导出服务商配置
 */
router.get('/export', async (req, res) => {
  try {
    const providers = await providerService.getProviders({ isActive: true });
    
    // 清理敏感信息
    const exportData = providers.map(provider => ({
      code: provider.code,
      name: provider.name,
      type: provider.type,
      description: provider.description,
      capabilities: provider.capabilities,
      businessRules: provider.businessRules,
      priority: provider.priority,
      serviceAreas: provider.serviceAreas.map(area => ({
        zoneId: area.zoneId,
        zoneName: area.zoneName,
        regions: area.regions,
        fsaCodes: area.fsaCodes,
        cities: area.cities
      })),
      pricingModels: provider.pricingModels.map(model => ({
        name: model.name,
        type: model.type,
        unit: model.unit,
        configuration: model.configuration,
        zones: model.zones
      })),
      surcharges: provider.surcharges.map(surcharge => ({
        code: surcharge.code,
        name: surcharge.name,
        type: surcharge.type,
        calculation: surcharge.calculation,
        value: surcharge.value,
        conditions: surcharge.conditions
      }))
    }));

    res.json({
      success: true,
      data: exportData,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting providers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export providers'
    });
  }
});

module.exports = router;