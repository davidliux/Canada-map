const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean) || '*' }));
app.use(express.json());
app.use(compression());
app.use(morgan('dev'));

// Root route
app.get('/', (req, res) => {
  res.json({
    name: '加拿大快递配送区域地图系统 API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/api/v1/health',
      regions: '/api/v1/regions',
      calculatePrice: '/api/v1/calculate-price',
      pricingModes: '/api/v1/truck-delivery/pricing-modes'
    },
    documentation: '/api-docs',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// 添加卡车配送路由
const truckDeliveryRoutes = require('./routes/truckDelivery');
app.use('/api/v1/truck-delivery', truckDeliveryRoutes);

// 添加动态定价路由（使用模拟版本）
const truckPricingRoutes = require('./routes/truckPricingMock');
app.use('/api/v1/truck-delivery', truckPricingRoutes);

// 添加服务商管理路由
const providerRoutes = require('./routes/providers');
app.use('/api/v1/providers', providerRoutes);

// 添加板数定价路由
const skidPricingRoutes = require('./routes/skidPricing');
app.use('/api/v1/truck-delivery', skidPricingRoutes);

// 添加定价模式路由（新增的灵活定价策略）
const pricingModesRoutes = require('./routes/pricingModes');
app.use('/api/v1/truck-delivery', pricingModesRoutes);

// 添加新的价格配置V2路由（支持四种定价模式）
const truckPricingV2Routes = require('./routes/truckPricingV2');
app.use('/api/v1/truck-pricing', truckPricingV2Routes);

// Regions - read-only minimal
app.get('/api/v1/regions', async (req, res, next) => {
  try {
    const includeInactive = req.query.include_inactive === 'true';
    const regions = await prisma.deliveryRegion.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        postalCodes: true,
        weightRanges: true
      },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
    
    // Transform to include postalCodes as array of strings
    const transformedRegions = regions.map(region => ({
      ...region,
      postalCodes: region.postalCodes.map(pc => pc.fsaCode)
    }));
    
    res.json({ success: true, data: transformedRegions });
  } catch (err) {
    next(err);
  }
});

// Region detail - read-only minimal
app.get('/api/v1/regions/:regionId', async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const region = await prisma.deliveryRegion.findUnique({ where: { id: regionId } });
    if (!region) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Region not found' } });

    const [postalCodeCount, weightRangeCount, activePostalCodes, activeWeightRanges] = await Promise.all([
      prisma.postalCode.count({ where: { regionId } }),
      prisma.weightRange.count({ where: { regionId } }),
      prisma.postalCode.count({ where: { regionId, isActive: true } }),
      prisma.weightRange.count({ where: { regionId, isActive: true } }),
    ]);

    res.json({
      success: true,
      data: { ...region, postalCodeCount, weightRangeCount, activePostalCodes, activeWeightRanges },
    });
  } catch (err) {
    next(err);
  }
});

// Postal codes by region - read-only minimal
app.get('/api/v1/regions/:regionId/postal-codes', async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const { page = 1, limit = 50, search } = req.query;
    const take = Math.min(Number(limit) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = {
      regionId,
      ...(search ? { fsaCode: { contains: String(search).toUpperCase() } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.postalCode.findMany({ where, skip, take, orderBy: [{ fsaCode: 'asc' }] }),
      prisma.postalCode.count({ where }),
    ]);
    res.json({ success: true, data: { items, pagination: { page: Number(page) || 1, limit: take, total, totalPages: Math.ceil(total / take) } } });
  } catch (err) {
    next(err);
  }
});

// Weight ranges by region - read-only minimal
app.get('/api/v1/regions/:regionId/weight-ranges', async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const ranges = await prisma.weightRange.findMany({
      where: { regionId },
      orderBy: [{ displayOrder: 'asc' }, { minWeight: 'asc' }],
    });
    res.json({ success: true, data: ranges });
  } catch (err) {
    next(err);
  }
});

// Calculate price - read-only compute using weight ranges
app.post('/api/v1/calculate-price', async (req, res, next) => {
  try {
    const { regionId, weight } = req.body || {};
    const w = parseFloat(weight);
    if (!regionId || Number.isNaN(w)) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'regionId and weight are required' } });
    }
    const range = await prisma.weightRange.findFirst({
      where: { regionId, isActive: true, minWeight: { lte: w }, maxWeight: { gte: w } },
      orderBy: { minWeight: 'asc' },
    });
    if (!range) return res.json({ success: true, data: { price: 0, currency: 'CAD', weightRange: null } });
    res.json({ success: true, data: { price: Number(range.price), currency: 'CAD', weightRange: range } });
  } catch (err) {
    next(err);
  }
});

