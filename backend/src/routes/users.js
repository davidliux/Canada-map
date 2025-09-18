const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { body, query, validationResult } = require('express-validator');
const {
  verifyToken,
  requireSuperAdmin,
  requireAdmin,
  logActivity,
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 获取用户列表（需要 ADMIN 或 SUPER_ADMIN 权限）
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (pageNumber - 1) * pageLimit;

    // 构建查询条件
    const where = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // 如果不是 SUPER_ADMIN，不能查看 SUPER_ADMIN 用户
    if (req.user.role !== 'SUPER_ADMIN') {
      where.role = { not: 'SUPER_ADMIN' };
    }

    // 获取总数
    const total = await prisma.user.count({ where });

    // 获取用户列表
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: pageLimit
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNumber,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit)
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户列表失败'
    });
  }
});

// 获取单个用户详情
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // 普通用户只能查看自己的信息
    if (req.user.role === 'USER' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            sessions: { where: { isActive: true } },
            auditLogs: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 非 SUPER_ADMIN 不能查看 SUPER_ADMIN 用户
    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败'
    });
  }
});

// 创建用户（需要 ADMIN 或 SUPER_ADMIN 权限）
router.post('/', verifyToken, requireAdmin, [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('用户名长度必须在3-50个字符之间'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('密码长度至少8个字符'),
  body('role')
    .isIn(['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('无效的角色'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('姓名长度不能超过100个字符'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { username, email, password, fullName, role } = req.body;

    // 只有 SUPER_ADMIN 可以创建 SUPER_ADMIN
    if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: '只有超级管理员可以创建超级管理员账号'
      });
    }

    // 检查用户名是否已存在
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        error: '用户名已被使用'
      });
    }

    // 检查邮箱是否已存在
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: '邮箱已被注册'
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        fullName: fullName || null,
        role,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    });

    // 记录活动日志
    await logActivity(req.user.id, 'USER_CREATED', {
      tableName: 'users',
      recordId: user.id,
      newValues: { username, email, role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: '创建用户失败'
    });
  }
});

// 更新用户信息
router.put('/:id', verifyToken, [
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('请输入有效的邮箱地址')
    .normalizeEmail(),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('姓名长度不能超过100个字符'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { email, fullName } = req.body;

    // 普通用户只能更新自己的信息
    if (req.user.role === 'USER' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }

    // 获取原用户信息
    const originalUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!originalUser) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 非 SUPER_ADMIN 不能更新 SUPER_ADMIN 用户
    if (originalUser.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }

    const updateData = {};

    if (email && email !== originalUser.email) {
      // 检查邮箱是否已被使用
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          error: '邮箱已被使用'
        });
      }

      updateData.email = email;
    }

    if (fullName !== undefined) {
      updateData.fullName = fullName;
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    // 记录活动日志
    await logActivity(req.user.id, 'USER_UPDATED', {
      tableName: 'users',
      recordId: id,
      oldValues: { email: originalUser.email, fullName: originalUser.fullName },
      newValues: updateData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: '更新用户信息失败'
    });
  }
});

// 更新用户角色（需要 SUPER_ADMIN 权限）
router.put('/:id/role', verifyToken, requireSuperAdmin, [
  body('role')
    .isIn(['USER', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('无效的角色'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    // 不能修改自己的角色
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: '不能修改自己的角色'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    const oldRole = user.role;

    // 更新角色
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true
      }
    });

    // 记录活动日志
    await logActivity(req.user.id, 'USER_ROLE_CHANGED', {
      tableName: 'users',
      recordId: id,
      oldValues: { role: oldRole },
      newValues: { role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: '更新用户角色失败'
    });
  }
});

// 启用/禁用用户（需要 ADMIN 或 SUPER_ADMIN 权限）
router.put('/:id/status', verifyToken, requireAdmin, [
  body('isActive')
    .isBoolean()
    .withMessage('状态必须是布尔值'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { isActive } = req.body;

    // 不能禁用自己
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: '不能禁用自己的账号'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 非 SUPER_ADMIN 不能禁用 SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }

    // 更新用户状态
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true
      }
    });

    // 如果禁用用户，使其所有会话失效
    if (!isActive) {
      await prisma.userSession.updateMany({
        where: { userId: id },
        data: { isActive: false }
      });
    }

    // 记录活动日志
    await logActivity(req.user.id, isActive ? 'USER_ENABLED' : 'USER_DISABLED', {
      tableName: 'users',
      recordId: id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      error: '更新用户状态失败'
    });
  }
});

// 删除用户（需要 SUPER_ADMIN 权限）
router.delete('/:id', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: '不能删除自己的账号'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 删除用户
    await prisma.user.delete({
      where: { id }
    });

    // 记录活动日志
    await logActivity(req.user.id, 'USER_DELETED', {
      tableName: 'users',
      recordId: id,
      oldValues: { username: user.username, email: user.email, role: user.role },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '用户已删除'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: '删除用户失败'
    });
  }
});

// 获取用户活动日志
router.get('/:id/activities', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      limit = 20,
      action = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const pageNumber = parseInt(page);
    const pageLimit = parseInt(limit);
    const skip = (pageNumber - 1) * pageLimit;

    // 构建查询条件
    const where = { userId: id };

    if (action) {
      where.action = action;
    }

    if (startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(endDate)
      };
    }

    // 获取总数
    const total = await prisma.auditLog.count({ where });

    // 获取活动日志
    const activities = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: pageLimit
    });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: pageNumber,
          limit: pageLimit,
          total,
          totalPages: Math.ceil(total / pageLimit)
        }
      }
    });
  } catch (error) {
    console.error('Get user activities error:', error);
    res.status(500).json({
      success: false,
      error: '获取用户活动日志失败'
    });
  }
});

// 批量操作用户（需要 SUPER_ADMIN 权限）
router.post('/batch', verifyToken, requireSuperAdmin, [
  body('userIds')
    .isArray()
    .withMessage('用户 ID 列表必须是数组'),
  body('action')
    .isIn(['enable', 'disable', 'delete'])
    .withMessage('无效的操作'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { userIds, action } = req.body;

    // 不能对自己进行批量操作
    if (userIds.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: '不能对自己的账号进行批量操作'
      });
    }

    // 检查是否包含 SUPER_ADMIN
    const superAdmins = await prisma.user.count({
      where: {
        id: { in: userIds },
        role: 'SUPER_ADMIN'
      }
    });

    if (superAdmins > 0) {
      return res.status(403).json({
        success: false,
        error: '批量操作不能包含超级管理员账号'
      });
    }

    let result;

    switch (action) {
      case 'enable':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true }
        });
        break;

      case 'disable':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false }
        });

        // 使会话失效
        await prisma.userSession.updateMany({
          where: { userId: { in: userIds } },
          data: { isActive: false }
        });
        break;

      case 'delete':
        result = await prisma.user.deleteMany({
          where: { id: { in: userIds } }
        });
        break;
    }

    // 记录活动日志
    await logActivity(req.user.id, `BATCH_${action.toUpperCase()}`, {
      tableName: 'users',
      newValues: { userIds, count: result.count },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: {
        affected: result.count,
        action
      }
    });
  } catch (error) {
    console.error('Batch operation error:', error);
    res.status(500).json({
      success: false,
      error: '批量操作失败'
    });
  }
});

module.exports = router;