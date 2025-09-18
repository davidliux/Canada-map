import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const PrivateRoute = ({
  children,
  requiredRoles = [],
  redirectTo = '/auth/login'
}) => {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // 检查是否已认证
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // 检查角色权限
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 border border-red-500 rounded-lg p-8 max-w-md">
          <h2 className="text-2xl font-bold text-red-500 mb-4">访问受限</h2>
          <p className="text-gray-300 mb-6">
            您没有权限访问此页面。需要以下角色之一：
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {requiredRoles.map((role) => (
              <span
                key={role}
                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-md text-sm"
              >
                {role}
              </span>
            ))}
          </div>
          <p className="text-gray-400 text-sm mb-6">
            当前角色：
            <span className="ml-2 px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-md">
              {user.role}
            </span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            返回上一页
          </button>
        </div>
      </div>
    );
  }

  // 权限验证通过
  return children;
};

export default PrivateRoute;