import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Key, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PermissionGroups from './PermissionGroups';
import UserPermissions from './UserPermissions';
import QueryLimits from './QueryLimits';
import QueryLogs from './QueryLogs';

const PermissionManager = () => {
  const [activeTab, setActiveTab] = useState('groups');
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    // 初始化检查
    setLoading(false);
  }, []);

  // 检查是否有管理权限
  const hasAdminAccess = hasRole(['SUPER_ADMIN', 'ADMIN']);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!hasAdminAccess) {
    return (
      <div className="p-6">
        <Card className="border-red-900/50 bg-red-900/10">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">无权访问</p>
                <p className="text-sm text-red-500">您没有权限访问权限管理模块。</p>
                <p className="text-xs text-red-400 mt-2">当前角色: {user?.role || '未知'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">权限管理系统</h1>
        <p className="text-blue-100">管理用户权限组、查询限制和系统访问控制</p>
        <p className="text-xs text-blue-200 mt-2">当前用户: {user?.username} ({user?.role})</p>
      </div>

      {/* 功能选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full bg-gray-800 border border-gray-700">
          <TabsTrigger value="groups" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            权限组
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            用户权限
          </TabsTrigger>
          <TabsTrigger value="limits" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Key className="w-4 h-4 mr-2" />
            查询限制
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            查询日志
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups">
          <PermissionGroups />
        </TabsContent>
        <TabsContent value="users">
          <UserPermissions />
        </TabsContent>
        <TabsContent value="limits">
          <QueryLimits />
        </TabsContent>
        <TabsContent value="logs">
          <QueryLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PermissionManager;