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
import { serverStorage } from '../utils/serverStorage.js';
import { getStorageStats, getRegionStats } from '../utils/unifiedStorage.js';
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

      // 获取区域配置（从服务器）
      const configs = await serverStorage.getAllRegionConfigs();
      setRegionConfigs(configs);

      console.log('区域配置加载完成:', configs);

      // 计算每个区域的统计信息
      const stats = {};
      // 为所有8个区域计算统计信息
      for (let i = 1; i <= 8; i++) {
        const regionId = i.toString();
        const config = configs[regionId] || {};
        const regionStat = getRegionStats(regionId, config);
        stats[regionId] = regionStat;
        console.log(`区域 ${regionId} 统计信息:`, regionStat);
      }
      setRegionStats(stats);

      // 获取存储统计信息
      const storage = getStorageStats();
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
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
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
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-blue/20 rounded-lg">
            <MapPin className="w-5 h-5 text-cyber-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">配送区域管理</h3>
            <p className="text-gray-400 text-sm">
              {storageStats.activeRegions}/{storageStats.regionCount} 个区域活跃 • 
              {storageStats.assignedFSAs} 个FSA已分配
            </p>
          </div>
        </div>
        
        {/* 系统状态指示器和刷新按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadRegionData}
            className="flex items-center gap-2 px-3 py-1 bg-cyber-blue/20 border border-cyber-blue/30 rounded-lg hover:bg-cyber-blue/30 transition-colors"
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4 text-cyber-blue" />
            <span className="text-cyber-blue text-sm font-medium">刷新</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
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
              className={`relative cursor-pointer rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-cyber-blue bg-cyber-blue/10 shadow-lg shadow-cyber-blue/20'
                  : config?.isActive
                  ? 'border-gray-600 bg-cyber-gray/30 hover:border-gray-500'
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
                    <h4 className="font-bold text-white">{displayInfo.name}</h4>
                    <statusIndicator.icon className={`w-4 h-4 ${statusIndicator.color}`} />
                  </div>
                  
                  {/* 启用/禁用切换 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleRegion(regionId);
                    }}
                    className={`p-1 rounded transition-colors ${
                      config?.isActive 
                        ? 'text-green-400 hover:bg-green-500/20' 
                        : 'text-gray-400 hover:bg-gray-500/20'
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
                    <span className="text-gray-400 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      FSA数量
                    </span>
                    <span className="text-white font-medium">
                      {stats?.totalFSAs || 0}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      邮编数量
                    </span>
                    <span className="text-white font-medium">
                      {stats?.totalPostalCodes || 0}
                    </span>
                  </div>
                  
                  {/* 价格范围 */}
                  {stats?.totalPrice > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">价格范围</span>
                      <span className="text-green-300 font-medium">
                        ${(stats.totalPrice / (stats.activeWeightRanges || 1)).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 状态标签 */}
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    config?.isActive 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {statusIndicator.label}
                  </span>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-cyber-blue rounded-full"
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
            className="p-4 bg-cyber-gray/20 border border-cyber-blue/20 rounded-lg"
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
      <div className="grid grid-cols-3 gap-4 p-4 bg-cyber-gray/10 border border-cyber-blue/10 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyber-blue">{storageStats.totalFSAs}</div>
          <div className="text-sm text-gray-400">总FSA数量</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{storageStats.assignedFSAs}</div>
          <div className="text-sm text-gray-400">已分配FSA</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{storageStats.unassignedFSAs}</div>
          <div className="text-sm text-gray-400">未分配FSA</div>
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
