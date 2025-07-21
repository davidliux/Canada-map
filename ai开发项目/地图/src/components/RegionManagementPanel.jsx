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
import { localStorageAdapter } from '../utils/localStorageAdapter.js';
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

      // 使用localStorage存储架构获取数据
      const regions = await localStorageAdapter.getAllRegionConfigs();
      const stats = localStorageAdapter.getSyncStatus();

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
      <div className={`bg-cyber-gray/95 backdrop-blur-md border border-cyber-blue/30 rounded-xl shadow-2xl p-8 text-center ${className}`}>
        <div className="animate-spin w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-300">初始化区域管理系统...</p>
      </div>
    );
  }

  return (
    <>
      {/* 主面板 */}
      <div className={`bg-cyber-gray/95 backdrop-blur-md border border-cyber-blue/30 rounded-xl shadow-2xl ${className}`}>
        {/* 头部 */}
        <div className="p-6 border-b border-cyber-blue/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyber-blue/20 rounded-lg">
                <MapPin className="w-6 h-6 text-cyber-blue" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">配送区域管理</h2>
                <p className="text-gray-300">
                  管理1-8区配送区域的FSA分配和价格配置
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* 刷新按钮 */}
              <button
                onClick={handleRefresh}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
                title="刷新数据"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 区域选择器 */}
        <div className="p-6 border-b border-cyber-blue/20">
          <RegionSelector
            selectedRegion={selectedRegion}
            onRegionSelect={handleRegionSelect}
          />
        </div>

        {/* 主要功能区 */}
        {selectedRegion && (
          <div className="p-6">
            {/* 当前选择状态显示 */}
            <div className="mb-4 p-3 bg-cyber-gray/10 border border-cyber-blue/10 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-gray-400">当前选择:</span>
                  <span className="text-cyber-blue font-medium">
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
              <div className="flex space-x-1 bg-cyber-gray/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('postal')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'postal'
                      ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2" />
                  邮编管理
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'pricing'
                      ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  价格配置
                </button>
                <button
                  onClick={() => setActiveTab('batch')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'batch'
                      ? 'bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30'
                      : 'text-gray-400 hover:text-white'
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
        <div className="p-4 border-t border-cyber-blue/20 bg-cyber-gray/20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4 text-gray-400">
              <span>系统版本: v2.0.0</span>
              <span>•</span>
              <span>活跃区域: {storageStats.activeRegions}/{storageStats.regionCount}</span>
              <span>•</span>
              <span>已分配FSA: {storageStats.assignedFSAs}</span>
              {/* 调试信息 */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <span>•</span>
                  <span className="text-yellow-400">
                    调试: 区域={selectedRegion || '无'} 标签={activeTab}
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300 text-xs">系统正常</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// 删除MigrationDialog组件 - 使用统一存储架构，不再需要数据迁移

export default RegionManagementPanel;
