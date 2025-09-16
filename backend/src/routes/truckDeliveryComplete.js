/**
 * 卡车配送系统完整API路由
 * 提供城市、区域、价格的完整CRUD操作
 */

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== 城市管理 API ====================

/**
 * 获取所有城市列表
 * GET /api/v1/truck-delivery/cities
 */
router.get('/cities', async (req, res) => {
  try {
    const { includeInactive = false } = req.query;
    
    const cities = await prisma.truckDeliveryCity.findMany({
      where: includeInactive === 'true' ? {} : { isActive: true },
      include: {
        regions: {
          include: {
            fsaCodes: true,
            priceTable: {
              include: {
                priceRanges: true
              }
            }
          }
        }
      },
      orderBy: [
        { province: 'asc' },
        { name: 'asc' }
      ]
    });

    // 格式化响应数据
    const formattedCities = cities.map(city => ({
      id: city.id,
      name: city.name,
      province: city.province,
      themeColor: city.themeColor,
      isActive: city.isActive,
      metadata: {
        createdAt: city.createdAt,
        updatedAt: city.updatedAt,
        version: city.version
      },
      regions: city.regions.map(region => ({
        id: region.id,
        cityId: region.cityId,
        level: region.level,
        name: region.name,
        displayColor: region.displayColor,
        fsaCodes: region.fsaCodes.map(fsa => fsa.fsaCode),
        priceTable: region.priceTable ? {
          regionId: region.id,
          currency: region.priceTable.currency,
          effectiveDate: region.priceTable.effectiveDate,
          expiryDate: region.priceTable.expiryDate,
          prices: region.priceTable.priceRanges.map(range => ({
            id: range.rangeId,
            min: Number(range.minWeight),
            max: Number(range.maxWeight),
            label: range.label,
            price: Number(range.price),
            isActive: range.isActive
          }))
        } : {
          regionId: region.id,
          currency: 'CAD',
          prices: []
        },
        metadata: {
          createdAt: region.createdAt,
          updatedAt: region.updatedAt,
          version: region.version
        }
      }))
    }));

    res.json(formattedCities);
  } catch (error) {
    console.error('获取城市列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: '获取城市列表失败', details: error.message } 
    });
  }
});

/**
 * 获取单个城市详情
 * GET /api/v1/truck-delivery/cities/:cityId
 */
router.get('/cities/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    
    const city = await prisma.truckDeliveryCity.findUnique({
      where: { id: cityId },
      include: {
        regions: {
          include: {
            fsaCodes: true,
            priceTable: {
              include: {
                priceRanges: true
              }
            }
          }
        }
      }
    });

    if (!city) {
      return res.status(404).json({ 
        success: false, 
        error: { message: '城市不存在' } 
      });
    }

    // 格式化响应数据
    const formattedCity = {
      id: city.id,
      name: city.name,
      province: city.province,
      themeColor: city.themeColor,
      isActive: city.isActive,
      metadata: {
        createdAt: city.createdAt,
        updatedAt: city.updatedAt,
        version: city.version
      },
      regions: city.regions.map(region => ({
        id: region.id,
        cityId: region.cityId,
        level: region.level,
        name: region.name,
        displayColor: region.displayColor,
        fsaCodes: region.fsaCodes.map(fsa => fsa.fsaCode),
        priceTable: region.priceTable ? {
          regionId: region.id,
          currency: region.priceTable.currency,
          effectiveDate: region.priceTable.effectiveDate,
          expiryDate: region.priceTable.expiryDate,
          prices: region.priceTable.priceRanges.map(range => ({
            id: range.rangeId,
            min: Number(range.minWeight),
            max: Number(range.maxWeight),
            label: range.label,
            price: Number(range.price),
            isActive: range.isActive
          }))
        } : {
          regionId: region.id,
          currency: 'CAD',
          prices: []
        },
        metadata: {
          createdAt: region.createdAt,
          updatedAt: region.updatedAt,
          version: region.version
        }
      }))
    };

    res.json(formattedCity);
  } catch (error) {
    console.error('获取城市详情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: '获取城市详情失败', details: error.message } 
    });
  }
});

/**
 * 创建新城市
 * POST /api/v1/truck-delivery/cities
 */
router.post('/cities', async (req, res) => {
  try {
    const cityData = req.body;
    
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 创建城市
      const city = await tx.truckDeliveryCity.create({
        data: {
          id: cityData.id,
          name: cityData.name,
          province: cityData.province,
          themeColor: cityData.themeColor,
          isActive: cityData.isActive !== false,
          version: cityData.metadata?.version || 1
        }
      });

      // 创建区域和相关数据
      for (const regionData of (cityData.regions || [])) {
        // 创建区域
        const region = await tx.truckDeliveryRegion.create({
          data: {
            id: regionData.id,
            cityId: city.id,
            level: regionData.level,
            name: regionData.name,
            displayColor: regionData.displayColor,
            version: regionData.metadata?.version || 1
          }
        });

        // 创建FSA代码
        if (regionData.fsaCodes && regionData.fsaCodes.length > 0) {
          await tx.truckDeliveryFSA.createMany({
            data: regionData.fsaCodes.map(fsaCode => ({
              regionId: region.id,
              fsaCode: fsaCode
            }))
          });

          // 更新FSA索引
          await tx.truckDeliveryFSAIndex.createMany({
            data: regionData.fsaCodes.map(fsaCode => ({
              fsaCode: fsaCode,
              cityId: city.id,
              regionId: region.id
            })),
            skipDuplicates: true
          });
        }

        // 创建价格表
        if (regionData.priceTable && regionData.priceTable.prices.length > 0) {
          const priceTable = await tx.truckDeliveryPrice.create({
            data: {
              regionId: region.id,
              currency: regionData.priceTable.currency || 'CAD',
              effectiveDate: regionData.priceTable.effectiveDate ? new Date(regionData.priceTable.effectiveDate) : null,
              expiryDate: regionData.priceTable.expiryDate ? new Date(regionData.priceTable.expiryDate) : null
            }
          });

          // 创建价格区间
          await tx.truckDeliveryPriceRange.createMany({
            data: regionData.priceTable.prices.map(price => ({
              priceId: priceTable.id,
              rangeId: price.id,
              minWeight: price.min,
              maxWeight: price.max,
              label: price.label,
              price: price.price,
              isActive: price.isActive !== false
            }))
          });
        }
      }

      return city;
    });

    res.status(201).json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('创建城市失败:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: '创建城市失败', details: error.message } 
    });
  }
});

/**
 * 更新城市
 * PUT /api/v1/truck-delivery/cities/:cityId
 */
router.put('/cities/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const cityData = req.body;
    
    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 更新城市基本信息
      const city = await tx.truckDeliveryCity.update({
        where: { id: cityId },
        data: {
          name: cityData.name,
          province: cityData.province,
          themeColor: cityData.themeColor,
          isActive: cityData.isActive,
          version: { increment: 1 }
        }
      });

      // 删除旧的区域数据（级联删除会自动删除相关的FSA和价格）
      await tx.truckDeliveryRegion.deleteMany({
        where: { cityId: cityId }
      });

      // 删除旧的FSA索引
      await tx.truckDeliveryFSAIndex.deleteMany({
        where: { cityId: cityId }
      });

      // 重新创建区域和相关数据
      for (const regionData of (cityData.regions || [])) {
        // 创建区域
        const region = await tx.truckDeliveryRegion.create({
          data: {
            id: regionData.id,
            cityId: city.id,
            level: regionData.level,
            name: regionData.name,
            displayColor: regionData.displayColor,
            version: regionData.metadata?.version || 1
          }
        });

        // 创建FSA代码
        if (regionData.fsaCodes && regionData.fsaCodes.length > 0) {
          await tx.truckDeliveryFSA.createMany({
            data: regionData.fsaCodes.map(fsaCode => ({
              regionId: region.id,
              fsaCode: fsaCode
            }))
          });

          // 更新FSA索引
          await tx.truckDeliveryFSAIndex.createMany({
            data: regionData.fsaCodes.map(fsaCode => ({
              fsaCode: fsaCode,
              cityId: city.id,
              regionId: region.id
            })),
            skipDuplicates: true
          });
        }

        // 创建价格表
        if (regionData.priceTable && regionData.priceTable.prices.length > 0) {
          const priceTable = await tx.truckDeliveryPrice.create({
            data: {
              regionId: region.id,
              currency: regionData.priceTable.currency || 'CAD',
              effectiveDate: regionData.priceTable.effectiveDate ? new Date(regionData.priceTable.effectiveDate) : null,
              expiryDate: regionData.priceTable.expiryDate ? new Date(regionData.priceTable.expiryDate) : null
            }
          });

          // 创建价格区间
          await tx.truckDeliveryPriceRange.createMany({
            data: regionData.priceTable.prices.map(price => ({
              priceId: priceTable.id,
              rangeId: price.id,
              minWeight: price.min,
              maxWeight: price.max,
              label: price.label,
              price: price.price,
              isActive: price.isActive !== false
            }))
          });
        }
      }

      return city;
    });

    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('更新城市失败:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: '更新城市失败', details: error.message } 
    });
  }
});

/**
 * 删除城市
 * DELETE /api/v1/truck-delivery/cities/:cityId
 */
router.delete('/cities/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    
    await prisma.$transaction(async (tx) => {
      // 删除FSA索引
      await tx.truckDeliveryFSAIndex.deleteMany({
        where: { cityId: cityId }
      });

      // 删除城市（级联删除会自动删除相关的区域、FSA和价格）
      await tx.truckDeliveryCity.delete({
        where: { id: cityId }
      });
    });

    res.json({ 
      success: true, 
      message: '城市删除成功' 
    });
  } catch (error) {
    console.error('删除城市失败:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: '删除城市失败', details: error.message } 
    });
  }
});

// ==================== FSA查询 API ====================

/**
 * 根据FSA查找城市
 * GET /api/v1/truck-delivery/fsa/:fsaCode
 */
router.get('/fsa/:fsaCode', async (req, res) => {
  try {
    const { fsaCode } = req.params;
    
    const fsaIndex = await prisma.truckDeliveryFSAIndex.findUnique({
      where: { fsaCode: fsaCode.toUpperCase() }
    });

    if (!fsaIndex) {
      return res.status(404).json({ 
        success: false, 
        error: { message: 'FSA代码未找到' } 
      });
    }

    const city = await prisma.truckDeliveryCity.findUnique({
      where: { id: fsaIndex.cityId },
      include: {
        regions: {
          where: { id: fsaIndex.regionId },
          include: {
            priceTable: {
              include: {
                priceRanges: {
                  where: { isActive: true }
                }
              }
            }
          }
        }
      }
    });

    res.json({ 
      success: true, 
      data: {
        fsaCode: fsaCode,
        cityId: fsaIndex.cityId,
        cityName: city.name,
        regionId: fsaIndex.regionId,
        regionName: city.regions[0]?.name,
        regionLevel: city.regions[0]?.level,
        priceTable: city.regions[0]?.priceTable
      }
    });
  } catch (error) {
    console.error('查询FSA失败:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: '查询FSA失败', details: error.message } 
    });
  }
});

/**
 * 批量查询FSA
 * POST /api/v1/truck-delivery/fsa/batch
 */
router.post('/fsa/batch', async (req, res) => {
  try {
    const { fsaCodes } = req.body;
    
    if (!Array.isArray(fsaCodes)) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'fsaCodes必须是数组' } 
      });
    }

    const fsaIndexes = await prisma.truckDeliveryFSAIndex.findMany({
      where: { 
        fsaCode: { 
          in: fsaCodes.map(code => code.toUpperCase()) 
        } 
      }
    });

    const result = {};
    for (const index of fsaIndexes) {
      result[index.fsaCode] = {
        cityId: index.cityId,
        regionId: index.regionId
      };
    }

    res.json({ 
      success: true, 
      data: result 
    });
  } catch (error) {
    console.error('批量查询FSA失败:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: '批量查询FSA失败', details: error.message } 
    });
  }
});

// ==================== 数据迁移 API ====================

/**
 * 批量导入城市数据
 * POST /api/v1/truck-delivery/import
 */
router.post('/import', async (req, res) => {
  try {
    const { cities } = req.body;
    
    if (!Array.isArray(cities)) {
      return res.status(400).json({ 
        success: false, 
        error: { message: 'cities必须是数组' } 
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const cityData of cities) {
      try {
        await prisma.$transaction(async (tx) => {
          // 检查城市是否已存在
          const existingCity = await tx.truckDeliveryCity.findUnique({
            where: { id: cityData.id }
          });

          if (existingCity) {
            // 更新现有城市
            await tx.truckDeliveryCity.update({
              where: { id: cityData.id },
              data: {
                name: cityData.name,
                province: cityData.province,
                themeColor: cityData.themeColor,
                isActive: cityData.isActive !== false
              }
            });

            // 删除旧数据
            await tx.truckDeliveryRegion.deleteMany({
              where: { cityId: cityData.id }
            });
            await tx.truckDeliveryFSAIndex.deleteMany({
              where: { cityId: cityData.id }
            });
          } else {
            // 创建新城市
            await tx.truckDeliveryCity.create({
              data: {
                id: cityData.id,
                name: cityData.name,
                province: cityData.province,
                themeColor: cityData.themeColor,
                isActive: cityData.isActive !== false
              }
            });
          }

          // 创建区域和相关数据
          for (const regionData of (cityData.regions || [])) {
            const region = await tx.truckDeliveryRegion.create({
              data: {
                id: regionData.id,
                cityId: cityData.id,
                level: regionData.level,
                name: regionData.name,
                displayColor: regionData.displayColor
              }
            });

            // 创建FSA代码
            if (regionData.fsaCodes && regionData.fsaCodes.length > 0) {
              await tx.truckDeliveryFSA.createMany({
                data: regionData.fsaCodes.map(fsaCode => ({
                  regionId: region.id,
                  fsaCode: fsaCode
                }))
              });

              // 更新FSA索引
              await tx.truckDeliveryFSAIndex.createMany({
                data: regionData.fsaCodes.map(fsaCode => ({
                  fsaCode: fsaCode,
                  cityId: cityData.id,
                  regionId: region.id
                })),
                skipDuplicates: true
              });
            }

            // 创建价格表
            if (regionData.priceTable && regionData.priceTable.prices.length > 0) {
              const priceTable = await tx.truckDeliveryPrice.create({
                data: {
                  regionId: region.id,
                  currency: regionData.priceTable.currency || 'CAD'
                }
              });

              // 创建价格区间
              await tx.truckDeliveryPriceRange.createMany({
                data: regionData.priceTable.prices.map(price => ({
                  priceId: priceTable.id,
                  rangeId: price.id,
                  minWeight: price.min,
                  maxWeight: price.max,
                  label: price.label,
                  price: price.price,
                  isActive: price.isActive !== false
                }))
              });
            }
          }
        });

        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          cityId: cityData.id,
          cityName: cityData.name,
          error: error.message
        });
      }
    }

    res.json({ 
      success: true, 
      data: {
        totalCities: cities.length,
        successCount,
        errorCount,
        errors
      }
    });
  } catch (error) {
    console.error('批量导入失败:', error);
    res.status(500).json({ 
      success: false, 
      error: { message: '批量导入失败', details: error.message } 
    });
  }
});

module.exports = router;