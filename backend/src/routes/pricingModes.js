// Pricing Modes API Routes
// 定价模式接口 - 支持首续托、批量折扣、整车等灵活定价策略

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/v1/truck-delivery/pricing-modes/:cityId/:zoneId
 * 获取指定城市和区域的定价模式配置
 */
router.get('/pricing-modes/:cityId/:zoneId', async (req, res) => {
  try {
    const { cityId, zoneId } = req.params;
    console.log(`获取定价模式配置 - 城市ID: ${cityId}, 区域ID: ${zoneId}`);

    // 从数据库获取定价模式
    const pricingModes = await prisma.pricingModes.findMany({
      where: {
        cityId: cityId,
        zoneId: zoneId,
        isActive: true
      },
      include: {
        pricingRules: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: {
        priority: 'desc'
      }
    });

    // 找出活跃的模式（优先级最高的）
    const activeMode = pricingModes.length > 0 ? pricingModes[0] : null;

    console.log(`成功获取定价模式 - 城市: ${cityId}, 区域: ${zoneId}, 模式数: ${pricingModes.length}`);
    res.json({
      success: true,
      data: {
        modes: pricingModes,
        activeMode: activeMode?.modeType || null,
        lastUpdated: activeMode?.updatedAt || null
      },
      message: '获取定价模式配置成功'
    });
  } catch (error) {
    console.error('获取定价模式失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: '获取定价模式失败',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/v1/truck-delivery/pricing-modes/:cityId/:zoneId
 * 保存或更新定价模式配置
 */
router.post('/pricing-modes/:cityId/:zoneId', async (req, res) => {
  try {
    const { cityId, zoneId } = req.params;
    const { mode, effectiveDate } = req.body;

    console.log(`保存定价模式 - 城市: ${cityId}, 区域: ${zoneId}, 模式: ${mode.modeType}`);
    console.log('模式配置:', JSON.stringify(mode, null, 2));

    // 验证必要字段
    if (!mode || !mode.modeType || !mode.config) {
      return res.status(400).json({
        success: false,
        error: '缺少必要的模式配置信息'
      });
    }

    // 使用事务保存定价模式和规则
    const result = await prisma.$transaction(async (tx) => {
      // 查找或创建定价模式
      let pricingMode = await tx.pricingModes.findUnique({
        where: {
          cityId_zoneId_modeType: {
            cityId: cityId,
            zoneId: zoneId,
            modeType: mode.modeType
          }
        }
      });

      if (pricingMode) {
        // 更新现有模式
        pricingMode = await tx.pricingModes.update({
          where: { id: pricingMode.id },
          data: {
            config: mode.config,
            isActive: mode.isActive !== undefined ? mode.isActive : true,
            priority: mode.priority || 0,
            updatedAt: new Date(),
            createdBy: mode.createdBy
          }
        });

        // 删除旧规则
        await tx.pricingRules.deleteMany({
          where: { modeId: pricingMode.id }
        });
      } else {
        // 创建新模式
        pricingMode = await tx.pricingModes.create({
          data: {
            cityId: cityId,
            zoneId: zoneId,
            modeType: mode.modeType,
            config: mode.config,
            isActive: mode.isActive !== undefined ? mode.isActive : true,
            priority: mode.priority || 0,
            createdBy: mode.createdBy
          }
        });
      }

      // 创建定价规则
      if (mode.rules && Array.isArray(mode.rules)) {
        const rulesData = mode.rules.map((rule, index) => ({
          modeId: pricingMode.id,
          ruleType: rule.ruleType,
          minQuantity: rule.minQuantity,
          maxQuantity: rule.maxQuantity,
          price: rule.price,
          pricePerUnit: rule.pricePerUnit,
          discountPercent: rule.discountPercent,
          sortOrder: rule.sortOrder || index
        }));

        await tx.pricingRules.createMany({
          data: rulesData
        });
      }

      // 如果设置为激活，则停用其他模式
      if (mode.isActive) {
        await tx.pricingModes.updateMany({
          where: {
            cityId: cityId,
            zoneId: zoneId,
            id: { not: pricingMode.id }
          },
          data: {
            priority: 0
          }
        });
      }

      return pricingMode;
    });

    console.log(`成功保存定价模式 - ID: ${result.id}`);
    res.json({
      success: true,
      data: result,
      message: '保存定价模式成功'
    });
  } catch (error) {
    console.error('保存定价模式失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: '保存定价模式失败',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * DELETE /api/v1/truck-delivery/pricing-modes/:cityId/:zoneId/:modeType
 * 删除指定的定价模式
 */
router.delete('/pricing-modes/:cityId/:zoneId/:modeType', async (req, res) => {
  try {
    const { cityId, zoneId, modeType } = req.params;
    console.log(`删除定价模式 - 城市: ${cityId}, 区域: ${zoneId}, 模式: ${modeType}`);

    // 查找并删除模式
    const pricingMode = await prisma.pricingModes.findUnique({
      where: {
        cityId_zoneId_modeType: {
          cityId: cityId,
          zoneId: zoneId,
          modeType: modeType
        }
      }
    });

    if (!pricingMode) {
      return res.status(404).json({
        success: false,
        error: '定价模式不存在'
      });
    }

    // 软删除 - 只是标记为不激活
    await prisma.pricingModes.update({
      where: { id: pricingMode.id },
      data: { isActive: false }
    });

    console.log(`成功删除定价模式 - ID: ${pricingMode.id}`);
    res.json({
      success: true,
      message: '删除定价模式成功'
    });
  } catch (error) {
    console.error('删除定价模式失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: '删除定价模式失败',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/v1/truck-delivery/pricing-modes/calculate
 * 计算价格
 */
router.post('/pricing-modes/calculate', async (req, res) => {
  try {
    const { cityId, zoneId, quantity, options } = req.body;

    console.log(`计算价格 - 城市: ${cityId}, 区域: ${zoneId}, 数量: ${quantity}`);

    // 验证输入
    if (!cityId || !zoneId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: '无效的计算参数'
      });
    }

    // 获取激活的定价模式
    const activeMode = await prisma.pricingModes.findFirst({
      where: {
        cityId: cityId,
        zoneId: zoneId,
        isActive: true
      },
      include: {
        pricingRules: {
          orderBy: {
            sortOrder: 'asc'
          }
        }
      },
      orderBy: {
        priority: 'desc'
      }
    });

    if (!activeMode) {
      // 如果没有定价模式，尝试使用传统的板数定价
      const skidPricing = await prisma.skidPricing.findUnique({
        where: {
          cityId_zoneId_skidCount: {
            cityId: cityId,
            zoneId: zoneId,
            skidCount: quantity
          }
        }
      });

      if (skidPricing) {
        return res.json({
          success: true,
          data: {
            basePrice: parseFloat(skidPricing.price),
            finalPrice: parseFloat(skidPricing.price),
            breakdown: [
              {
                type: 'fixed',
                description: `${quantity}板固定价格`,
                amount: parseFloat(skidPricing.price)
              }
            ],
            appliedRules: ['fixed'],
            mode: 'fixed'
          }
        });
      }

      return res.status(404).json({
        success: false,
        error: '未找到定价配置'
      });
    }

    // 调用计算服务（将在下一步实现）
    const calculationService = require('../services/calculationService');
    const result = await calculationService.calculatePrice(
      activeMode,
      quantity,
      options
    );

    console.log(`价格计算完成 - 最终价格: ${result.finalPrice}`);
    res.json({
      success: true,
      data: result,
      message: '价格计算成功'
    });
  } catch (error) {
    console.error('价格计算失败:', error);
    console.error('错误堆栈:', error.stack);
    res.status(500).json({
      success: false,
      error: '价格计算失败',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/v1/truck-delivery/pricing-export/:cityId
 * 导出定价配置
 */
router.get('/pricing-export/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { format = 'json', includeHistory } = req.query;

    console.log(`导出定价配置 - 城市: ${cityId}, 格式: ${format}`);

    // 获取所有定价模式
    const pricingModes = await prisma.pricingModes.findMany({
      where: {
        cityId: cityId,
        isActive: includeHistory ? undefined : true
      },
      include: {
        pricingRules: true
      }
    });

    // 获取传统板数定价
    const skidPricing = await prisma.skidPricing.findMany({
      where: {
        cityId: cityId,
        isActive: includeHistory ? undefined : true
      }
    });

    const exportData = {
      cityId: cityId,
      exportDate: new Date().toISOString(),
      pricingModes: pricingModes,
      skidPricing: skidPricing
    };

    if (format === 'json') {
      res.json({
        success: true,
        data: exportData
      });
    } else {
      // TODO: 实现 Excel/CSV 导出
      res.status(501).json({
        success: false,
        error: '该格式导出尚未实现'
      });
    }
  } catch (error) {
    console.error('导出定价配置失败:', error);
    res.status(500).json({
      success: false,
      error: '导出失败',
      message: error.message
    });
  }
});

/**
 * POST /api/v1/truck-delivery/pricing-import/:cityId
 * 导入定价配置
 */
router.post('/pricing-import/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    const importData = req.body;

    console.log(`导入定价配置 - 城市: ${cityId}`);

    // TODO: 实现导入逻辑
    res.status(501).json({
      success: false,
      error: '导入功能尚未实现'
    });
  } catch (error) {
    console.error('导入定价配置失败:', error);
    res.status(500).json({
      success: false,
      error: '导入失败',
      message: error.message
    });
  }
});

module.exports = router;