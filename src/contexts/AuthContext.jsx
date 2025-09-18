import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从 localStorage 加载初始用户状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to initialize auth:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('sessionToken');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 登录
  const login = useCallback(async (username, password, rememberMe = false) => {
    try {
      setError(null);
      const response = await authService.login(username, password, rememberMe);

      // 保存 tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('sessionToken', response.sessionToken);

      setUser(response.user);
      return { success: true, user: response.user };
    } catch (err) {
      const errorMessage = err.response?.data?.error || '登录失败，请重试';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 注册
  const register = useCallback(async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);

      // 保存 tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('sessionToken', response.sessionToken);

      setUser(response.user);
      return { success: true, user: response.user };
    } catch (err) {
      const errorMessage = err.response?.data?.error || '注册失败，请重试';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      await authService.logout(sessionToken);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // 清除本地存储
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('sessionToken');
      setUser(null);
      setError(null);
    }
  }, []);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return null;
    }
  }, []);

  // 修改密码
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setError(null);
      await authService.changePassword(currentPassword, newPassword);
      // 密码修改成功后需要重新登录
      await logout();
      return { success: true, message: '密码修改成功，请重新登录' };
    } catch (err) {
      const errorMessage = err.response?.data?.error || '密码修改失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [logout]);

  // 检查用户权限
  const hasRole = useCallback((requiredRoles) => {
    if (!user) return false;
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }
    return requiredRoles.includes(user.role);
  }, [user]);

  const isSuperAdmin = useCallback(() => hasRole(['SUPER_ADMIN']), [hasRole]);
  const isAdmin = useCallback(() => hasRole(['SUPER_ADMIN', 'ADMIN']), [hasRole]);
  const isManager = useCallback(() => hasRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']), [hasRole]);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser,
    changePassword,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isManager,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};