// Mock Truck Pricing API Routes
// 模拟实现，用于演示动态定价配置系统

const express = require('express');
const router = express.Router();

// 模拟数据存储
let pricingRules = new Map();
let ruleIdCounter = 1;

// 中间件
const authenticateUser = (req, res, next) => {
  req.userId = req.headers['user-id'] || 'system';
  next();
};

/**
 * GET /api/v1/truck-delivery/pricing-rules
 * 获取定价规则
 */
router.get('/pricing-rules', authenticateUser, async (req, res) => {
  try {
    const { regionId, isActive = true, page = 1, limit = 20 } = req.query;
    
    // 过滤规则
    let rules = Array.from(pricingRules.values());
    
    if (regionId) {
      rules = rules.filter(r => r.regionId === regionId);
    }
    
    if (isActive !== undefined) {
      const active = isActive === 'true' || isActive === true;
      rules = rules.filter(r => r.isActive === active);
    }
    
    // 分页
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginatedRules = rules.slice(start, start + parseInt(limit));
    
    res.json({
      rules: paginatedRules,
      total: rules.length,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(rules.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching pricing rules:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pricing rules',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/truck-delivery/pricing-rules/:id
 * 获取单个定价规则
 */
router.get('/pricing-rules/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const rule = pricingRules.get(id);
    
    if (!rule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }
    
    res.json(rule);
  } catch (error) {
    console.error('Error fetching pricing rule:', error);
    res.status(500).json({ 
      error: 'Failed to fetch pricing rule',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/truck-delivery/pricing-rules
 * 创建新的定价规则
 */
router.post('/pricing-rules', authenticateUser, async (req, res) => {
  try {
    const { 
      regionId, 
      name, 
      baseConfig, 
      incrementConfig, 
      vehicleConfig,
      currency = 'CAD',
      isActive = true
    } = req.body;
    
    // 验证必填字段
    if (!regionId || !name || !baseConfig || !incrementConfig || !vehicleConfig) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['regionId', 'name', 'baseConfig', 'incrementConfig', 'vehicleConfig']
      });
    }
    
    // 创建规则
    const rule = {
      id: `rule_${ruleIdCounter++}`,
      regionId,
      name,
      baseConfig,
      incrementConfig,
      vehicleConfig,
      currency,
      isActive,
      createdBy: req.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    pricingRules.set(rule.id, rule);
    res.status(201).json(rule);
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    res.status(500).json({ 
      error: 'Failed to create pricing rule',
      message: error.message 
    });
  }
});

/**
 * PUT /api/v1/truck-delivery/pricing-rules/region/:cityId/:regionId
 * 更新特定区域的定价规则
 */
router.put('/pricing-rules/region/:cityId/:regionId', authenticateUser, async (req, res) => {
  try {
    const { cityId, regionId } = req.params;
    const { rules } = req.body;

    // 模拟数据库操作
    console.log(`更新定价规则 - 城市: ${cityId}, 区域: ${regionId}`);
    
    // 创建模拟响应
    const createdRules = rules.map((rule, index) => ({
      id: `rule-${cityId}-${regionId}-${index}-${Date.now()}`,
      ...rule,
      cityId,
      regionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      status: rule.status || 'active'
    }));

    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 100));

    res.json({
      success: true,
      data: createdRules
    });
  } catch (error) {
    console.error('Mock Error - 更新区域定价规则失败:', error);
    res.status(500).json({ 
      error: '更新区域定价规则失败',
      message: error.message 
    });
  }
});

/**
 * PUT /api/v1/truck-delivery/pricing-rules/:id
 * 更新定价规则
 */
router.put('/pricing-rules/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const existingRule = pricingRules.get(id);
    
    if (!existingRule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }
    
    // 更新规则
    const updatedRule = {
      ...existingRule,
      ...req.body,
      id: existingRule.id, // 保持ID不变
      updatedAt: new Date().toISOString(),
      version: existingRule.version + 1
    };
    
    pricingRules.set(id, updatedRule);
    res.json(updatedRule);
  } catch (error) {
    console.error('Error updating pricing rule:', error);
    res.status(500).json({ 
      error: 'Failed to update pricing rule',
      message: error.message 
    });
  }
});

/**
 * DELETE /api/v1/truck-delivery/pricing-rules/:id
 * 删除定价规则
 */
router.delete('/pricing-rules/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!pricingRules.has(id)) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }
    
    // 软删除 - 只是标记为非活动
    const rule = pricingRules.get(id);
    rule.isActive = false;
    rule.updatedAt = new Date().toISOString();
    pricingRules.set(id, rule);
    
    res.json({ message: 'Pricing rule deleted successfully', id });
  } catch (error) {
    console.error('Error deleting pricing rule:', error);
    res.status(500).json({ 
      error: 'Failed to delete pricing rule',
      message: error.message 
    });
  }
});

/**
 * PATCH /api/v1/truck-delivery/pricing-rules/:id/status
 * 激活/停用定价规则
 */
router.patch('/pricing-rules/:id/status', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }
    
    const rule = pricingRules.get(id);
    if (!rule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }
    
    rule.isActive = isActive;
    rule.updatedAt = new Date().toISOString();
    pricingRules.set(id, rule);
    
    res.json(rule);
  } catch (error) {
    console.error('Error updating rule status:', error);
    res.status(500).json({ 
      error: 'Failed to update rule status',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/truck-delivery/calculate-price
 * 计算价格
 */
router.post('/calculate-price', async (req, res) => {
  try {
    const { regionId, plateCount, ruleId, currency = 'CAD' } = req.body;
    
    if (!regionId || !plateCount) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['regionId', 'plateCount']
      });
    }
    
    // 获取规则
    let rule;
    if (ruleId) {
      rule = pricingRules.get(ruleId);
    } else {
      // 查找该区域的活动规则
      const regionRules = Array.from(pricingRules.values())
        .filter(r => r.regionId === regionId && r.isActive && r.currency === currency);
      rule = regionRules[0];
    }
    
    if (!rule) {
      return res.status(404).json({ 
        error: 'No active pricing rule found for this region' 
      });
    }
    
    // 简单的价格计算
    const { calculatePrice } = require('./priceCalculationHelper');
    const calculation = calculatePrice(plateCount, rule);
    
    res.json(calculation);
  } catch (error) {
    console.error('Error calculating price:', error);
    res.status(500).json({ 
      error: 'Failed to calculate price',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/truck-delivery/pricing-rules/export
 * 导出配置
 */
router.get('/pricing-rules/export', authenticateUser, async (req, res) => {
  try {
    const { regionId } = req.query;
    
    if (!regionId) {
      return res.status(400).json({ error: 'regionId is required' });
    }
    
    const rules = Array.from(pricingRules.values())
      .filter(r => r.regionId === regionId);
    
    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: req.userId,
      configurations: [{
        regionId,
        regionName: regionId,
        rules
      }]
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting configuration:', error);
    res.status(500).json({ 
      error: 'Failed to export configuration',
      message: error.message 
    });
  }
});

/**
 * POST /api/v1/truck-delivery/pricing-rules/import
 * 导入配置
 */
router.post('/pricing-rules/import', authenticateUser, async (req, res) => {
  try {
    const { data, targetRegions, overwrite = false } = req.body;
    
    if (!data || !data.configurations) {
      return res.status(400).json({ 
        error: 'Invalid import data format' 
      });
    }
    
    let imported = 0;
    let skipped = 0;
    const errors = [];
    
    for (const config of data.configurations) {
      const regions = targetRegions || [config.regionId];
      
      for (const regionId of regions) {
        for (const rule of config.rules) {
          try {
            // 检查是否存在
            const existingRules = Array.from(pricingRules.values())
              .filter(r => r.regionId === regionId && r.name === rule.name);
            
            if (existingRules.length > 0 && !overwrite) {
              skipped++;
              continue;
            }
            
            // 创建新规则
            const newRule = {
              ...rule,
              id: `rule_${ruleIdCounter++}`,
              regionId,
              createdBy: req.userId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              version: 1
            };
            
            pricingRules.set(newRule.id, newRule);
            imported++;
          } catch (error) {
            errors.push(`Failed to import rule ${rule.name}: ${error.message}`);
          }
        }
      }
    }
    
    res.json({
      imported,
      skipped,
      errors,
      success: errors.length === 0
    });
  } catch (error) {
    console.error('Error importing configuration:', error);
    res.status(500).json({ 
      error: 'Failed to import configuration',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/truck-delivery/pricing-templates
 * 获取定价模板
 */
router.get('/pricing-templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'standard',
        name: '标准定价',
        description: '基础定价，适度增量',
        category: 'standard',
        baseConfig: {
          plateRange: { start: 1, end: 2 },
          price: 150
        },
        incrementConfig: {
          startPlate: 3,
          type: 'fixed',
          value: 20
        },
        vehicleConfig: {
          maxPlatesPerVehicle: 8,
          overflowHandling: 'restart'
        },
        isDefault: true
      },
      {
        id: 'volume',
        name: '批量优惠',
        description: '大批量订单优惠定价',
        category: 'volume',
        baseConfig: {
          plateRange: { start: 1, end: 3 },
          price: 200
        },
        incrementConfig: {
          startPlate: 4,
          type: 'tiered',
          tiers: [
            { plateRange: { start: 4, end: 10 }, incrementValue: 15 },
            { plateRange: { start: 11, end: 20 }, incrementValue: 10 },
            { plateRange: { start: 21, end: 100 }, incrementValue: 5 }
          ]
        },
        vehicleConfig: {
          maxPlatesPerVehicle: 10,
          priceCapPerVehicle: 500,
          overflowHandling: 'continue'
        },
        isDefault: false
      }
    ];
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch templates',
      message: error.message 
    });
  }
});

// 添加一些默认数据
function initializeDefaultData() {
  // Toronto 默认规则
  const torontoRule = {
    id: 'rule_default_1',
    regionId: 'toronto',
    name: 'Toronto 标准定价',
    isActive: true,
    currency: 'CAD',
    baseConfig: {
      plateRange: { start: 1, end: 2 },
      price: 150
    },
    incrementConfig: {
      startPlate: 3,
      type: 'fixed',
      value: 25
    },
    vehicleConfig: {
      maxPlatesPerVehicle: 8,
      priceCapPerVehicle: null,
      overflowHandling: 'restart'
    },
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1
  };
  
  pricingRules.set(torontoRule.id, torontoRule);
}

// 初始化默认数据
initializeDefaultData();

module.exports = router;