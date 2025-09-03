import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  X,
  Save,
  Settings,
  DollarSign,
  Mail,
  AlertCircle,
  CheckCircle,
  Database,
  RefreshCw
} from 'lucide-react';
import RegionSelector from './RegionSelector';
import RegionPriceManager from './RegionPriceManager';
import DirectPostalCodeManager from './DirectPostalCodeManager';
import BatchPriceManager from './BatchPriceManager';
import compatLayer from '../utils/unifiedStorageCompat';
import {
  getRegionDisplayInfo
} from '../data/regionManagement.js';
import { notifyRegionUpdate, notifyGlobalRefresh } from '../utils/dataUpdateNotifier';

/**
 * 区域管理面板组件
 * 实现三级导航：区域选择 → FSA管理 → 邮编/价格配置
 */
const RegionManagementPanel = ({ 
  onClose, 
  onConfigChange,
  className = '' 
}) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activeTab, setActiveTab] = useState('postal'); // 'postal' | 'pricing' | 'batch'

  // 调试：监听状态变化
  useEffect(() => {
    console.log('RegionManagementPanel状态更新:', {
      selectedRegion,
      activeTab
    });
  }, [selectedRegion, activeTab]);
  const [regionConfigs, setRegionConfigs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [storageStats, setStorageStats] = useState({});

  // 初始化数据
  useEffect(() => {
    initializeData();
  }, []);

  /**
   * 初始化数据
   */
  const initializeData = async () => {
    setIsLoading(true);
    try {
      console.log('开始初始化区域管理数据...');
      await loadData();
    } catch (error) {
      console.error('初始化数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 加载数据
   */
  const loadData = async () => {
    try {
      console.log('开始加载区域管理数据...');

      // 使用兼容层获取数据
      const regions = compatLayer.getAllRegionConfigsSync();
      const stats = compatLayer.getStorageStats();

      console.log('数据加载完成:', { regions, stats });

      setRegionConfigs(regions);
      setStorageStats(stats);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  };

  // 删除迁移相关函数 - 使用统一存储架构，不再需要数据迁移

  /**
   * 处理区域选择
   */
  const handleRegionSelect = (regionId) => {
    setSelectedRegion(regionId);
    setActiveTab('postal'); // 默认显示邮编管理
  };

  /**
   * 处理价格配置变更
   */
  const handlePriceChange = (updatedRegionConfig) => {
    setRegionConfigs(prev => ({
      ...prev,
      [selectedRegion]: updatedRegionConfig
    }));

    // 通知父组件
    onConfigChange?.(updatedRegionConfig);

    // 通知全局数据更新
    notifyRegionUpdate(selectedRegion, 'pricing', updatedRegionConfig);
  };

  /**
   * 处理邮编配置变更
   */
  const handlePostalCodeChange = (regionId, updatedPostalCodes) => {
    console.log(`区域 ${regionId} 邮编更新:`, updatedPostalCodes);

    // 通知父组件
    onConfigChange?.({ regionId, postalCodes: updatedPostalCodes });

    // 通知全局数据更新
    notifyRegionUpdate(regionId, 'postalCodes', { postalCodes: updatedPostalCodes });
  };

  /**
   * 刷新数据
   */
  const handleRefresh = () => {
    loadData();
    // 通知全局刷新
    notifyGlobalRefresh();
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl p-8 text-center ${className}`}>
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-300 font-medium">初始化区域管理系统...</p>
      </div>
    );
  }

  return (
    <>
      {/* 主面板 */}
      <div className={`bg-gray-800/95 backdrop-blur-md border border-gray-700/50 rounded-2xl shadow-2xl ${className}`}>
        {/* 头部 */}
        <div className="p-6 border-b border-gray-700/50 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <MapPin className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  配送区域管理
                </h2>
                <p className="text-gray-300 mt-1">
                  管理1-8区配送区域的FSA分配和价格配置
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 刷新按钮 */}
              <button
                onClick={handleRefresh}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
                title="刷新数据"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 区域选择器 */}
        <div className="p-6 border-b border-gray-700/50">
          <RegionSelector
            selectedRegion={selectedRegion}
            onRegionSelect={handleRegionSelect}
          />
        </div>

        {/* 主要功能区 */}
        {selectedRegion && (
          <div className="p-6">
            {/* 当前选择状态显示 */}
            <div className="mb-6 p-4 bg-gray-900/50 border border-blue-500/20 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-400 font-medium">当前选择:</span>
                  </div>
                  <span className="text-blue-400 font-semibold">
                    区域: {getRegionDisplayInfo(selectedRegion).name}
                  </span>
                </div>
                <div className="text-gray-400">
                  直接管理该区域的三位数邮编
                </div>
              </div>
            </div>

            {/* 功能标签页导航 */}
            <div className="mb-6">
              <div className="flex space-x-2 bg-gray-900/50 rounded-xl p-2">
                <button
                  onClick={() => setActiveTab('postal')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'postal'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  邮编管理
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'pricing'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  价格配置
                </button>
                <button
                  onClick={() => setActiveTab('batch')}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    activeTab === 'batch'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                  }`}
                >
                  <Database className="w-4 h-4 inline mr-2" />
                  批量管理
                </button>
              </div>
            </div>

            {/* 功能内容区 */}
            <AnimatePresence mode="wait">
              {activeTab === 'postal' && (
                <motion.div
                  key="postal"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <DirectPostalCodeManager
                    selectedRegion={selectedRegion}
                    onPostalCodeChange={handlePostalCodeChange}
                  />
                </motion.div>
              )}

              {activeTab === 'pricing' && (
                <motion.div
                  key="pricing"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <RegionPriceManager
                    selectedRegion={selectedRegion}
                    onPriceChange={handlePriceChange}
                  />
                </motion.div>
              )}

              {activeTab === 'batch' && (
                <motion.div
                  key="batch"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <BatchPriceManager
                    onConfigChange={onConfigChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 底部状态栏 */}
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-400">
              <span className="font-medium">系统版本: <span className="text-blue-400">v2.0.0</span></span>
              <span className="text-gray-600">•</span>
              <span>活跃区域: <span className="text-green-400 font-semibold">{storageStats.activeRegions}</span>/{storageStats.regionCount}</span>
              <span className="text-gray-600">•</span>
              <span>已分配FSA: <span className="text-purple-400 font-semibold">{storageStats.assignedFSAs}</span></span>
              {/* 调试信息 */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="text-yellow-400">
                    调试: 区域={selectedRegion || '无'} 标签={activeTab}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-xs font-medium">系统正常</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// 删除MigrationDialog组件 - 使用统一存储架构，不再需要数据迁移

export default RegionManagementPanel;
