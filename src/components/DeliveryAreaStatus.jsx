import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Package, 
  TrendingUp, 
  Eye, 
  EyeOff,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { getDeliveryAreaStats, getAllDeliveryFSAs } from '../utils/deliveryAreaFilter.js';
import { dataUpdateNotifier } from '../utils/dataUpdateNotifier';

/**
 * 配送区域状态显示组件
 * 显示配送区域的统计信息和筛选状态
 */
const DeliveryAreaStatus = ({ 
  isVisible = true, 
  onToggleVisibility,
  selectedRegions = [],
  className = '' 
}) => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // 加载统计数据
  useEffect(() => {
    loadStats();
  }, [selectedRegions]);

  // 监听数据更新
  useEffect(() => {
    const unsubscribe = dataUpdateNotifier.subscribe((updateInfo) => {
      if (updateInfo.type === 'regionUpdate' || updateInfo.type === 'globalRefresh') {
        console.log('🔄 配送区域状态更新');
        loadStats();
      }
    });

    return unsubscribe;
  }, []);

  const loadStats = () => {
    setIsLoading(true);
    try {
      const deliveryStats = getDeliveryAreaStats();
      const deliveryFSAs = getAllDeliveryFSAs();

      setStats({
        ...deliveryStats,
        totalDeliveryFSAs: deliveryFSAs.size,
        selectedRegionCount: selectedRegions.length
      });
    } catch (error) {
      console.error('❌ 加载配送区域统计失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-gray-800/90 backdrop-blur-sm border border-gray-600/50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-400 text-sm">加载配送区域状态...</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-sm border border-blue-500/30 rounded-lg shadow-xl ${className}`}
    >
      {/* 主要状态栏 */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-white font-medium text-sm">配送区域状态</span>
            </div>
            
            {/* 可见性切换 */}
            {onToggleVisibility && (
              <button
                onClick={onToggleVisibility}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title={isVisible ? "隐藏未配送区域" : "显示未配送区域"}
              >
                {isVisible ? (
                  <Eye className="w-4 h-4 text-green-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
            )}
          </div>

          {/* 展开/收起按钮 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <Info className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* 基础统计 */}
        <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
          <div className="text-center">
            <div className="text-blue-400 font-semibold">{stats.activeRegions}</div>
            <div className="text-gray-400">活跃区域</div>
          </div>
          <div className="text-center">
            <div className="text-green-400 font-semibold">{stats.totalDeliveryFSAs}</div>
            <div className="text-gray-400">配送FSA</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 font-semibold">
              {selectedRegions.length > 0 ? selectedRegions.length : 'ALL'}
            </div>
            <div className="text-gray-400">显示区域</div>
          </div>
        </div>

        {/* 筛选状态指示 */}
        {selectedRegions.length > 0 && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-yellow-400">区域筛选已启用</span>
          </div>
        )}
      </div>

      {/* 详细信息（展开时显示） */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-600/50 p-3"
        >
          <h4 className="text-white font-medium text-sm mb-3">区域详情</h4>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(stats.regionDetails).map(([regionId, detail]) => (
              <div
                key={regionId}
                className={`flex items-center justify-between p-2 rounded text-xs ${
                  selectedRegions.includes(regionId)
                    ? 'bg-blue-600/20 border border-blue-500/30'
                    : 'bg-gray-700/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    detail.isActive ? 'bg-green-400' : 'bg-gray-500'
                  }`}></div>
                  <span className="text-white">{detail.name}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{detail.fsaCount} FSA</span>
                  
                  {detail.hasWeightRanges ? (
                    <CheckCircle className="w-3 h-3 text-green-400" title="已配置价格" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-yellow-400" title="未配置价格" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 统计摘要 */}
          <div className="mt-3 pt-3 border-t border-gray-600/50">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-400">总区域数:</span>
                <span className="text-white ml-1">{stats.totalRegions}</span>
              </div>
              <div>
                <span className="text-gray-400">覆盖率:</span>
                <span className="text-green-400 ml-1">
                  {stats.totalRegions > 0 ? Math.round((stats.activeRegions / stats.totalRegions) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* 筛选提示 */}
          <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/20 rounded text-xs">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-blue-300">
                {selectedRegions.length > 0 ? (
                  <span>当前只显示选中区域的FSA。清除区域筛选可查看所有配送区域。</span>
                ) : (
                  <span>当前显示所有配送区域的FSA。使用区域筛选可查看特定区域。</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DeliveryAreaStatus;
