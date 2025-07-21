import React, { useState, useEffect } from 'react';
import { Calculator, Package, DollarSign } from 'lucide-react';

/**
 * 优化的价格计算器组件
 * 用于FSA弹窗中的价格查询和计算
 */
const OptimizedPriceCalculator = ({ regionConfig, fsaCode }) => {
  const [customWeight, setCustomWeight] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);

  // 获取前3个活跃的重量区间
  const getTopThreeRanges = () => {
    if (!regionConfig || !regionConfig.weightRanges) return [];
    
    return regionConfig.weightRanges
      .filter(range => range.isActive)
      .sort((a, b) => a.min - b.min)
      .slice(0, 3);
  };

  // 根据重量计算价格
  const calculatePriceForWeight = (weight) => {
    if (!regionConfig || !regionConfig.weightRanges || !weight) return null;
    
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0) return null;

    // 找到匹配的重量区间
    const matchingRange = regionConfig.weightRanges
      .filter(range => range.isActive)
      .find(range => weightNum >= range.min && weightNum <= range.max);

    return matchingRange;
  };

  // 处理自定义重量输入
  const handleWeightChange = (value) => {
    setCustomWeight(value);
    
    if (value.trim()) {
      const range = calculatePriceForWeight(value);
      if (range) {
        setCalculatedPrice(range.price);
        setSelectedRange(range);
      } else {
        setCalculatedPrice(null);
        setSelectedRange(null);
      }
    } else {
      setCalculatedPrice(null);
      setSelectedRange(null);
    }
  };

  const topRanges = getTopThreeRanges();

  return (
    <div className="space-y-4">
      {/* 简化的价格表 - 只显示前3个区间 */}
      {topRanges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-blue-400" />
            <h4 className="text-white font-medium text-sm">常用重量区间</h4>
          </div>
          
          <div className="space-y-2">
            {topRanges.map((range, index) => (
              <div
                key={range.id || index}
                className="flex justify-between items-center p-2 bg-gray-800/50 rounded-lg border border-gray-700/50"
              >
                <span className="text-gray-300 text-sm">{range.label}</span>
                <span className="text-green-400 font-semibold text-sm">
                  ${range.price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          {regionConfig.weightRanges.filter(r => r.isActive).length > 3 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              +{regionConfig.weightRanges.filter(r => r.isActive).length - 3} 个更多区间
            </p>
          )}
        </div>
      )}

      {/* 自定义重量查询 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-green-400" />
          <h4 className="text-white font-medium text-sm">自定义重量查询</h4>
        </div>
        
        <div className="space-y-3">
          <div className="relative">
            <input
              type="number"
              value={customWeight}
              onChange={(e) => handleWeightChange(e.target.value)}
              placeholder="输入包裹重量"
              min="0"
              step="0.1"
              className="w-full px-3 py-2 bg-gray-800/70 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:border-blue-400 focus:outline-none"
            />
            <span className="absolute right-3 top-2 text-gray-400 text-sm">KG</span>
          </div>
          
          {/* 计算结果显示 */}
          {customWeight && (
            <div className="p-3 bg-gradient-to-r from-blue-900/30 to-green-900/30 border border-blue-500/30 rounded-lg">
              {calculatedPrice !== null ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300 text-sm">计算结果:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-bold text-lg">
                        {calculatedPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {selectedRange && (
                    <div className="text-xs text-gray-300">
                      <span className="text-gray-400">适用区间:</span> {selectedRange.label}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-400">
                    重量: {customWeight} KG • FSA: {fsaCode}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <span className="text-yellow-400 text-sm">⚠️ 超出配送重量范围</span>
                  <p className="text-xs text-gray-400 mt-1">请联系客服获取报价</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      <div className="text-xs text-gray-400 text-center p-2 bg-gray-800/30 rounded-lg">
        💡 输入包裹重量即可自动计算配送价格
      </div>
    </div>
  );
};

export default OptimizedPriceCalculator;
