// Provider List Component
// 服务商列表管理组件

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Power,
  DollarSign,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  ChevronRight,
  Download,
  Upload
} from 'lucide-react';

const ProviderList = ({ onSelectProvider, onAddProvider, selectedProvider: externalSelectedProvider }) => {
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(externalSelectedProvider || null);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    setSelectedProvider(externalSelectedProvider);
  }, [externalSelectedProvider]);

  useEffect(() => {
    filterProviders();
  }, [providers, searchTerm, filterStatus, filterType]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/providers');
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProviders = () => {
    let filtered = [...providers];

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(provider =>
        provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        provider.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (provider.description && provider.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(provider => provider.status === filterStatus);
    }

    // 类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(provider => provider.type === filterType);
    }

    setFilteredProviders(filtered);
  };

  const handleToggleStatus = async (provider) => {
    try {
      const endpoint = provider.status === 'ACTIVE' 
        ? `/api/v1/providers/${provider.id}/deactivate`
        : `/api/v1/providers/${provider.id}/activate`;

      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        loadProviders();
      }
    } catch (error) {
      console.error('Error toggling provider status:', error);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!confirm('确定要删除该服务商吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/providers/${providerId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        loadProviders();
      } else {
        alert(data.error || '删除失败');
      }
    } catch (error) {
      console.error('Error deleting provider:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'INACTIVE':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'SUSPENDED':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-900/20 text-green-400 border-green-900';
      case 'INACTIVE':
        return 'bg-gray-900/20 text-gray-400 border-gray-900';
      case 'SUSPENDED':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-900';
      default:
        return 'bg-gray-900/20 text-gray-400 border-gray-900';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'EXPRESS':
        return <Truck className="w-4 h-4" />;
      case 'FREIGHT':
        return <Package className="w-4 h-4" />;
      default:
        return <Truck className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索服务商..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">所有状态</option>
            <option value="ACTIVE">激活</option>
            <option value="INACTIVE">停用</option>
            <option value="SUSPENDED">暂停</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="all">所有类型</option>
            <option value="EXPRESS">快递</option>
            <option value="FREIGHT">货运</option>
            <option value="DEDICATED">专线</option>
            <option value="LTL">零担</option>
            <option value="FTL">整车</option>
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={onAddProvider}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加服务商
          </button>

          <button
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            导入
          </button>

          <button
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      {/* 服务商列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredProviders.map((provider) => (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`bg-gray-900 rounded-lg border ${
                selectedProvider?.id === provider.id 
                  ? 'border-cyan-500 shadow-lg shadow-cyan-500/20' 
                  : 'border-gray-800 hover:border-gray-600'
              } transition-all cursor-pointer hover:shadow-lg hover:shadow-gray-800/50 hover:bg-gray-800/50`}
              onClick={() => {
                setSelectedProvider(provider);
                onSelectProvider && onSelectProvider(provider);
              }}
            >
              <div className="p-4">
                {/* 头部 */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-800 rounded-lg">
                      {getTypeIcon(provider.type)}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{provider.name}</h3>
                      <p className="text-gray-400 text-sm">{provider.code}</p>
                    </div>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full border flex items-center gap-1 ${getStatusColor(provider.status)}`}>
                    {getStatusIcon(provider.status)}
                    <span className="text-xs">{provider.status}</span>
                  </div>
                </div>

                {/* 描述 */}
                {provider.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {provider.description}
                  </p>
                )}

                {/* 统计信息 */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400">
                      <MapPin className="w-3 h-3" />
                      <span className="text-xs">区域</span>
                    </div>
                    <p className="text-white font-semibold">
                      {provider.serviceAreas?.length || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-xs">定价</span>
                    </div>
                    <p className="text-white font-semibold">
                      {provider.pricingModels?.length || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-gray-400">
                      <Package className="w-3 h-3" />
                      <span className="text-xs">附加费</span>
                    </div>
                    <p className="text-white font-semibold">
                      {provider.surcharges?.length || 0}
                    </p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(provider);
                    }}
                    className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-1 ${
                      provider.status === 'ACTIVE'
                        ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30'
                        : 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {provider.status === 'ACTIVE' ? '停用' : '激活'}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // 触发父组件的编辑功能
                      if (window.handleEditProvider) {
                        window.handleEditProvider(provider);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    编辑
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProvider(provider.id);
                    }}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-red-900/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 选中指示器 */}
              {selectedProvider?.id === provider.id && (
                <div className="h-1 bg-cyan-500 rounded-b-lg"></div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 空状态 */}
      {filteredProviders.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all'
              ? '没有找到匹配的服务商'
              : '还没有添加服务商'}
          </p>
          {!searchTerm && filterStatus === 'all' && filterType === 'all' && (
            <button
              onClick={onAddProvider}
              className="mt-4 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              添加第一个服务商
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProviderList;