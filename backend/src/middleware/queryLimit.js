const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 查询限制中间件
const checkQueryLimit = (queryType = 'PRICE_QUERY') => {
  return async (req, res, next) => {
    try {
      // 如果用户未登录，直接跳过
      if (!req.user) {
        return next();
      }

      const userId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 获取用户的查询限制
      let queryLimit = await prisma.userQueryLimit.findUnique({
        where: {
          userId_queryType: {
            userId,
            queryType
          }
        }
      });

      // 如果没有设置限制，根据角色创建默认限制
      if (!queryLimit) {
        let dailyLimit = 100; // 默认限制
        let monthlyLimit = 3000;

        switch (req.user.role) {
          case 'VIP_1':
            dailyLimit = 10;
            monthlyLimit = 300;
            break;
          case 'VIP_2':
            dailyLimit = 20;
            monthlyLimit = 600;
            break;
          case 'USER':
            dailyLimit = 5;
            monthlyLimit = 150;
            break;
          case 'MANAGER':
            dailyLimit = 50;
            monthlyLimit = 1500;
            break;
          case 'ADMIN':
          case 'SUPER_ADMIN':
            // 管理员没有限制
            return next();
        }

        queryLimit = await prisma.userQueryLimit.create({
          data: {
            userId,
            queryType,
            dailyLimit,
            monthlyLimit,
            usedToday: 0,
            usedThisMonth: 0,
            lastReset: today
          }
        });
      }

      // 管理员角色跳过限制
      if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // 检查是否需要重置计数（新的一天）
      const lastReset = new Date(queryLimit.lastReset);
      const shouldResetDaily = lastReset < today;
      const shouldResetMonthly = lastReset.getMonth() !== today.getMonth();

      if (shouldResetDaily || shouldResetMonthly) {
        const updateData = {
          lastReset: today
        };

        if (shouldResetDaily) {
          updateData.usedToday = 0;
        }

        if (shouldResetMonthly) {
          updateData.usedThisMonth = 0;
        }

        queryLimit = await prisma.userQueryLimit.update({
          where: { id: queryLimit.id },
          data: updateData
        });
      }

      // 检查是否超过限制
      if (queryLimit.usedToday >= queryLimit.dailyLimit) {
        return res.status(429).json({
          success: false,
          error: '已达到今日查询限制',
          limit: queryLimit.dailyLimit,
          used: queryLimit.usedToday,
          resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        });
      }

      if (queryLimit.monthlyLimit && queryLimit.usedThisMonth >= queryLimit.monthlyLimit) {
        return res.status(429).json({
          success: false,
          error: '已达到本月查询限制',
          limit: queryLimit.monthlyLimit,
          used: queryLimit.usedThisMonth
        });
      }

      // 更新计数
      await prisma.userQueryLimit.update({
        where: { id: queryLimit.id },
        data: {
          usedToday: { increment: 1 },
          usedThisMonth: { increment: 1 }
        }
      });

      // 记录查询日志
      const startTime = Date.now();

      // 在响应发送后记录日志
      res.on('finish', async () => {
        try {
          await prisma.userQueryLog.create({
            data: {
              userId,
              queryType,
              module: req.baseUrl || req.path,
              endpoint: req.path,
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
              responseTime: Date.now() - startTime
            }
          });
        } catch (error) {
          console.error('记录查询日志失败:', error);
        }
      });

      // 在响应头中添加限制信息
      res.setHeader('X-RateLimit-Limit', queryLimit.dailyLimit);
      res.setHeader('X-RateLimit-Remaining', queryLimit.dailyLimit - queryLimit.usedToday - 1);
      res.setHeader('X-RateLimit-Reset', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString());

      next();
    } catch (error) {
      console.error('查询限制检查失败:', error);
      // 如果检查失败，允许请求继续，但记录错误
      next();
    }
  };
};

// 检查模块访问权限
const checkModuleAccess = (module) => {
  return async (req, res, next) => {
    try {
      // 允许未认证用户的GET请求（只读访问）
      if (!req.user && req.method === 'GET') {
        return next();
      }

      // 如果用户未登录且不是GET请求，拒绝访问
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: '需要登录才能访问'
        });
      }

      const userId = req.user.id;

      // 管理员有所有权限
      if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      // 获取用户权限
      const userPermissions = await prisma.userPermission.findMany({
        where: { userId },
        include: {
          group: {
            select: {
              permissions: true,
              isActive: true
            }
          }
        }
      });

      // 检查是否有访问权限
      let hasAccess = false;

      for (const permission of userPermissions) {
        if (!permission.group.isActive) continue;

        // 检查权限组中的权限
        const groupPermissions = permission.group.permissions;
        if (Array.isArray(groupPermissions)) {
          const modulePermission = groupPermissions.find(p => p.module === module);
          if (modulePermission && modulePermission.access) {
            hasAccess = true;
            break;
          }
        }

        // 检查用户特定的模块权限
        if (Array.isArray(permission.modules)) {
          const moduleOverride = permission.modules.find(m => m.module === module);
          if (moduleOverride && moduleOverride.access) {
            hasAccess = true;
            break;
          }
        }
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: '无权访问该模块',
          module
        });
      }

      next();
    } catch (error) {
      console.error('模块访问权限检查失败:', error);
      res.status(500).json({
        success: false,
        error: '权限检查失败'
      });
    }
  };
};

// 获取用户的查询限制状态
const getQueryLimitStatus = async (userId, queryType = 'PRICE_QUERY') => {
  try {
    const queryLimit = await prisma.userQueryLimit.findUnique({
      where: {
        userId_queryType: {
          userId,
          queryType
        }
      }
    });

    if (!queryLimit) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastReset = new Date(queryLimit.lastReset);

    // 检查是否需要重置
    if (lastReset < today) {
      await prisma.userQueryLimit.update({
        where: { id: queryLimit.id },
        data: {
          usedToday: 0,
          lastReset: today
        }
      });
      queryLimit.usedToday = 0;
    }

    return {
      dailyLimit: queryLimit.dailyLimit,
      monthlyLimit: queryLimit.monthlyLimit,
      usedToday: queryLimit.usedToday,
      usedThisMonth: queryLimit.usedThisMonth,
      remainingToday: Math.max(0, queryLimit.dailyLimit - queryLimit.usedToday),
      remainingThisMonth: queryLimit.monthlyLimit
        ? Math.max(0, queryLimit.monthlyLimit - queryLimit.usedThisMonth)
        : null,
      resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    };
  } catch (error) {
    console.error('获取查询限制状态失败:', error);
    return null;
  }
};

module.exports = {
  checkQueryLimit,
  checkModuleAccess,
  getQueryLimitStatus
};