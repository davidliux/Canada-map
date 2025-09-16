import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator,
  Weight,
  DollarSign,
  Package,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import {
  findPriceByWeight,
  calculateBatchPrices,
  calculateMultiRegionPrices,
  getRegionPriceRanges,
  getPriceCalculationStats
} from '../../utils/truck/truckPriceCalculator.js';

/**
 * 价格计算器演示组件
 * 用于测试和展示价格计算功能
 */
const PriceCalculatorDemo = ({ 
  availableRegions = [],
  className = '' 
}) => {
  const [selectedRegion, setSelectedRegion] = useState('');
  const [weight, setWeight] = useState('');
  const [batchWeights, setBatchWeights] = useState('');
  const [singleResult, setSingleResult] = useState(null);
  const [batchResult, setBatchResult] = useState(null);
  const [multiRegionResult, setMultiRegionResult] = useState(null);
  const [priceRangeInfo, setPriceRangeInfo] = useState(null);
  const [calculationStats, setCalculationStats] = useState(null);
  const [activeDemo, setActiveDemo] = useState('single');

  // 加载整体统计信息
  useEffect(() => {
    const loadStats = () => {
      const stats = getPriceCalculationStats();
      setCalculationStats(stats);
    };
    
    loadStats();
    // 每5秒刷新统计信息
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  // 加载区域价格区间信息
  useEffect(() => {
    if (selectedRegion) {
      const rangeInfo = getRegionPriceRanges(selectedRegion);
      setPriceRangeInfo(rangeInfo);
    } else {
      setPriceRangeInfo(null);
    }
  }, [selectedRegion]);

  // 单个价格计算
  const handleSingleCalculation = () => {
    if (!selectedRegion || !weight) {
      alert('请选择区域并输入重量');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('请输入有效的重量值');
      return;
    }

    const result = findPriceByWeight(selectedRegion, weightNum);
    setSingleResult(result);
  };

  // 批量价格计算
  const handleBatchCalculation = () => {
    if (!selectedRegion || !batchWeights) {
      alert('请选择区域并输入重量列表');
      return;
    }

    try {
      const weights = batchWeights
        .split(',')
        .map(w => parseFloat(w.trim()))
        .filter(w => !isNaN(w) && w > 0);

      if (weights.length === 0) {
        alert('请输入有效的重量值（用逗号分隔）');
        return;
      }

      const result = calculateBatchPrices(selectedRegion, weights);
      setBatchResult(result);
    } catch (error) {
      alert('批量计算失败：' + error.message);
    }
  };

  // 多区域价格计算
  const handleMultiRegionCalculation = () => {
    if (!weight || availableRegions.length === 0) {
      alert('请输入重量并确保有可用区域');
      return;
    }

    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) {
      alert('请输入有效的重量值');
      return;
    }

    const regionIds = availableRegions.map(r => r.id);
    const result = calculateMultiRegionPrices(regionIds, weightNum);
    setMultiRegionResult(result);
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* 标题栏 */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calculator className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">价格计算器演示</h2>
              <p className="text-sm text-gray-400">
                测试和验证价格计算功能
              </p>
            </div>
          </div>
        </div>

        {/* 整体统计信息 */}
        {calculationStats && (
          <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="text-white font-medium">{calculationStats.totalRegions}</div>
              <div className="text-gray-400">总区域</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 font-medium">{calculationStats.availableRegions}</div>
              <div className="text-gray-400">可计算</div>
            </div>
            <div className="text-center">
              <div className="text-red-400 font-medium">{calculationStats.unavailableRegions}</div>
              <div className="text-gray-400">不可用</div>
            </div>
            <div className="text-center">
              <div className="text-white font-medium">{calculationStats.pricedRanges}</div>
              <div className="text-gray-400">已定价区间</div>
            </div>
            <div className="text-center">
              <div className="text-white font-medium">{calculationStats.averageRangesPerRegion}</div>
              <div className="text-gray-400">平均区间数</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* 演示模式选择 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveDemo('single')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeDemo === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              单个计算
            </button>
            <button
              onClick={() => setActiveDemo('batch')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeDemo === 'batch'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              批量计算
            </button>
            <button
              onClick={() => setActiveDemo('multi')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeDemo === 'multi'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              多区域对比
            </button>
          </div>
        </div>

        {/* 基本参数 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* 区域选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              选择区域
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-md 
                       text-white p-2 text-sm"
            >
              <option value="">请选择区域</option>
              {availableRegions.map(region => (
                <option key={region.id} value={region.id}>
                  {region.name} (Level {region.level})
                </option>
              ))}
            </select>
          </div>

          {/* 重量输入 */}
          {(activeDemo === 'single' || activeDemo === 'multi') && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                重量 (KG)
              </label>
              <div className="relative">
                <Weight className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-600 
                           rounded-md text-white placeholder-gray-400 text-sm"
                  placeholder="输入重量"
                />
              </div>
            </div>
          )}

          {/* 批量重量输入 */}
          {activeDemo === 'batch' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                重量列表 (用逗号分隔)
              </label>
              <textarea
                value={batchWeights}
                onChange={(e) => setBatchWeights(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md 
                         text-white placeholder-gray-400 text-sm"
                placeholder="例如: 10.5, 25.2, 45.8, 62.1"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* 区域价格区间信息 */}
        {priceRangeInfo && (
          <div className="mb-6 bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-white mb-3">区域价格信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">重量范围</div>
                <div className="text-white font-medium">
                  {priceRangeInfo.minWeight}kg - {priceRangeInfo.maxWeight}kg
                </div>
              </div>
              <div>
                <div className="text-gray-400">价格范围</div>
                <div className="text-green-400 font-medium">
                  ${priceRangeInfo.minPrice} - ${priceRangeInfo.maxPrice}
                </div>
              </div>
              <div>
                <div className="text-gray-400">活跃区间</div>
                <div className="text-white font-medium">
                  {priceRangeInfo.activeRanges}/{priceRangeInfo.totalRanges}
                </div>
              </div>
              <div>
                <div className="text-gray-400">已定价</div>
                <div className="text-blue-400 font-medium">
                  {priceRangeInfo.pricedRanges}/{priceRangeInfo.totalRanges}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 计算按钮 */}
        <div className="mb-6">
          {activeDemo === 'single' && (
            <button
              onClick={handleSingleCalculation}
              disabled={!selectedRegion || !weight}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 
                       disabled:bg-gray-600 text-white rounded-md transition-colors 
                       flex items-center justify-center space-x-2"
            >
              <Calculator className="w-4 h-4" />
              <span>计算价格</span>
            </button>
          )}

          {activeDemo === 'batch' && (
            <button
              onClick={handleBatchCalculation}
              disabled={!selectedRegion || !batchWeights}
              className="w-full md:w-auto px-6 py-2 bg-green-600 hover:bg-green-700 
                       disabled:bg-gray-600 text-white rounded-md transition-colors 
                       flex items-center justify-center space-x-2"
            >
              <Package className="w-4 h-4" />
              <span>批量计算</span>
            </button>
          )}

          {activeDemo === 'multi' && (
            <button
              onClick={handleMultiRegionCalculation}
              disabled={!weight || availableRegions.length === 0}
              className="w-full md:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 
                       disabled:bg-gray-600 text-white rounded-md transition-colors 
                       flex items-center justify-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>多区域对比</span>
            </button>
          )}
        </div>

        {/* 结果显示 */}
        <div className="space-y-4">
          {/* 单个计算结果 */}
          {activeDemo === 'single' && singleResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-600"
            >
              <div className="flex items-center space-x-2 mb-3">
                {singleResult.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                )}
                <h3 className="font-medium text-white">计算结果</h3>
              </div>

              {singleResult.isValid ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">区域</div>
                    <div className="text-white font-medium">{singleResult.regionName}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">重量</div>
                    <div className="text-white font-medium">{singleResult.weight}kg</div>
                  </div>
                  <div>
                    <div className="text-gray-400">价格</div>
                    <div className="text-green-400 font-bold text-lg">
                      ${singleResult.price}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">重量区间</div>
                    <div className="text-blue-400 font-medium">{singleResult.range?.label}</div>
                  </div>
                </div>
              ) : (
                <div className="text-red-300">
                  {singleResult.error || '价格计算失败'}
                </div>
              )}
            </motion.div>
          )}

          {/* 批量计算结果 */}
          {activeDemo === 'batch' && batchResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-600"
            >
              <h3 className="font-medium text-white mb-3">批量计算结果</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <div className="text-gray-400">总数量</div>
                  <div className="text-white font-medium">{batchResult.summary.total}</div>
                </div>
                <div>
                  <div className="text-gray-400">成功</div>
                  <div className="text-green-400 font-medium">{batchResult.summary.successful}</div>
                </div>
                <div>
                  <div className="text-gray-400">失败</div>
                  <div className="text-red-400 font-medium">{batchResult.summary.failed}</div>
                </div>
                <div>
                  <div className="text-gray-400">平均价格</div>
                  <div className="text-blue-400 font-medium">${batchResult.summary.averagePrice}</div>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {batchResult.results.map((result, index) => (
                    <div 
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-700 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        {result.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-white">{result.weight}kg</span>
                        {result.range && (
                          <span className="text-gray-400 text-xs">({result.range.label})</span>
                        )}
                      </div>
                      <div className={result.isValid ? 'text-green-400 font-medium' : 'text-red-400'}>
                        {result.isValid ? `$${result.price}` : '计算失败'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 多区域对比结果 */}
          {activeDemo === 'multi' && multiRegionResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-4 border border-gray-600"
            >
              <h3 className="font-medium text-white mb-3">多区域价格对比</h3>
              
              {multiRegionResult.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <div className="text-gray-400">对比区域</div>
                    <div className="text-white font-medium">{multiRegionResult.summary.totalRegions}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">最低价格</div>
                    <div className="text-green-400 font-medium">
                      ${multiRegionResult.summary.minPrice || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">最高价格</div>
                    <div className="text-red-400 font-medium">
                      ${multiRegionResult.summary.maxPrice || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-400">平均价格</div>
                    <div className="text-blue-400 font-medium">
                      ${multiRegionResult.summary.avgPrice || 0}
                    </div>
                  </div>
                </div>
              )}

              <div className="max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {Object.values(multiRegionResult.results).map((result) => (
                    <div 
                      key={result.regionId}
                      className="flex justify-between items-center p-2 bg-gray-700 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        {result.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        )}
                        <span className="text-white">{result.regionName}</span>
                        {result.range && (
                          <span className="text-gray-400 text-xs">({result.range.label})</span>
                        )}
                      </div>
                      <div className={result.isValid ? 'text-green-400 font-medium' : 'text-red-400'}>
                        {result.isValid ? `$${result.price}` : '无价格'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriceCalculatorDemo;