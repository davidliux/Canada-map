// Pricing Routes
// 定价配置API路由

const express = require('express');
const router = express.Router();
const pricingConfigService = require('../services/pricingConfigService');

/**
 * GET /api/v1/providers/:providerId/pricing-models
 * 获取服务商的定价模型列表
 */
router.get('/providers/:providerId/pricing-models', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { type, isActive, zones } = req.query;
    
    const filters = {
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      zones: zones ? zones.split(',') : undefined
    };

    const models = await pricingConfigService.getPricingModels(providerId, filters);
    
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('Error fetching pricing models:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pricing models'
    });
  }
});

/**
 * GET /api/v1/pricing-models/:id
 * 获取单个定价模型详情
 */
router.get('/pricing-models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const model = await pricingConfigService.getPricingModelById(id);
    
    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Error fetching pricing model:', error);
    
    if (error.message === 'Pricing model not found') {
      return res.status(404).json({
        success: false,
        error: 'Pricing model not found'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch pricing model'
    });
  }
});

/**
 * POST /api/v1/providers/:providerId/pricing-models
 * 创建定价模型
 */
router.post('/providers/:providerId/pricing-models', async (req, res) => {
  try {
    const { providerId } = req.params;
    const userId = req.user?.id;
    const modelData = req.body;

    // 验证必填字段
    if (!modelData.name || !modelData.type) {
      return res.status(400).json({
        success: false,
        error: 'Name and type are required'
      });
    }

    // 确保单位是板数
    if (!modelData.unit) {
      modelData.unit = 'PLATE';
    }

    const model = await pricingConfigService.createPricingModel(providerId, modelData, userId);
    
    res.status(201).json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Error creating pricing model:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create pricing model'
    });
  }
});

/**
 * PUT /api/v1/pricing-models/:id
 * 更新定价模型
 */
router.put('/pricing-models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    const model = await pricingConfigService.updatePricingModel(id, updateData, userId);
    
    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('Error updating pricing model:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update pricing model'
    });
  }
});

/**
 * DELETE /api/v1/pricing-models/:id
 * 删除定价模型
 */
router.delete('/pricing-models/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    await pricingConfigService.deletePricingModel(id, userId);
    
    res.json({
      success: true,
      message: 'Pricing model deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pricing model:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete pricing model'
    });
  }
});

/**
 * POST /api/v1/pricing-models/:id/copy
 * 复制定价模型
 */
router.post('/pricing-models/:id/copy', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetProviderId } = req.body;
    const userId = req.user?.id;

    if (!targetProviderId) {
      return res.status(400).json({
        success: false,
        error: 'Target provider ID is required'
      });
    }

    const copiedModel = await pricingConfigService.copyPricingModel(id, targetProviderId, userId);
    
    res.status(201).json({
      success: true,
      data: copiedModel
    });
  } catch (error) {
    console.error('Error copying pricing model:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to copy pricing model'
    });
  }
});

/**
 * GET /api/v1/providers/:providerId/surcharges
 * 获取服务商的附加费用列表
 */
router.get('/providers/:providerId/surcharges', async (req, res) => {
  try {
    const { providerId } = req.params;
    const { type, isActive } = req.query;
    
    const filters = {
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
    };

    const surcharges = await pricingConfigService.getSurcharges(providerId, filters);
    
    res.json({
      success: true,
      data: surcharges
    });
  } catch (error) {
    console.error('Error fetching surcharges:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch surcharges'
    });
  }
});

/**
 * POST /api/v1/providers/:providerId/surcharges
 * 创建附加费用
 */
router.post('/providers/:providerId/surcharges', async (req, res) => {
  try {
    const { providerId } = req.params;
    const surchargeData = req.body;

    // 验证必填字段
    if (!surchargeData.code || !surchargeData.name || !surchargeData.type) {
      return res.status(400).json({
        success: false,
        error: 'Code, name and type are required'
      });
    }

    const surcharge = await pricingConfigService.createSurcharge(providerId, surchargeData);
    
    res.status(201).json({
      success: true,
      data: surcharge
    });
  } catch (error) {
    console.error('Error creating surcharge:', error);
    
    if (error.message === 'Surcharge code already exists for this provider') {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create surcharge'
    });
  }
});

/**
 * PUT /api/v1/surcharges/:id
 * 更新附加费用
 */
router.put('/surcharges/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const surcharge = await pricingConfigService.updateSurcharge(id, updateData);
    
    res.json({
      success: true,
      data: surcharge
    });
  } catch (error) {
    console.error('Error updating surcharge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update surcharge'
    });
  }
});

/**
 * DELETE /api/v1/surcharges/:id
 * 删除附加费用
 */
router.delete('/surcharges/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pricingConfigService.deleteSurcharge(id);
    
    res.json({
      success: true,
      message: 'Surcharge deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting surcharge:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete surcharge'
    });
  }
});

/**
 * GET /api/v1/providers/:providerId/service-areas
 * 获取服务商的服务区域
 */
router.get('/providers/:providerId/service-areas', async (req, res) => {
  try {
    const { providerId } = req.params;
    
    const areas = await pricingConfigService.getServiceAreas(providerId);
    
    res.json({
      success: true,
      data: areas
    });
  } catch (error) {
    console.error('Error fetching service areas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch service areas'
    });
  }
});

/**
 * POST /api/v1/providers/:providerId/service-areas
 * 创建服务区域
 */
router.post('/providers/:providerId/service-areas', async (req, res) => {
  try {
    const { providerId } = req.params;
    const areaData = req.body;

    // 验证必填字段
    if (!areaData.zoneId || !areaData.zoneName) {
      return res.status(400).json({
        success: false,
        error: 'Zone ID and name are required'
      });
    }

    const area = await pricingConfigService.createServiceArea(providerId, areaData);
    
    res.status(201).json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Error creating service area:', error);
    
    if (error.message === 'Zone ID already exists for this provider') {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create service area'
    });
  }
});

/**
 * PUT /api/v1/service-areas/:id
 * 更新服务区域
 */
router.put('/service-areas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const area = await pricingConfigService.updateServiceArea(id, updateData);
    
    res.json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error('Error updating service area:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update service area'
    });
  }
});

/**
 * DELETE /api/v1/service-areas/:id
 * 删除服务区域
 */
router.delete('/service-areas/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pricingConfigService.deleteServiceArea(id);
    
    res.json({
      success: true,
      message: 'Service area deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service area:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete service area'
    });
  }
});

module.exports = router;