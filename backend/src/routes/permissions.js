const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken, requireAdmin } = require('../middleware/auth');

// 获取所有权限组
router.get('/groups', verifyToken, requireAdmin, async (req, res) => {
  try {
    const groups = await prisma.permissionGroup.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    console.error('获取权限组失败:', error);
    res.status(500).json({
      success: false,
      error: '获取权限组失败'
    });
  }
});

// 创建权限组
router.post('/groups', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    const group = await prisma.permissionGroup.create({
      data: {
        name,
        description,
        permissions
      }
    });

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('创建权限组失败:', error);
    res.status(500).json({
      success: false,
      error: '创建权限组失败'
    });
  }
});

// 更新权限组
router.put('/groups/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, isActive } = req.body;

    const group = await prisma.permissionGroup.update({
      where: { id },
      data: {
        name,
        description,
        permissions,
        isActive
      }
    });

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('更新权限组失败:', error);
    res.status(500).json({
      success: false,
      error: '更新权限组失败'
    });
  }
});

// 删除权限组
router.delete('/groups/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.permissionGroup.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: '权限组已删除'
    });
  } catch (error) {
    console.error('删除权限组失败:', error);
    res.status(500).json({
      success: false,
      error: '删除权限组失败'
    });
  }
});

// 获取用户权限
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // 验证用户是否有权限查看（管理员或查看自己的权限）
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: '无权访问该用户权限'
      });
    }

    const permissions = await prisma.userPermission.findMany({
      where: { userId },
      include: {
        group: true
      }
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    console.error('获取用户权限失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户权限失败'
    });
  }
});

// 分配用户权限
router.post('/user/:userId/assign', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { groupId, modules } = req.body;

    const permission = await prisma.userPermission.create({
      data: {
        userId,
        groupId,
        modules: modules || []
      }
    });

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('分配权限失败:', error);
    res.status(500).json({
      success: false,
      error: '分配权限失败'
    });
  }
});

// 更新用户权限
router.put('/user/:userId/permission/:permissionId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { permissionId } = req.params;
    const { modules } = req.body;

    const permission = await prisma.userPermission.update({
      where: { id: permissionId },
      data: { modules }
    });

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    console.error('更新权限失败:', error);
    res.status(500).json({
      success: false,
      error: '更新权限失败'
    });
  }
});

// 移除用户权限
router.delete('/user/:userId/permission/:permissionId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { permissionId } = req.params;

    await prisma.userPermission.delete({
      where: { id: permissionId }
    });

    res.json({
      success: true,
      message: '权限已移除'
    });
  } catch (error) {
    console.error('移除权限失败:', error);
    res.status(500).json({
      success: false,
      error: '移除权限失败'
    });
  }
});

// 获取用户查询限制
router.get('/limits/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // 验证权限
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ADMIN' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: '无权访问该用户查询限制'
      });
    }

    const limits = await prisma.userQueryLimit.findMany({
      where: { userId }
    });

    res.json({
      success: true,
      data: limits
    });
  } catch (error) {
    console.error('获取查询限制失败:', error);
    res.status(500).json({
      success: false,
      error: '获取查询限制失败'
    });
  }
});

// 设置用户查询限制
router.post('/limits/user/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { queryType, dailyLimit, monthlyLimit } = req.body;

    const limit = await prisma.userQueryLimit.upsert({
      where: {
        userId_queryType: {
          userId,
          queryType
        }
      },
      update: {
        dailyLimit,
        monthlyLimit
      },
      create: {
        userId,
        queryType,
        dailyLimit,
        monthlyLimit
      }
    });

    res.json({
      success: true,
      data: limit
    });
  } catch (error) {
    console.error('设置查询限制失败:', error);
    res.status(500).json({
      success: false,
      error: '设置查询限制失败'
    });
  }
});

// 重置查询计数
router.post('/limits/user/:userId/reset', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { queryType } = req.body;

    const limit = await prisma.userQueryLimit.update({
      where: {
        userId_queryType: {
          userId,
          queryType
        }
      },
      data: {
        usedToday: 0,
        usedThisMonth: 0,
        lastReset: new Date()
      }
    });

    res.json({
      success: true,
      data: limit
    });
  } catch (error) {
    console.error('重置查询计数失败:', error);
    res.status(500).json({
      success: false,
      error: '重置查询计数失败'
    });
  }
});

// 获取查询日志
router.get('/logs/user/:userId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, queryType } = req.query;

    const where = { userId };

    if (queryType) {
      where.queryType = queryType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.userQueryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('获取查询日志失败:', error);
    res.status(500).json({
      success: false,
      error: '获取查询日志失败'
    });
  }
});

// 根据角色自动分配权限组
router.post('/auto-assign', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;

    let groupName;
    switch (role) {
      case 'VIP_1':
        groupName = 'VIP1_GROUP';
        break;
      case 'VIP_2':
        groupName = 'VIP2_GROUP';
        break;
      case 'ADMIN':
      case 'SUPER_ADMIN':
        groupName = 'ADMIN_FULL';
        break;
      default:
        groupName = 'BASIC_USER';
    }

    // 查找对应的权限组
    const group = await prisma.permissionGroup.findUnique({
      where: { name: groupName }
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        error: '权限组不存在'
      });
    }

    // 分配权限
    const permission = await prisma.userPermission.upsert({
      where: {
        userId_groupId: {
          userId,
          groupId: group.id
        }
      },
      update: {},
      create: {
        userId,
        groupId: group.id,
        modules: []
      }
    });

    // 设置查询限制
    const limits = role === 'VIP_1' ? 10 : role === 'VIP_2' ? 20 : 100;

    await prisma.userQueryLimit.upsert({
      where: {
        userId_queryType: {
          userId,
          queryType: 'PRICE_QUERY'
        }
      },
      update: {
        dailyLimit: limits
      },
      create: {
        userId,
        queryType: 'PRICE_QUERY',
        dailyLimit: limits,
        monthlyLimit: limits * 30
      }
    });

    res.json({
      success: true,
      message: '权限已自动分配',
      data: {
        permission,
        queryLimit: limits
      }
    });
  } catch (error) {
    console.error('自动分配权限失败:', error);
    res.status(500).json({
      success: false,
      error: '自动分配权限失败'
    });
  }
});

module.exports = router;