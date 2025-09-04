import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  Edit2, 
  X,
  TrendingUp,
  Calculator,
  Percent,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import RegionPriceManager from '../../components/RegionPriceManager';
import BatchPriceManager from '../../components/BatchPriceManager';
import { getAllRegionConfigs } from '../../utils/unifiedStorage';
import { apiGet } from '../../utils/apiClient';

const PriceSettings = () => {
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [expandedRegions, setExpandedRegions] = useState(new Set()); // 记录展开的区域
  const [showBatchManager, setShowBatchManager] = useState(false);
  const [priceStats, setPriceStats] = useState({
    totalRules: 0,
    averagePrice: 0,
    minPrice: 0,
    maxPrice: 0,
  });

  useEffect(() => {
    loadRegions();
  }, []);

  const loadRegions = async () => {
    try {
      // 直接从 Supabase 获取数据
      console.log('从 Supabase 加载价格配置...');
      const configsObj = await getAllRegionConfigs(true); // 使用异步调用并强制刷新
      const configs = Object.values(configsObj || {});
      
      // 确保每个区域都有正确的数据结构
      const normalizedConfigs = configs.map(config => ({
        ...config,
        weightRanges: config.weightRanges || [],
        postalCodes: config.postalCodes || []
      }));
      
      setRegions(normalizedConfigs);
      calculatePriceStats(normalizedConfigs);
    } catch (error) {
      console.error('加载价格配置失败:', error);
      setError('加载价格配置失败，请刷新页面重试');
    }
  };

  const calculatePriceStats = (configs) => {
    let totalRules = 0;
    let allPrices = [];

    configs.forEach(region => {
      if (region.weightRanges) {
        // 处理数组格式（API返回）或对象格式（本地存储）
        const ranges = Array.isArray(region.weightRanges) 
          ? region.weightRanges 
          : Object.values(region.weightRanges);
        
        ranges.forEach(range => {
          totalRules++;
          const price = parseFloat(range.price || 0);
          if (price > 0) {
            allPrices.push(price);
          }
        });
      }
    });

    const stats = {
      totalRules,
      averagePrice: allPrices.length > 0 
        ? (allPrices.reduce((a, b) => a + b, 0) / allPrices.length).toFixed(2)
        : 0,
      minPrice: allPrices.length > 0 ? Math.min(...allPrices).toFixed(2) : 0,
      maxPrice: allPrices.length > 0 ? Math.max(...allPrices).toFixed(2) : 0,
    };

    setPriceStats(stats);
  };

  const handleBatchAdjust = async (adjustmentType, percentage) => {
    if (window.confirm(`确定要对所有价格${adjustmentType === 'increase' ? '上调' : '下调'} ${percentage}% 吗？`)) {
      const adjustmentFactor = adjustmentType === 'increase' 
        ? (1 + percentage / 100) 
        : (1 - percentage / 100);
      
      const configsObj = await getAllRegionConfigs(); // 改为异步调用
      const updatedConfigs = {};
      
      Object.keys(configsObj).forEach(regionId => {
        const region = configsObj[regionId];
        const updatedRegion = { ...region };
        
        if (region.weightRanges) {
          Object.keys(region.weightRanges).forEach(rangeId => {
            const range = region.weightRanges[rangeId];
            if (range.price) {
              updatedRegion.weightRanges = {
                ...updatedRegion.weightRanges,
                [rangeId]: {
                  ...range,
                  price: (parseFloat(range.price) * adjustmentFactor).toFixed(2)
                }
              };
            }
          });
        }
        
        updatedConfigs[regionId] = updatedRegion;
      });
      
      // 保存更新后的配置
      const { saveAllRegionConfigs } = await import('../../utils/unifiedStorage');
      await saveAllRegionConfigs(updatedConfigs); // 使用异步保存
      loadRegions();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">价格配置</h2>
          <p className="mt-1 text-sm text-gray-400">
            管理区域价格规则和重量区间设置
          </p>
        </div>
      </div>

      {/* Price Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">价格规则总数</p>
              <p className="text-2xl font-bold text-white">{priceStats.totalRules}</p>
            </div>
            <Calculator className="w-8 h-8 text-blue-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">平均价格</p>
              <p className="text-2xl font-bold text-white">${priceStats.averagePrice}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">最低价格</p>
              <p className="text-2xl font-bold text-white">${priceStats.minPrice}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">最高价格</p>
              <p className="text-2xl font-bold text-white">${priceStats.maxPrice}</p>
            </div>
            <Percent className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Batch Operations */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">批量操作</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => handleBatchAdjust('increase', 5)}
            className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600/30 transition-colors"
          >
            全部价格上调 5%
          </button>
          <button 
            onClick={() => handleBatchAdjust('increase', 10)}
            className="px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/50 rounded-lg hover:bg-green-600/30 transition-colors"
          >
            全部价格上调 10%
          </button>
          <button 
            onClick={() => handleBatchAdjust('decrease', 5)}
            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            全部价格下调 5%
          </button>
          <button 
            onClick={() => handleBatchAdjust('decrease', 10)}
            className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600/30 transition-colors"
          >
            全部价格下调 10%
          </button>
          <button 
            onClick={() => setShowBatchManager(true)}
            className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/50 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2 inline-flex"
          >
            <Upload className="w-4 h-4" />
            批量导入/导出
          </button>
        </div>
      </div>

      {/* Regions Price Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">区域价格配置</h3>
        </div>
        <div className="divide-y divide-gray-700">
          {regions.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg mb-2">暂无区域数据</p>
              <p className="text-gray-500 text-sm">请先在"区域管理"中创建区域</p>
            </div>
          ) : (
            regions.map((region, index) => {
            // 处理数组格式（API返回）或对象格式（本地存储）
            const ranges = Array.isArray(region.weightRanges) 
              ? region.weightRanges 
              : Object.values(region.weightRanges || {});
            const rangeCount = ranges.length;
            
            return (
              <motion.div
                key={region.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-gray-700/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-medium text-white">{region.name}</h4>
                    <p className="text-sm text-gray-400">
                      {rangeCount} 个重量区间 | {region.postalCodes?.length || 0} 个邮编
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRegion(region.id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>编辑价格</span>
                  </button>
                </div>
                
                {rangeCount > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* 显示价格区间 - 根据是否展开决定显示数量 */}
                    {(expandedRegions.has(region.id) ? ranges : ranges.slice(0, 4)).map((range, idx) => (
                      <div key={range.id || `${region.id}-${idx}`} className="bg-gray-900 rounded-lg p-3">
                        <p className="text-xs text-gray-400 mb-1">
                          {range.rangeName || range.label || range.id || `${range.minWeight || range.min || 0}-${range.maxWeight || range.max || 0} KG`}
                        </p>
                        <p className="text-lg font-semibold text-white">
                          ${parseFloat(range.price || 0).toFixed(2)}
                        </p>
                        {range.isActive === false && (
                          <span className="text-xs text-red-400">未激活</span>
                        )}
                      </div>
                    ))}
                    {/* 更多/收起按钮 */}
                    {rangeCount > 4 && (
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedRegions);
                          if (newExpanded.has(region.id)) {
                            newExpanded.delete(region.id);
                          } else {
                            newExpanded.add(region.id);
                          }
                          setExpandedRegions(newExpanded);
                        }}
                        className="bg-gray-900 rounded-lg p-3 flex items-center justify-center hover:bg-gray-800 transition-colors cursor-pointer"
                      >
                        <p className="text-sm text-blue-400 hover:text-blue-300">
                          {expandedRegions.has(region.id) 
                            ? '收起' 
                            : `+${rangeCount - 4} 更多`}
                        </p>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-900/50 rounded-lg p-6 text-center">
                    <p className="text-gray-500">暂无价格配置</p>
                    <p className="text-sm text-gray-600 mt-1">点击"编辑价格"按钮添加价格区间</p>
                  </div>
                )}
              </motion.div>
            );
          })
          )}
        </div>
      </div>

      {/* Batch Manager Modal */}
      {showBatchManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                批量价格管理
              </h3>
              <button
                onClick={() => setShowBatchManager(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <BatchPriceManager
              onConfigChange={() => {
                loadRegions();
                setShowBatchManager(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Price Manager Modal */}
      {selectedRegion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">
                编辑价格 - {selectedRegion.name}
              </h3>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <RegionPriceManager
              selectedRegion={selectedRegion}
              onSave={() => {
                setSelectedRegion(null);
                loadRegions();
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default PriceSettings;