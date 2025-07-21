import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Copy, 
  Percent, 
  Save, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import WeightRangeManager from './WeightRangeManager';
import {
  getAllRegionConfigs,
  saveRegionConfig
} from '../utils/unifiedStorage.js';
import { 
  copyRegionPricing, 
  adjustRegionPricing, 
  getRegionDisplayInfo 
} from '../data/regionManagement.js';

/**
 * 区域价格管理器组件
 * 支持区域级别的价格配置和批量操作
 */
const RegionPriceManager = ({ 
  selectedRegion, 
  onPriceChange,
  className = '' 
}) => {
  const [regionConfigs, setRegionConfigs] = useState({});
  const [currentConfig, setCurrentConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationResult, setOperationResult] = useState(null);
  const [showBatchOperations, setShowBatchOperations] = useState(false);
  const [batchSettings, setBatchSettings] = useState({
    sourceRegion: '',
    adjustmentPercentage: 0,
    selectedRanges: []
  });

  // 加载区域配置
  useEffect(() => {
    loadRegionConfigs();
  }, []);

  // 更新当前配置
  useEffect(() => {
    if (selectedRegion && regionConfigs[selectedRegion]) {
      setCurrentConfig(regionConfigs[selectedRegion]);
    } else {
      setCurrentConfig(null);
    }
  }, [selectedRegion, regionConfigs]);

  /**
   * 加载区域配置
   */
  const loadRegionConfigs = async () => {
    setIsLoading(true);
    try {
      const configs = getAllRegionConfigs();
      setRegionConfigs(configs);
    } catch (error) {
      console.error('加载区域配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 保存价格配置
   */
  const handleSavePricing = async (weightRanges) => {
    if (!selectedRegion || !currentConfig) return;

    try {
      const updatedConfig = {
        ...currentConfig,
        weightRanges,
        lastUpdated: new Date().toISOString()
      };

      const success = saveRegionConfig(selectedRegion, updatedConfig);
      if (success) {
        setCurrentConfig(updatedConfig);
        setRegionConfigs(prev => ({
          ...prev,
          [selectedRegion]: updatedConfig
        }));

        setOperationResult({
          type: 'success',
          message: '价格配置保存成功'
        });

        onPriceChange?.(updatedConfig);
      } else {
        setOperationResult({
          type: 'error',
          message: '价格配置保存失败'
        });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `保存失败: ${error.message}`
      });
    }
  };

  /**
   * 从其他区域复制价格
   */
  const handleCopyPricing = async (sourceRegionId) => {
    if (!selectedRegion || !currentConfig || !regionConfigs[sourceRegionId]) return;

    try {
      const sourceConfig = regionConfigs[sourceRegionId];
      const updatedConfig = copyRegionPricing(sourceConfig, currentConfig);

      const success = saveRegionConfig(selectedRegion, updatedConfig);
      if (success) {
        setCurrentConfig(updatedConfig);
        setRegionConfigs(prev => ({
          ...prev,
          [selectedRegion]: updatedConfig
        }));

        const sourceInfo = getRegionDisplayInfo(sourceRegionId);
        setOperationResult({
          type: 'success',
          message: `成功从${sourceInfo.name}复制价格配置`
        });

        onPriceChange?.(updatedConfig);
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `复制价格失败: ${error.message}`
      });
    }
  };

  /**
   * 批量调整价格
   */
  const handleBatchAdjustment = async () => {
    if (!selectedRegion || !currentConfig || batchSettings.adjustmentPercentage === 0) return;

    try {
      const updatedConfig = adjustRegionPricing(
        currentConfig, 
        batchSettings.adjustmentPercentage, 
        batchSettings.selectedRanges
      );

      const success = saveRegionConfig(selectedRegion, updatedConfig);
      if (success) {
        setCurrentConfig(updatedConfig);
        setRegionConfigs(prev => ({
          ...prev,
          [selectedRegion]: updatedConfig
        }));

        const direction = batchSettings.adjustmentPercentage > 0 ? '上调' : '下调';
        setOperationResult({
          type: 'success',
          message: `成功${direction}价格 ${Math.abs(batchSettings.adjustmentPercentage)}%`
        });

        onPriceChange?.(updatedConfig);
        setBatchSettings({ sourceRegion: '', adjustmentPercentage: 0, selectedRanges: [] });
      }
    } catch (error) {
      setOperationResult({
        type: 'error',
        message: `批量调整失败: ${error.message}`
      });
    }
  };

  /**
   * 获取价格统计信息
   */
  const getPriceStats = (weightRanges) => {
    if (!weightRanges || weightRanges.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0 };
    }

    const activePrices = weightRanges
      .filter(range => range.isActive)
      .map(range => range.price);

    if (activePrices.length === 0) {
      return { min: 0, max: 0, avg: 0, total: 0 };
    }

    return {
      min: Math.min(...activePrices),
      max: Math.max(...activePrices),
      avg: activePrices.reduce((sum, price) => sum + price, 0) / activePrices.length,
      total: activePrices.reduce((sum, price) => sum + price, 0)
    };
  };

  if (isLoading) {
    return (
      <div className={`p-6 text-center ${className}`}>
        <div className="animate-spin w-8 h-8 border-2 border-cyber-blue border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-gray-300">加载价格配置...</p>
      </div>
    );
  }

  if (!selectedRegion) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">选择配送区域</h3>
        <p className="text-gray-400">请先选择一个配送区域来管理价格配置</p>
      </div>
    );
  }

  if (!currentConfig) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-300 mb-2">配置不存在</h3>
        <p className="text-gray-400">选中的区域配置不存在</p>
      </div>
    );
  }

  const selectedRegionInfo = getRegionDisplayInfo(selectedRegion);
  const priceStats = getPriceStats(currentConfig.weightRanges);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和统计信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyber-blue/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-cyber-blue" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">区域价格管理</h3>
            <p className="text-gray-400 text-sm">
              当前区域：<span style={{ color: selectedRegionInfo.color }}>{selectedRegionInfo.name}</span>
            </p>
          </div>
        </div>
        
        {/* 快速操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchOperations(!showBatchOperations)}
            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 transition-colors text-sm"
          >
            批量操作
          </button>
        </div>
      </div>

      {/* 操作结果显示 */}
      <AnimatePresence>
        {operationResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-lg border ${
              operationResult.type === 'success' 
                ? 'bg-green-500/20 border-green-500/30' 
                : 'bg-red-500/20 border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {operationResult.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-green-300" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-300" />
              )}
              <span className={`text-sm ${
                operationResult.type === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {operationResult.message}
              </span>
              <button
                onClick={() => setOperationResult(null)}
                className="ml-auto text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 价格统计面板 */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-cyber-gray/20 border border-cyber-blue/20 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">${priceStats.min.toFixed(2)}</div>
          <div className="text-sm text-gray-400">最低价格</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">${priceStats.avg.toFixed(2)}</div>
          <div className="text-sm text-gray-400">平均价格</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">${priceStats.max.toFixed(2)}</div>
          <div className="text-sm text-gray-400">最高价格</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">${priceStats.total.toFixed(2)}</div>
          <div className="text-sm text-gray-400">总价格</div>
        </div>
      </div>

      {/* 批量操作面板 */}
      <AnimatePresence>
        {showBatchOperations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-cyber-gray/30 border border-cyber-blue/30 rounded-lg space-y-4"
          >
            <h4 className="font-semibold text-white">批量操作</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* 复制价格配置 */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-300">从其他区域复制价格</h5>
                <div className="flex gap-2">
                  <select
                    value={batchSettings.sourceRegion}
                    onChange={(e) => setBatchSettings(prev => ({ ...prev, sourceRegion: e.target.value }))}
                    className="flex-1 px-3 py-2 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white"
                  >
                    <option value="">选择源区域</option>
                    {Object.keys(regionConfigs)
                      .filter(regionId => regionId !== selectedRegion)
                      .map(regionId => {
                        const info = getRegionDisplayInfo(regionId);
                        return (
                          <option key={regionId} value={regionId}>{info.name}</option>
                        );
                      })}
                  </select>
                  <button
                    onClick={() => handleCopyPricing(batchSettings.sourceRegion)}
                    disabled={!batchSettings.sourceRegion}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-300 transition-colors disabled:opacity-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 批量价格调整 */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-300">批量价格调整</h5>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={batchSettings.adjustmentPercentage}
                      onChange={(e) => setBatchSettings(prev => ({ 
                        ...prev, 
                        adjustmentPercentage: parseFloat(e.target.value) || 0 
                      }))}
                      placeholder="调整百分比"
                      className="w-full px-3 py-2 pr-8 bg-cyber-gray/50 border border-cyber-blue/30 rounded text-white"
                      step="0.1"
                    />
                    <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <button
                    onClick={handleBatchAdjustment}
                    disabled={batchSettings.adjustmentPercentage === 0}
                    className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 rounded text-orange-300 transition-colors disabled:opacity-50"
                  >
                    {batchSettings.adjustmentPercentage > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
                  正数为上调，负数为下调。例如：10 表示上调10%，-5 表示下调5%
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 重量区间价格管理 */}
      <WeightRangeManager
        weightRanges={currentConfig.weightRanges || []}
        onChange={handleSavePricing}
      />

      {/* 操作历史 */}
      <div className="p-4 bg-cyber-gray/10 border border-cyber-blue/10 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-white">配置信息</h4>
          <div className="text-sm text-gray-400">
            最后更新：{currentConfig.lastUpdated ? new Date(currentConfig.lastUpdated).toLocaleString() : '未知'}
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">版本：</span>
            <span className="text-white">{currentConfig.metadata?.version || '1.0.0'}</span>
          </div>
          <div>
            <span className="text-gray-400">活跃区间：</span>
            <span className="text-white">
              {currentConfig.weightRanges?.filter(r => r.isActive).length || 0}/{currentConfig.weightRanges?.length || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-400">FSA数量：</span>
            <span className="text-white">{currentConfig.postalCodes?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionPriceManager;
