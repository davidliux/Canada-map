// Truck Pricing API Routes
// For the dynamic-pricing-config specification

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Middleware for authentication (if needed)
const authenticateUser = (req, res, next) => {
  // TODO: Implement authentication logic
  // For now, just pass through
  req.userId = req.headers['user-id'] || 'system';
  next();
};

// Middleware for rate limiting
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Apply rate limiting to all routes
router.use(apiLimiter);

/**
 * GET /api/v1/truck-delivery/pricing-rules
 * Get pricing rules by region or other filters
 */
router.get('/pricing-rules', authenticateUser, async (req, res) => {
  try {
    const { 
      regionId, 
      isActive = true, 
      currency, 
      page = 1, 
      limit = 20 
    } = req.query;

    const where = {};
    if (regionId) where.regionId = regionId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (currency) where.currency = currency;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rules, total] = await Promise.all([
      prisma.truckPricingRule.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          priceTiers: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      }),
      prisma.truckPricingRule.count({ where })
    ]);

    res.json({
      rules,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
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
 * Get a specific pricing rule by ID
 */
router.get('/pricing-rules/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const rule = await prisma.truckPricingRule.findUnique({
      where: { id },
      include: {
        priceTiers: {
          orderBy: { sortOrder: 'asc' }
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

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
 * Create a new pricing rule
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

    // Validate required fields
    if (!regionId || !name || !baseConfig || !incrementConfig || !vehicleConfig) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['regionId', 'name', 'baseConfig', 'incrementConfig', 'vehicleConfig']
      });
    }

    // Create the pricing rule
    const rule = await prisma.truckPricingRule.create({
      data: {
        regionId,
        name,
        baseConfig,
        incrementConfig,
        vehicleConfig,
        currency,
        isActive,
        createdBy: req.userId,
        version: 1
      }
    });

    // Create audit log entry
    await prisma.truckPriceAudit.create({
      data: {
        ruleId: rule.id,
        userId: req.userId,
        action: 'CREATE',
        newValue: rule,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

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
 * Update pricing rules for a specific region
 */
router.put('/pricing-rules/region/:cityId/:regionId', authenticateUser, async (req, res) => {
  try {
    const { cityId, regionId } = req.params;
    const { rules } = req.body;

    // Delete existing rules for this region
    await prisma.truckPricingRule.deleteMany({
      where: { 
        cityId,
        regionId 
      }
    });

    // Create new rules
    const createdRules = [];
    for (const rule of rules) {
      const createdRule = await prisma.truckPricingRule.create({
        data: {
          ...rule,
          cityId,
          regionId,
          userId: req.userId,
          version: 1,
          status: rule.status || 'active'
        }
      });
      createdRules.push(createdRule);
    }

    // Create audit log entry
    await prisma.truckPriceAudit.create({
      data: {
        ruleId: `${cityId}-${regionId}`,
        userId: req.userId,
        action: 'BULK_UPDATE',
        newValue: { rules: createdRules },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json({
      success: true,
      data: createdRules
    });
  } catch (error) {
    console.error('Error updating region pricing rules:', error);
    res.status(500).json({ 
      error: 'Failed to update region pricing rules',
      message: error.message 
    });
  }
});

/**
 * PUT /api/v1/truck-delivery/pricing-rules/:id
 * Update an existing pricing rule
 */
router.put('/pricing-rules/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Get existing rule for audit log
    const existingRule = await prisma.truckPricingRule.findUnique({
      where: { id }
    });

    if (!existingRule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }

    // Update the rule and increment version
    const updatedRule = await prisma.truckPricingRule.update({
      where: { id },
      data: {
        ...updates,
        version: { increment: 1 },
        updatedAt: new Date()
      }
    });

    // Create audit log entry
    await prisma.truckPriceAudit.create({
      data: {
        ruleId: id,
        userId: req.userId,
        action: 'UPDATE',
        oldValue: existingRule,
        newValue: updatedRule,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

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
 * Delete a pricing rule
 */
router.delete('/pricing-rules/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Get existing rule for audit log
    const existingRule = await prisma.truckPricingRule.findUnique({
      where: { id }
    });

    if (!existingRule) {
      return res.status(404).json({ error: 'Pricing rule not found' });
    }

    // Soft delete by setting isActive to false
    const deletedRule = await prisma.truckPricingRule.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Create audit log entry
    await prisma.truckPriceAudit.create({
      data: {
        ruleId: id,
        userId: req.userId,
        action: 'DELETE',
        oldValue: existingRule,
        newValue: deletedRule,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

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
 * Activate or deactivate a pricing rule
 */
router.patch('/pricing-rules/:id/status', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const updatedRule = await prisma.truckPricingRule.update({
      where: { id },
      data: {
        isActive,
        updatedAt: new Date()
      }
    });

    // Create audit log entry
    await prisma.truckPriceAudit.create({
      data: {
        ruleId: id,
        userId: req.userId,
        action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
        newValue: { isActive },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    res.json(updatedRule);
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
 * Calculate price for a given plate count
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

    // Get the active pricing rule for the region
    let rule;
    if (ruleId) {
      rule = await prisma.truckPricingRule.findUnique({
        where: { id: ruleId }
      });
    } else {
      rule = await prisma.truckPricingRule.findFirst({
        where: {
          regionId,
          isActive: true,
          currency
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!rule) {
      return res.status(404).json({ 
        error: 'No active pricing rule found for this region' 
      });
    }

    // Import calculation engine
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
 * POST /api/v1/truck-delivery/calculate-price-batch
 * Calculate prices for multiple plate counts
 */
router.post('/calculate-price-batch', async (req, res) => {
  try {
    const { regionId, plateCounts, ruleId, currency = 'CAD' } = req.body;

    if (!regionId || !plateCounts || !Array.isArray(plateCounts)) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['regionId', 'plateCounts (array)']
      });
    }

    // Get the pricing rule
    let rule;
    if (ruleId) {
      rule = await prisma.truckPricingRule.findUnique({
        where: { id: ruleId }
      });
    } else {
      rule = await prisma.truckPricingRule.findFirst({
        where: {
          regionId,
          isActive: true,
          currency
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!rule) {
      return res.status(404).json({ 
        error: 'No active pricing rule found for this region' 
      });
    }

    // Calculate prices for all plate counts
    const { calculatePrice } = require('./priceCalculationHelper');
    const calculations = plateCounts.map(plateCount => 
      calculatePrice(plateCount, rule)
    );

    res.json(calculations);
  } catch (error) {
    console.error('Error calculating batch prices:', error);
    res.status(500).json({ 
      error: 'Failed to calculate batch prices',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/truck-delivery/pricing-rules/:id/audit
 * Get audit log for a pricing rule
 */
router.get('/pricing-rules/:id/audit', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      startDate, 
      endDate, 
      userId, 
      page = 1, 
      limit = 50 
    } = req.query;

    const where = { ruleId: id };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    
    if (userId) where.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.truckPriceAudit.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      }),
      prisma.truckPriceAudit.count({ where })
    ]);

    res.json({
      logs,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ 
      error: 'Failed to fetch audit log',
      message: error.message 
    });
  }
});

/**
 * GET /api/v1/truck-delivery/pricing-rules/export
 * Export pricing configuration for a region
 */
router.get('/pricing-rules/export', authenticateUser, async (req, res) => {
  try {
    const { regionId } = req.query;

    if (!regionId) {
      return res.status(400).json({ error: 'regionId is required' });
    }

    const rules = await prisma.truckPricingRule.findMany({
      where: { regionId },
      include: {
        priceTiers: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    const exportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: req.userId,
      configurations: [{
        regionId,
        regionName: regionId, // TODO: Get actual region name
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
 * Import pricing configuration
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
            // Check if rule exists
            const existing = await prisma.truckPricingRule.findFirst({
              where: {
                regionId,
                name: rule.name
              }
            });

            if (existing && !overwrite) {
              skipped++;
              continue;
            }

            if (existing && overwrite) {
              // Update existing rule
              await prisma.truckPricingRule.update({
                where: { id: existing.id },
                data: {
                  baseConfig: rule.baseConfig,
                  incrementConfig: rule.incrementConfig,
                  vehicleConfig: rule.vehicleConfig,
                  currency: rule.currency,
                  isActive: rule.isActive,
                  version: { increment: 1 }
                }
              });
            } else {
              // Create new rule
              await prisma.truckPricingRule.create({
                data: {
                  regionId,
                  name: rule.name,
                  baseConfig: rule.baseConfig,
                  incrementConfig: rule.incrementConfig,
                  vehicleConfig: rule.vehicleConfig,
                  currency: rule.currency || 'CAD',
                  isActive: rule.isActive !== false,
                  createdBy: req.userId,
                  version: 1
                }
              });
            }
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
 * Get available pricing templates
 */
router.get('/pricing-templates', async (req, res) => {
  try {
    // Return predefined templates
    const templates = [
      {
        id: 'standard',
        name: 'Standard Pricing',
        description: 'Basic pricing with moderate increments',
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
        name: 'Volume Discount',
        description: 'Lower increments for high volume',
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
      },
      {
        id: 'premium',
        name: 'Premium Service',
        description: 'Higher base price with percentage increments',
        category: 'premium',
        baseConfig: {
          plateRange: { start: 1, end: 1 },
          price: 250
        },
        incrementConfig: {
          startPlate: 2,
          type: 'percentage',
          value: 0.1
        },
        vehicleConfig: {
          maxPlatesPerVehicle: 6,
          overflowHandling: 'restart'
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

module.exports = router;