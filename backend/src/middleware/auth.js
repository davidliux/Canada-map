const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-this';

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      tokenType: 'refresh'
    },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: '未提供认证令牌'
      });
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, JWT_SECRET);

    // 验证用户是否存在且激活
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在或已被禁用'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: '认证令牌已过期',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: '无效的认证令牌'
      });
    }

    console.error('Token verification error:', error);
    return res.status(500).json({
      success: false,
      error: '认证验证失败'
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: '需要先进行身份认证'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: '权限不足，无法访问该资源',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

const requireSuperAdmin = requireRole('SUPER_ADMIN');
const requireAdmin = requireRole('SUPER_ADMIN', 'ADMIN');
const requireManager = requireRole('SUPER_ADMIN', 'ADMIN', 'MANAGER');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        isActive: true
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    req.user = user || null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

const verifyRefreshToken = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    if (decoded.tokenType !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.id,
        isActive: true,
        refreshToken: refreshToken
      }
    });

    if (!user) {
      throw new Error('Invalid refresh token');
    }

    return user;
  } catch (error) {
    throw error;
  }
};

const createSession = async (userId, ipAddress, userAgent) => {
  const sessionToken = jwt.sign(
    {
      userId,
      sessionId: Date.now().toString(),
      type: 'session'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const session = await prisma.userSession.create({
    data: {
      userId,
      token: sessionToken,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });

  return session;
};

const validateSession = async (sessionToken) => {
  try {
    const session = await prisma.userSession.findUnique({
      where: {
        token: sessionToken,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            role: true,
            isActive: true
          }
        }
      }
    });

    if (!session) {
      return null;
    }

    if (new Date() > new Date(session.expiresAt)) {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { isActive: false }
      });
      return null;
    }

    return session.user;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
};

const logActivity = async (userId, action, details = {}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        tableName: details.tableName || null,
        recordId: details.recordId || null,
        oldValues: details.oldValues || null,
        newValues: details.newValues || null,
        ipAddress: details.ipAddress || null,
        userAgent: details.userAgent || null
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

module.exports = {
  generateTokens,
  verifyToken,
  requireRole,
  requireSuperAdmin,
  requireAdmin,
  requireManager,
  optionalAuth,
  verifyRefreshToken,
  createSession,
  validateSession,
  logActivity,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};