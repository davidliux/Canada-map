// Provider Management Page
// 服务商管理主页面

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  DollarSign,
  MapPin,
  Settings,
  Plus,
  Calculator
} from 'lucide-react';
import ProviderList from '../../components/providers/ProviderList';
import ProviderForm from '../../components/providers/ProviderForm';
import PricingModelConfig from '../../components/providers/PricingModelConfig';

const ProviderManagement = () => {
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [editingProvider, setEditingProvider] = useState(null);
  const [activeTab, setActiveTab] = useState('list');

  const handleAddProvider = () => {
    setEditingProvider(null);
    setShowProviderForm(true);
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setShowProviderForm(true);
  };

  // 暴露编辑函数给子组件
  useEffect(() => {
    window.handleEditProvider = handleEditProvider;
    return () => {
      delete window.handleEditProvider;
    };
  });

  const handleSaveProvider = (provider) => {
    setShowProviderForm(false);
    setEditingProvider(null);
    // 刷新列表
    window.location.reload();
  };

  const handleSelectProvider = (provider) => {
    console.log('Selected provider:', provider);
    setSelectedProvider(provider);
    // Don't automatically switch tabs, let user click on tabs
  };

  const tabs = [
    { id: 'list', label: '服务商列表', icon: Truck },
    { id: 'detail', label: '服务商详情', icon: Settings },
    { id: 'pricing', label: '定价配置', icon: DollarSign },
    { id: 'areas', label: '服务区域', icon: MapPin },
    { id: 'calculator', label: '价格计算', icon: Calculator }
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面头部 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Truck className="w-8 h-8 text-cyan-400" />
                服务商管理系统
              </h1>
              <p className="text-gray-400 mt-2">
                管理物流服务商、配置定价规则、设置服务区域
              </p>
            </div>
            
            <button
              onClick={handleAddProvider}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              添加服务商
            </button>
          </div>
        </motion.div>

        {/* 标签导航 */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'list' || selectedProvider) {
                    setActiveTab(tab.id);
                  }
                }}
                className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-400'
                    : tab.id !== 'list' && !selectedProvider
                      ? 'border-transparent text-gray-600 cursor-not-allowed'
                      : 'border-transparent text-gray-400 hover:text-gray-300 cursor-pointer'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.id === 'detail' && selectedProvider && (
                  <span className="ml-2 px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-xs rounded-full">
                    {selectedProvider.name}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'list' && (
            <ProviderList
              onSelectProvider={handleSelectProvider}
              onAddProvider={handleAddProvider}
              selectedProvider={selectedProvider}
            />
          )}

          {activeTab === 'detail' && selectedProvider && (
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {selectedProvider.name} 详情
                </h2>
                <button
                  onClick={() => handleEditProvider(selectedProvider)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  编辑
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-3">基本信息</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-400">代码：</dt>
                      <dd className="text-white">{selectedProvider.code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">类型：</dt>
                      <dd className="text-white">{selectedProvider.type}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">状态：</dt>
                      <dd className="text-white">{selectedProvider.status}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">优先级：</dt>
                      <dd className="text-white">{selectedProvider.priority}</dd>
                    </div>
                  </dl>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-3">统计信息</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-400">服务区域：</dt>
                      <dd className="text-white">{selectedProvider.serviceAreas?.length || 0} 个</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">定价模型：</dt>
                      <dd className="text-white">{selectedProvider.pricingModels?.length || 0} 个</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">附加费用：</dt>
                      <dd className="text-white">{selectedProvider.surcharges?.length || 0} 项</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && selectedProvider && (
            <PricingModelConfig 
              providerId={selectedProvider.id} 
              providerName={selectedProvider.name}
            />
          )}

          {activeTab === 'areas' && selectedProvider && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                服务区域 - {selectedProvider.name}
              </h2>
              <p className="text-gray-400">服务区域配置功能开发中...</p>
            </div>
          )}

          {activeTab === 'calculator' && selectedProvider && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                价格计算 - {selectedProvider.name}
              </h2>
              <p className="text-gray-400">价格计算功能开发中...</p>
            </div>
          )}
        </motion.div>

        {/* 服务商表单弹窗 */}
        {showProviderForm && (
          <ProviderForm
            provider={editingProvider}
            onSave={handleSaveProvider}
            onCancel={() => {
              setShowProviderForm(false);
              setEditingProvider(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ProviderManagement;