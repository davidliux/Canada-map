// Skid Pricing API Routes
// 板数定价接口 - 用于管理固定的板数价格表

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/v1/truck-delivery/skid-pricing/:cityId
 * 获取指定城市的板数定价数据
 */
router.get('/skid-pricing/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    console.log(`获取板数定价数据 - 城市ID: ${cityId}`);

    // 从数据库获取所有该城市的板数定价
    const pricingData = await prisma.skidPricing.findMany({
      where: {
        cityId: cityId,
        isActive: true
      }
    });

    // 将数据转换为前端需要的格式: {zoneId: {skidCount: price}}
    // 保持使用原始的zoneId作为键，不进行转换
    const formattedData = {};
    pricingData.forEach(item => {
      if (!formattedData[item.zoneId]) {
        formattedData[item.zoneId] = {};
      }
      formattedData[item.zoneId][item.skidCount] = parseFloat(item.price);
    });

    console.log(`成功获取板数定价数据 - 城市ID: ${cityId}, 数据条数: ${pricingData.length}`);
    res.json({
      success: true,
      data: formattedData,
      message: '获取板数定价数据成功'
    });
  } catch (error) {
    console.error('获取板数定价数据失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: '获取板数定价数据失败',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/v1/truck-delivery/skid-pricing/:cityId
 * 保存或更新指定城市的板数定价数据
 */
router.post('/skid-pricing/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const pricingData = req.body;

    console.log(`保存板数定价数据 - 城市ID: ${cityId}`);
    console.log('定价数据:', JSON.stringify(pricingData, null, 2));

    // 验证数据格式
    if (!pricingData || typeof pricingData !== 'object') {
      return res.status(400).json({
        success: false,
        error: '无效的定价数据格式'
      });
    }

    // 使用事务处理数据保存
    const result = await prisma.$transaction(async (tx) => {
      // 先删除该城市的所有旧数据（避免唯一约束冲突）
      const deleted = await tx.skidPricing.deleteMany({
        where: { cityId: cityId }
      });
      console.log(`已删除 ${deleted.count} 条旧板数定价数据`);

      // 准备批量插入的数据
      const dataToInsert = [];

      // 遍历所有区域和板数
      Object.keys(pricingData).forEach(zoneId => {
        if (zoneId !== 'updatedAt' && typeof pricingData[zoneId] === 'object') {
          Object.keys(pricingData[zoneId]).forEach(skidCount => {
            dataToInsert.push({
              cityId: cityId,
              zoneId: zoneId,
              skidCount: parseInt(skidCount),
              price: pricingData[zoneId][skidCount],
              currency: 'CAD',
              isActive: true
            });
          });
        }
      });

      // 批量创建新数据
      let created = { count: 0 };
      if (dataToInsert.length > 0) {
        created = await tx.skidPricing.createMany({
          data: dataToInsert
        });
        console.log(`成功创建 ${created.count} 条新板数定价数据`);
      }

      return { deleted: deleted.count, created: created.count };
    });

    console.log(`板数定价保存成功 - 城市ID: ${cityId}, 删除: ${result.deleted}, 创建: ${result.created}`);
    res.json({
      success: true,
      data: pricingData,
      message: `板数定价数据保存成功 (创建 ${result.created} 条记录)`,
      stats: result
    });
  } catch (error) {
    console.error('保存板数定价数据失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: '保存板数定价数据失败',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * PUT /api/v1/truck-delivery/skid-pricing/:cityId/:zoneId
 * 更新特定区域的板数定价
 */
router.put('/skid-pricing/:cityId/:zoneId', async (req, res) => {
  try {
    const { cityId, zoneId } = req.params;
    const zonePricing = req.body;

    console.log(`更新区域板数定价 - 城市ID: ${cityId}, 区域ID: ${zoneId}`);

    await prisma.$transaction(async (tx) => {
      // 先将该区域的旧数据标记为非活跃
      await tx.skidPricing.updateMany({
        where: {
          cityId: cityId,
          zoneId: zoneId
        },
        data: { isActive: false }
      });

      // 准备批量插入的数据
      const dataToInsert = [];

      Object.keys(zonePricing).forEach(skidCount => {
        if (skidCount !== 'updatedAt') {
          dataToInsert.push({
            cityId: cityId,
            zoneId: zoneId,
            skidCount: parseInt(skidCount),
            price: zonePricing[skidCount],
            currency: 'CAD',
            isActive: true
          });
        }
      });

      // 批量创建新数据
      if (dataToInsert.length > 0) {
        await tx.skidPricing.createMany({
          data: dataToInsert
        });
      }
    });

    res.json({
      success: true,
      data: zonePricing,
      message: '区域板数定价更新成功'
    });
  } catch (error) {
    console.error('更新区域板数定价失败:', error);
    res.status(500).json({
      success: false,
      error: '更新区域板数定价失败',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/truck-delivery/skid-pricing/:cityId/:zoneId
 * 删除特定区域的板数定价
 */
router.delete('/skid-pricing/:cityId/:zoneId', async (req, res) => {
  try {
    const { cityId, zoneId } = req.params;

    console.log(`删除区域板数定价 - 城市ID: ${cityId}, 区域ID: ${zoneId}`);

    // 将该区域的所有板数定价标记为非活跃
    const result = await prisma.skidPricing.updateMany({
      where: {
        cityId: cityId,
        zoneId: zoneId,
        isActive: true
      },
      data: { isActive: false }
    });

    if (result.count > 0) {
      res.json({
        success: true,
        message: `区域板数定价删除成功，影响${result.count}条记录`
      });
    } else {
      res.status(404).json({
        success: false,
        error: '未找到指定的区域板数定价'
      });
    }
  } catch (error) {
    console.error('删除区域板数定价失败:', error);
    res.status(500).json({
      success: false,
      error: '删除区域板数定价失败',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/truck-delivery/skid-pricing/:cityId/:zoneId/:skidCount
 * 获取特定板数的价格
 */
router.get('/skid-pricing/:cityId/:zoneId/:skidCount', async (req, res) => {
  try {
    const { cityId, zoneId, skidCount } = req.params;

    console.log(`获取板数价格 - 城市: ${cityId}, 区域: ${zoneId}, 板数: ${skidCount}`);

    const pricing = await prisma.skidPricing.findFirst({
      where: {
        cityId: cityId,
        zoneId: zoneId,
        skidCount: parseInt(skidCount),
        isActive: true
      }
    });

    if (pricing) {
      res.json({
        success: true,
        data: {
          cityId: pricing.cityId,
          zoneId: pricing.zoneId,
          skidCount: pricing.skidCount,
          price: parseFloat(pricing.price),
          currency: pricing.currency
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: '未找到指定板数的价格'
      });
    }
  } catch (error) {
    console.error('获取板数价格失败:', error);
    res.status(500).json({
      success: false,
      error: '获取板数价格失败',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/truck-delivery/zones/:zoneId/groups/:groupId/skid-pricing
 * 获取分组的板数定价数据
 */
router.get('/zones/:zoneId/groups/:groupId/skid-pricing', async (req, res) => {
  try {
    const { zoneId, groupId } = req.params;
    const { cityId } = req.query;

    console.log(`获取分组板数定价 - 区域: ${zoneId}, 分组: ${groupId}, 城市: ${cityId}`);

    const pricingData = await prisma.groupSkidPricing.findMany({
      where: {
        cityId: cityId || 'toronto',
        zoneId: zoneId,
        groupId: groupId,
        isActive: true
      }
    });

    // 转换为前端需要的格式
    const prices = {};
    pricingData.forEach(item => {
      prices[item.skidCount] = parseFloat(item.price);
    });

    res.json({
      success: true,
      data: {
        cityId: cityId || 'toronto',
        zoneId,
        groupId,
        prices
      }
    });
  } catch (error) {
    console.error('获取分组板数定价失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分组板数定价失败',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/truck-delivery/zones/:zoneId/groups/:groupId/skid-pricing
 * 保存分组的板数定价数据
 */
router.post('/zones/:zoneId/groups/:groupId/skid-pricing', async (req, res) => {
  try {
    const { zoneId, groupId } = req.params;
    const { cityId, prices } = req.body;

    console.log(`保存分组板数定价 - 区域: ${zoneId}, 分组: ${groupId}, 城市: ${cityId}`);
    console.log('价格数据:', prices);

    // 使用事务处理
    const result = await prisma.$transaction(async (tx) => {
      // 先删除旧数据
      await tx.groupSkidPricing.deleteMany({
        where: {
          cityId: cityId || 'toronto',
          zoneId: zoneId,
          groupId: groupId
        }
      });

      // 准备新数据
      const dataToInsert = [];
      Object.entries(prices).forEach(([skidCount, price]) => {
        if (price && price > 0) {
          dataToInsert.push({
            cityId: cityId || 'toronto',
            zoneId: zoneId,
            groupId: groupId,
            skidCount: skidCount === '16+' ? 17 : parseInt(skidCount),
            price: price,
            currency: 'CAD',
            isActive: true
          });
        }
      });

      // 批量插入
      if (dataToInsert.length > 0) {
        await tx.groupSkidPricing.createMany({
          data: dataToInsert
        });
      }

      return dataToInsert.length;
    });

    console.log(`成功保存 ${result} 条分组板数定价数据`);

    res.json({
      success: true,
      message: '分组板数定价已保存',
      count: result
    });
  } catch (error) {
    console.error('保存分组板数定价失败:', error);
    res.status(500).json({
      success: false,
      error: '保存分组板数定价失败',
      message: error.message
    });
  }
});

/**
 * DELETE /api/v1/truck-delivery/zones/:zoneId/groups/:groupId/skid-pricing
 * 删除分组的板数定价数据
 */
router.delete('/zones/:zoneId/groups/:groupId/skid-pricing', async (req, res) => {
  try {
    const { zoneId, groupId } = req.params;
    const { cityId } = req.query;

    console.log(`删除分组板数定价 - 区域: ${zoneId}, 分组: ${groupId}, 城市: ${cityId}`);

    const result = await prisma.groupSkidPricing.deleteMany({
      where: {
        cityId: cityId || 'toronto',
        zoneId: zoneId,
        groupId: groupId
      }
    });

    console.log(`成功删除 ${result.count} 条分组板数定价数据`);

    res.json({
      success: true,
      message: '分组板数定价已删除',
      count: result.count
    });
  } catch (error) {
    console.error('删除分组板数定价失败:', error);
    res.status(500).json({
      success: false,
      error: '删除分组板数定价失败',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/truck-delivery/skid-pricing/batch
 * 批量导入板数定价数据
 */
router.post('/skid-pricing/batch', async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: '批量数据必须是数组格式'
      });
    }

    // 使用事务处理批量导入
    const result = await prisma.$transaction(async (tx) => {
      // 按城市分组
      const citiesData = {};
      data.forEach(item => {
        if (!citiesData[item.cityId]) {
          citiesData[item.cityId] = [];
        }
        citiesData[item.cityId].push(item);
      });

      let totalImported = 0;

      // 处理每个城市的数据
      for (const cityId of Object.keys(citiesData)) {
        // 先将该城市的旧数据标记为非活跃
        await tx.skidPricing.updateMany({
          where: { cityId: cityId },
          data: { isActive: false }
        });

        // 准备插入数据
        const dataToInsert = citiesData[cityId].map(item => ({
          cityId: item.cityId,
          zoneId: item.zoneId,
          skidCount: parseInt(item.skidCount),
          price: item.price,
          currency: item.currency || 'CAD',
          isActive: true
        }));

        // 批量创建
        const created = await tx.skidPricing.createMany({
          data: dataToInsert
        });

        totalImported += created.count;
      }

      return totalImported;
    });

    res.json({
      success: true,
      data: {
        importedCount: result,
        totalRecords: data.length
      },
      message: `成功导入 ${result} 条板数定价记录`
    });
  } catch (error) {
    console.error('批量导入板数定价失败:', error);
    res.status(500).json({
      success: false,
      error: '批量导入板数定价失败',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/truck-delivery/skid-pricing/export/:cityId
 * 导出城市的板数定价数据
 */
router.get('/skid-pricing/export/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;

    // 从数据库获取所有该城市的活跃板数定价
    const pricingData = await prisma.skidPricing.findMany({
      where: {
        cityId: cityId,
        isActive: true
      },
      orderBy: [
        { zoneId: 'asc' },
        { skidCount: 'asc' }
      ]
    });

    // 转换为导出格式
    const exportData = pricingData.map(item => ({
      cityId: item.cityId,
      zoneId: item.zoneId,
      skidCount: item.skidCount,
      price: parseFloat(item.price),
      currency: item.currency
    }));

    res.json({
      success: true,
      data: exportData,
      message: `导出 ${exportData.length} 条板数定价记录`
    });
  } catch (error) {
    console.error('导出板数定价数据失败:', error);
    res.status(500).json({
      success: false,
      error: '导出板数定价数据失败',
      message: error.message
    });
  }
});

module.exports = router;