// Create new region
app.post('/api/v1/regions', async (req, res, next) => {
  try {
    const { id, name, isActive, postalCodes = [], weightRanges = [], prices = {} } = req.body;

    // Generate ID if not provided (max 10 chars)
    const regionId = id || `r${Date.now() % 1000000}`;

    // Create region
    const region = await prisma.deliveryRegion.create({
      data: {
        id: regionId,
        name: name || `区域${regionId}`,
        isActive: isActive !== undefined ? isActive : true,
        displayOrder: 999
      }
    });

    // Add postal codes if provided
    if (postalCodes && postalCodes.length > 0) {
      const postalCodeData = postalCodes.map(code => ({
        fsaCode: typeof code === 'string' ? code.substring(0, 3).toUpperCase() : code,
        regionId: region.id,
        isActive: true
      }));
      
      await prisma.postalCode.createMany({
        data: postalCodeData,
        skipDuplicates: true
      });
    }

    // Add weight ranges if provided
    if (weightRanges && weightRanges.length > 0) {
      const weightRangeData = weightRanges.map((range, index) => ({
        regionId: region.id,
        rangeName: range.name || range.rangeName || `${range.min || range.minWeight || 0}-${range.max || range.maxWeight || 0}kg`,
        minWeight: range.min || range.minWeight || 0,
        maxWeight: range.max || range.maxWeight || 0,
        price: range.price || 0,
        isActive: range.isActive !== false
      }));
      
      await prisma.weightRange.createMany({
        data: weightRangeData
      });
    }

    res.json({ success: true, data: region });
  } catch (err) {
    if (err.code === 'P2002') {
      // Unique constraint violation - region already exists
      return res.status(409).json({ 
        success: false, 
        error: { code: 'ALREADY_EXISTS', message: 'Region already exists' } 
      });
    }
    next(err);
  }
});

// Update region
app.put('/api/v1/regions/:regionId', async (req, res, next) => {
  try {
    const { regionId } = req.params;
    const { name, isActive, postalCodes, weightRanges, prices } = req.body;
    
    // Update region
    const region = await prisma.deliveryRegion.update({
      where: { id: regionId },
      data: {
        name: name || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    // Update postal codes if provided
    if (postalCodes !== undefined) {
      // Delete existing postal codes
      await prisma.postalCode.deleteMany({
        where: { regionId }
      });
      
      // Add new postal codes
      if (postalCodes.length > 0) {
        const postalCodeData = postalCodes.map(code => ({
          fsaCode: typeof code === 'string' ? code.substring(0, 3).toUpperCase() : code,
          regionId: regionId,
          isActive: true
        }));
        
        await prisma.postalCode.createMany({
          data: postalCodeData,
          skipDuplicates: true
        });
      }
    }

    // Update weight ranges if provided
    if (weightRanges !== undefined) {
      // Delete existing weight ranges
      await prisma.weightRange.deleteMany({
        where: { regionId }
      });
      
      // Add new weight ranges
      if (weightRanges.length > 0) {
        const weightRangeData = weightRanges.map((range, index) => ({
          regionId: regionId,
          rangeName: range.name || range.rangeName || `${range.min || range.minWeight || 0}-${range.max || range.maxWeight || 0}kg`,
          minWeight: range.min || range.minWeight || 0,
          maxWeight: range.max || range.maxWeight || 0,
          price: range.price || 0,
          isActive: range.isActive !== false
        }));
        
        await prisma.weightRange.createMany({
          data: weightRangeData
        });
      }
    }

    res.json({ success: true, data: region });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Region not found' } 
      });
    }
    next(err);
  }
});

// Delete region
app.delete('/api/v1/regions/:regionId', async (req, res, next) => {
  try {
    const { regionId } = req.params;
    
    // Delete related data first
    await prisma.postalCode.deleteMany({ where: { regionId } });
    await prisma.weightRange.deleteMany({ where: { regionId } });
    
    // Delete region
    await prisma.deliveryRegion.delete({
      where: { id: regionId }
    });
    
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'NOT_FOUND', message: 'Region not found' } 
      });
    }
    next(err);
  }
});

// Basic error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
});

const port = Number(process.env.PORT || 5050);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on http://localhost:${port}`);
});
