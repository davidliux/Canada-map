import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus } from 'lucide-react';

const UserPermissions = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">用户权限管理</h3>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          分配权限
        </Button>
      </div>

      <Card className="border-gray-700 bg-gray-800/50">
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>用户权限管理功能正在开发中...</p>
            <p className="text-sm mt-2">即将支持为用户分配权限组</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPermissions;