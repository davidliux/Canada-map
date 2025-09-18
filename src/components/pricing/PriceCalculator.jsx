import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Package, TrendingUp, Info, ChevronRight } from 'lucide-react';
import pricingService from '../../services/pricingService';
import priceCalculationCache from '../../services/priceCalculationCache';

const PriceCalculator = ({ cityId, zoneId, className = '' }) => {
  const [quantity, setQuantity] = useState(1);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);

  // 常用数量快捷按钮
  const quickQuantities = [1, 2, 5, 10, 15, 20];

  useEffect(() => {
    if (cityId && zoneId && quantity > 0) {
      // 延迟计算，避免频繁请求
      const timer = setTimeout(() => {
        calculatePrice();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [quantity, cityId, zoneId]);

  const calculatePrice = async () => {
    if (!cityId || !zoneId || quantity <= 0) return;

    // 先检查缓存
    const cacheKey = priceCalculationCache.getCacheKey(cityId, zoneId, quantity, 'auto');
    const cachedResult = priceCalculationCache.get(cacheKey);

    if (cachedResult) {
      setResult(cachedResult);
      return;
    }

    setCalculating(true);
    setError(null);

    try {
      const response = await pricingService.calculatePrice(cityId, zoneId, quantity);
      if (response.success) {
        setResult(response.data);
        // 存入缓存
        priceCalculationCache.set(cacheKey, response.data);
      }
    } catch (err) {
      setError('价格计算失败，请重试');
      console.error('Error calculating price:', err);
    } finally {
      setCalculating(false);
    }
  };

  const compareQuantities = async () => {
    setCalculating(true);
    setError(null);

    try {
      const quantities = [1, 5, 10, 15, 20, 30];
      const comparisonResult = await pricingService.compareModePrices(cityId, zoneId, quantities);
      setComparison(comparisonResult);
    } catch (err) {
      setError('比较失败，请重试');
      console.error('Error comparing prices:', err);
    } finally {
      setCalculating(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2
    }).format(price || 0);
  };

  const getBreakdownIcon = (type) => {
    switch (type) {
      case 'firstPallet':
      case 'additionalPallet':
        return Package;
      case 'bulkDiscount':
        return TrendingUp;
      case 'surcharge':
        return DollarSign;
      default:
        return Info;
    }
  };

  return (
    <div className={`bg-gray-900 rounded-xl ${className}`}>
      {/* 头部 */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">价格计算器</h3>
              <p className="text-sm text-gray-400">
                {cityId} - {zoneId}
              </p>
            </div>
          </div>
          <button
            onClick={compareQuantities}
            className="px-4 py-2 text-sm bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors"
          >
            批量比价
          </button>
        </div>

        {/* 数量输入 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              托盘数量
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setQuantity('');
                  } else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num >= 0) {
                      setQuantity(num);
                    }
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === '' || parseInt(e.target.value) < 1) {
                    setQuantity(1);
                  }
                }}
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-lg font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <button
                onClick={() => {
                  const currentVal = quantity === '' ? 1 : quantity;
                  setQuantity(Math.max(1, currentVal - 1));
                }}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
              >
                -
              </button>
              <button
                onClick={() => {
                  const currentVal = quantity === '' ? 0 : quantity;
                  setQuantity(Math.min(999, currentVal + 1));
                }}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg"
              >
                +
              </button>
            </div>
          </div>

          {/* 快捷按钮 */}
          <div className="flex flex-wrap gap-2">
            {quickQuantities.map((q) => (
              <button
                key={q}
                onClick={() => setQuantity(q)}
                className={`px-3 py-1 rounded-lg text-sm transition-all ${
                  quantity === q
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {q}板
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 计算结果 */}
      {result && !calculating && (
        <div className="p-6 space-y-6">
          {/* 总价显示 */}
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">总价</p>
                <p className="text-3xl font-bold text-white">
                  {formatPrice(result.finalPrice)}
                </p>
                {result.basePrice !== result.finalPrice && (
                  <p className="text-sm text-gray-400 line-through mt-1">
                    原价：{formatPrice(result.basePrice)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">单价</p>
                <p className="text-xl font-semibold text-cyan-400">
                  {formatPrice(result.finalPrice / quantity)}/板
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  模式：{result.mode}
                </p>
              </div>
            </div>
          </div>

          {/* 价格明细 */}
          {result.breakdown && result.breakdown.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-300 mb-3">价格明细</h4>
              <div className="space-y-2">
                {result.breakdown.map((item, index) => {
                  const Icon = getBreakdownIcon(item.type);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-white">{item.description}</p>
                          {item.quantity && (
                            <p className="text-xs text-gray-400">
                              {item.quantity} × {formatPrice(item.unitPrice || 0)}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {formatPrice(item.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 推荐建议 */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">优惠建议</h4>
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-blue-300">
                  <ChevronRight className="w-4 h-4 mt-0.5" />
                  <div>
                    <p>{rec.message}</p>
                    {rec.potentialSaving && (
                      <p className="text-xs text-blue-400 mt-1">
                        可节省：{formatPrice(rec.potentialSaving)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 加载状态 */}
      {calculating && (
        <div className="p-12 text-center">
          <div className="inline-flex items-center gap-2 text-gray-400">
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span>计算中...</span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-6">
          <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* 批量比价结果 */}
      {comparison && (
        <div className="p-6 border-t border-gray-800">
          <h4 className="text-sm font-semibold text-gray-300 mb-4">批量价格对比</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-800">
                  <th className="text-left pb-2">数量</th>
                  <th className="text-right pb-2">总价</th>
                  <th className="text-right pb-2">单价</th>
                  <th className="text-left pb-2 pl-4">模式</th>
                </tr>
              </thead>
              <tbody>
                {comparison.comparisons?.map((item, index) => (
                  <tr
                    key={index}
                    className="text-sm border-b border-gray-800/50 hover:bg-gray-800/30"
                  >
                    <td className="py-2 text-white">{item.quantity}板</td>
                    <td className="py-2 text-right text-white font-medium">
                      {formatPrice(item.finalPrice)}
                    </td>
                    <td className="py-2 text-right text-gray-400">
                      {formatPrice(item.finalPrice / item.quantity)}
                    </td>
                    <td className="py-2 pl-4 text-gray-400">{item.mode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 缓存统计 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
          缓存统计：{priceCalculationCache.getStats().hitRate} 命中率
        </div>
      )}
    </div>
  );
};

export default PriceCalculator;