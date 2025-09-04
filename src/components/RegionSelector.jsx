import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ToggleLeft,
  ToggleRight,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import {
  saveRegionConfig,
  getAllRegionConfigs
} from '../utils/unifiedStorage.js';
import compatLayer from '../utils/unifiedStorageCompat';
import {
  getRegionDisplayInfo
} from '../data/regionManagement.js';

/**
 * 区域选择器组件
 * 实现1-8区的标签页导航和区域管理
 */
const RegionSelector = ({
  selectedRegion,
  onRegionSelect,
  className = ''
}) => {
  const [regionConfigs, setRegionConfigs] = useState({});
  const [regionStats, setRegionStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [storageStats, setStorageStats] = useState({});

  // 加载区域配置和统计信息
  useEffect(() => {
    loadRegionData();
  }, []); // 移除fsaConfigs依赖，使用统一存储架构

  /**
   * 加载区域数据
   */
  const loadRegionData = async () => {
    setIsLoading(true);
    try {
      console.log('开始加载区域数据...');

      // 优先从 Supabase 获取区域配置
      const configs = await getAllRegionConfigs(true); // 强制刷新
      setRegionConfigs(configs);

      console.log('区域配置加载完成:', configs);

      // 计算每个区域的统计信息
      const stats = {};
      // 为所有8个区域计算统计信息
      for (let i = 1; i <= 8; i++) {
        const regionId = i.toString();
        const regionStat = compatLayer.getRegionStats(regionId);
        stats[regionId] = regionStat;
        console.log(`区域 ${regionId} 统计信息:`, regionStat);
      }
      setRegionStats(stats);

      // 获取存储统计信息
      const storage = compatLayer.getStorageStats();
      setStorageStats(storage);

      console.log('区域数据加载完成:', { configs, stats, storage });

    } catch (error) {
      console.error('加载区域数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 切换区域启用状态
   */
  const handleToggleRegion = async (regionId) => {
    try {
      const config = regionConfigs[regionId];
      if (!config) return;

      const updatedConfig = {
        ...config,
        isActive: !config.isActive,
        lastUpdated: new Date().toISOString()
      };

      const success = saveRegionConfig(regionId, updatedConfig);
      if (success) {
        setRegionConfigs(prev => ({
          ...prev,
          [regionId]: updatedConfig
        }));
      }
    } catch (error) {
      console.error('切换区域状态失败:', error);
    }
  };

  /**
   * 获取区域状态指示器
   */
  const getRegionStatusIndicator = (regionId) => {
    const config = regionConfigs[regionId];
    const stats = regionStats[regionId];
    
    if (!config || !stats) {
      return { icon: AlertCircle, color: 'text-gray-400', label: '未配置' };
    }
    
    if (!config.isActive) {
      return { icon: ToggleLeft, color: 'text-gray-400', label: '已禁用' };
    }
    
    if (stats.totalFSAs === 0) {
      return { icon: AlertCircle, color: 'text-yellow-400', label: '无FSA' };
    }
    
    if (stats.activeFSAs === 0) {
      return { icon: AlertCircle, color: 'text-orange-400', label: 'FSA未激活' };
    }
    
    return { icon: CheckCircle, color: 'text-green-400', label: '正常运行' };
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-20 bg-gray-700 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和总体统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <MapPin className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              配送区域管理
            </h3>
            <p className="text-gray-300 text-sm mt-1">
              <span className="text-green-400 font-semibold">{storageStats.activeRegions}</span>/{storageStats.regionCount} 个区域活跃 • 
              <span className="text-purple-400 font-semibold"> {storageStats.assignedFSAs}</span> 个FSA已分配
            </p>
          </div>
        </div>
        
        {/* 系统状态指示器和刷新按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadRegionData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all duration-200 text-blue-400 hover:text-blue-300"
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">刷新</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 text-sm font-medium">系统正常</span>
          </div>
        </div>
      </div>

      {/* 区域标签页导航 */}
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(regionNum => {
          const regionId = regionNum.toString(); // 使用统一存储架构的区域ID格式
          const displayInfo = getRegionDisplayInfo(regionId);
          const config = regionConfigs[regionId];
          const stats = regionStats[regionId];
          const statusIndicator = getRegionStatusIndicator(regionId);
          const isSelected = selectedRegion === regionId;
          
          return (
            <motion.div
              key={regionId}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 backdrop-blur-sm ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
                  : config?.isActive
                  ? 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                  : 'border-gray-700 bg-gray-800/30 opacity-60'
              }`}
              onClick={() => onRegionSelect(regionId)}
            >
              {/* 区域颜色指示条 */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
                style={{ backgroundColor: displayInfo.color }}
              />
              
              <div className="p-4">
                {/* 区域标题和状态 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-lg">{displayInfo.name}</h4>
                    <statusIndicator.icon className={`w-4 h-4 ${statusIndicator.color}`} />
                  </div>
                  
                  {/* 启用/禁用切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRegion(regionId);
                    }}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      config?.isActive 
                        ? 'text-green-400 hover:bg-green-500/20 hover:text-green-300' 
                        : 'text-gray-400 hover:bg-gray-500/20 hover:text-gray-300'
                    }`}
                    title={config?.isActive ? '点击禁用' : '点击启用'}
                  >
                    {config?.isActive ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* 统计信息 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      FSA数量
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-semibold">
                      {stats?.totalFSAs || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      邮编数量
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300 font-semibold">
                      {stats?.totalPostalCodes || 0}
                    </span>
                  </div>
                  
                  {/* 价格范围 */}
                  {stats?.totalPrice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">价格范围</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-500/20 text-green-300 font-semibold">
                        ${(stats.totalPrice / (stats.activeWeightRanges || 1)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 状态标签 */}
                <div className="mt-4 flex items-center justify-between">
                  <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold border ${
                    config?.isActive 
                      ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                      : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                  }`}>
                    {statusIndicator.label}
                  </span>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3 h-3 bg-blue-400 rounded-full shadow-lg shadow-blue-400/50"
                    />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 选中区域详细信息 */}
      <AnimatePresence>
        {selectedRegion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-900/50 border border-blue-500/20 rounded-xl backdrop-blur-sm"
          >
            <RegionDetailPanel 
              regionId={selectedRegion}
              regionConfig={regionConfigs[selectedRegion]}
              regionStats={regionStats[selectedRegion]}
              onConfigUpdate={(updatedConfig) => {
                setRegionConfigs(prev => ({
                  ...prev,
                  [selectedRegion]: updatedConfig
                }));
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快速操作面板 */}
      <div className="grid grid-cols-3 gap-6 p-6 bg-gray-900/30 border border-gray-700/50 rounded-xl backdrop-blur-sm">
        <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
          <div className="text-3xl font-bold text-blue-400 mb-2">{storageStats.totalFSAs}</div>
          <div className="text-sm text-gray-300 font-medium">总FSA数量</div>
        </div>
        <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
          <div className="text-3xl font-bold text-green-400 mb-2">{storageStats.assignedFSAs}</div>
          <div className="text-sm text-gray-300 font-medium">已分配FSA</div>
        </div>
        <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
          <div className="text-3xl font-bold text-yellow-400 mb-2">{storageStats.unassignedFSAs}</div>
          <div className="text-sm text-gray-300 font-medium">未分配FSA</div>
        </div>
      </div>
    </div>
  );
};

/**
 * 区域详细信息面板
 */
const RegionDetailPanel = ({ 
  regionId, 
  regionConfig, 
  regionStats, 
  onConfigUpdate 
}) => {
  const displayInfo = getRegionDisplayInfo(regionId);
  
  if (!regionConfig) {
    return (
      <div className="text-center py-4">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-400">区域配置不存在</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 区域基本信息 */}
      <div className="flex items-center gap-4">
        <div 
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: displayInfo.color }}
        />
        <div>
          <h4 className="font-semibold text-white">{displayInfo.name}</h4>
          <p className="text-gray-400 text-sm">{displayInfo.description}</p>
        </div>
      </div>

      {/* 统计信息网格 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-3 bg-cyber-gray/30 rounded-lg">
          <div className="text-lg font-bold text-white">{regionStats?.totalFSAs || 0}</div>
          <div className="text-xs text-gray-400">总FSA</div>
        </div>
        <div className="text-center p-3 bg-cyber-gray/30 rounded-lg">
          <div className="text-lg font-bold text-green-400">{regionStats?.activeFSAs || 0}</div>
          <div className="text-xs text-gray-400">活跃FSA</div>
        </div>
        <div className="text-center p-3 bg-cyber-gray/30 rounded-lg">
          <div className="text-lg font-bold text-blue-400">{regionStats?.totalPostalCodes || 0}</div>
          <div className="text-xs text-gray-400">邮编数量</div>
        </div>
        <div className="text-center p-3 bg-cyber-gray/30 rounded-lg">
          <div className="text-lg font-bold text-purple-400">{regionStats?.activeWeightRanges || 0}</div>
          <div className="text-xs text-gray-400">价格区间</div>
        </div>
      </div>

      {/* 最后更新时间 */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>最后更新</span>
        <span>{new Date(regionConfig.lastUpdated).toLocaleString()}</span>
      </div>
    </div>
  );
};

export default RegionSelector;
