import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, AlertCircle, Loader2 } from 'lucide-react';

const PermissionGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  // 获取权限组列表
  const fetchGroups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5050/api/v1/permissions/groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取权限组失败');
      }

      const data = await response.json();
      setGroups(data.data || []);
      setError(null);
    } catch (err) {
      console.error('获取权限组失败:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 创建权限组
  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5050/api/v1/permissions/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '创建权限组失败');
      }

      await fetchGroups();
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', permissions: [] });
    } catch (err) {
      console.error('创建权限组失败:', err);
      setError(err.message);
    }
  };

  // 更新权限组
  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5050/api/v1/permissions/groups/${selectedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '更新权限组失败');
      }

      await fetchGroups();
      setIsEditModalOpen(false);
      setSelectedGroup(null);
      setFormData({ name: '', description: '', permissions: [] });
    } catch (err) {
      console.error('更新权限组失败:', err);
      setError(err.message);
    }
  };

  // 删除权限组
  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个权限组吗？')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5050/api/v1/permissions/groups/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '删除权限组失败');
      }

      await fetchGroups();
    } catch (err) {
      console.error('删除权限组失败:', err);
      setError(err.message);
    }
  };

  // 编辑权限组
  const handleEdit = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description,
      permissions: group.permissions || []
    });
    setIsEditModalOpen(true);
  };

  const availablePermissions = [
    { key: 'dashboard.view', label: '查看仪表板' },
    { key: 'truck.view', label: '查看卡车配送' },
    { key: 'truck.manage', label: '管理卡车配送' },
    { key: 'fsa.view', label: '查看FSA地图' },
    { key: 'fsa.manage', label: '管理FSA区域' },
    { key: 'pricing.view', label: '查看价格' },
    { key: 'pricing.manage', label: '管理价格' },
    { key: 'users.view', label: '查看用户' },
    { key: 'users.manage', label: '管理用户' },
    { key: 'settings.view', label: '查看设置' },
    { key: 'settings.manage', label: '管理设置' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 错误提示 */}
      {error && (
        <Card className="border-red-900/50 bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 工具栏 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">权限组管理</h2>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          创建权限组
        </Button>
      </div>

      {/* 权限组列表 */}
      <Card className="border-gray-700 bg-gray-800">
        <CardContent className="p-0">
          {groups.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              暂无权限组，请创建第一个权限组
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-700 border-b border-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">描述</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">权限数量</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">状态</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">操作</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-white font-medium">{group.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{group.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {group.permissions?.length || 0} 个权限
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        group.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {group.isActive ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(group)}
                          className="p-1 text-blue-400 hover:text-blue-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(group.id)}
                          className="p-1 text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑模态框 */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {isCreateModalOpen ? '创建权限组' : '编辑权限组'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">名称</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="输入权限组名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  placeholder="输入权限组描述"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">权限选择</label>
                <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {availablePermissions.map((perm) => (
                    <label key={perm.key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm.key)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [...formData.permissions, perm.key]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter(p => p !== perm.key)
                            });
                          }
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600"
                      />
                      <span className="text-sm text-gray-300">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setFormData({ name: '', description: '', permissions: [] });
                }}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                取消
              </Button>
              <Button
                onClick={isCreateModalOpen ? handleCreate : handleUpdate}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreateModalOpen ? '创建' : '更新'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionGroups;