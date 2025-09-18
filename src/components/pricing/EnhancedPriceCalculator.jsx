import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  DollarSign,
  Package,
  TrendingUp,
  Info,
  ChevronRight,
  Minus,
  Plus,
  RefreshCw,
  BarChart3,
  Zap,
  CheckCircle
} from 'lucide-react';
import pricingService from '../../services/pricingService';
import priceCalculationCache from '../../services/priceCalculationCache';

/**
 * 增强版价格计算器组件
 * 提供快捷选择、实时计算、价格对比等功能
 */
const EnhancedPriceCalculator = ({
  cityId,
  zoneId,
  className = '',
  onPriceCalculated,
  showComparison = true,
  showRecommendations = true,
  compactMode = false
}) => {
  // 状态管理
  const [quantity, setQuantity] = useState(1);
  const [calculating, setCalculating] = useState(false);
  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState(null);
  const [selectedQuickOption, setSelectedQuickOption] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [animateValue, setAnimateValue] = useState(false);

  // 常用数量快捷按钮配置
  const quickQuantities = [
    { value: 1, label: '1板', highlight: false },
    { value: 2, label: '2板', highlight: false },
    { value: 5, label: '5板', highlight: false },
    { value: 10, label: '10板', highlight: true },
    { value: 15, label: '15板', highlight: true },
    { value: 20, label: '20板', highlight: true }
  ];

  // 价格计算
  useEffect(() => {
    if (cityId && zoneId && quantity > 0) {
      const timer = setTimeout(() => {
        calculatePrice();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [quantity, cityId, zoneId]);

  const calculatePrice = async () => {
    if (!cityId || !zoneId || quantity <= 0) return;

    // 检查缓存
    const cacheKey = priceCalculationCache.getCacheKey(cityId, zoneId, quantity, 'auto');
    const cachedResult = priceCalculationCache.get(cacheKey);

    if (cachedResult) {
      setResult(cachedResult);
      triggerAnimation();
      if (onPriceCalculated) {
        onPriceCalculated(cachedResult);
      }
      return;
    }

    setCalculating(true);
    setError(null);

    try {
      const response = await pricingService.calculatePrice(cityId, zoneId, quantity);
      if (response.success) {
        setResult(response.data);
        priceCalculationCache.set(cacheKey, response.data);
        triggerAnimation();

        if (onPriceCalculated) {
          onPriceCalculated(response.data);
        }
      }
    } catch (err) {
      setError('价格计算失败，请重试');
      console.error('Error calculating price:', err);
    } finally {
      setCalculating(false);
    }
  };

  // 触发价格动画
  const triggerAnimation = () => {
    setAnimateValue(true);
    setTimeout(() => setAnimateValue(false), 600);
  };

  // 批量比价
  const compareQuantities = async () => {
    setCalculating(true);
    setError(null);

    try {
      const quantities = [1, 2, 5, 10, 15, 20, 30];
      const comparisonResult = await pricingService.compareModePrices(cityId, zoneId, quantities);
      setComparison(comparisonResult);
    } catch (err) {
      setError('比较失败，请重试');
      console.error('Error comparing prices:', err);
    } finally {
      setCalculating(false);
    }
  };

  // 格式化价格
  const formatPrice = (price) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(price || 0).replace('CA', '');
  };

  // 计算单价
  const unitPrice = useMemo(() => {
    if (result?.finalPrice && quantity > 0) {
      return result.finalPrice / quantity;
    }
    return 0;
  }, [result, quantity]);

  // 获取价格变化趋势
  const getPriceTrend = () => {
    if (!comparison?.comparisons || comparison.comparisons.length < 2) return null;

    const current = comparison.comparisons.find(c => c.quantity === quantity);
    const previous = comparison.comparisons.find(c => c.quantity === quantity - 1);

    if (current && previous) {
      const change = current.finalPrice - previous.finalPrice;
      return {
        amount: change,
        percentage: ((change / previous.finalPrice) * 100).toFixed(1)
      };
    }
    return null;
  };

  // 快捷数量选择
  const handleQuickSelect = (value) => {
    setQuantity(value);
    setSelectedQuickOption(value);
  };

  // 数量增减
  const adjustQuantity = (delta) => {
    const newQuantity = Math.max(1, Math.min(999, quantity + delta));
    setQuantity(newQuantity);
    setSelectedQuickOption(null);
  };

  return (
    <div className={`${compactMode ? 'bg-gray-900/50' : 'bg-gray-900'} rounded-xl ${className}`}>
      {/* 头部 */}
      <div className={`${compactMode ? 'p-4' : 'p-6'} border-b border-gray-800`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className={`${compactMode ? 'text-lg' : 'text-xl'} font-bold text-white`}>
                价格计算器
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {cityId} - {zoneId}
              </p>
            </div>
          </div>
          {showComparison && (
            <button
              onClick={compareQuantities}
              className="px-3 py-1.5 text-sm bg-gray-800 text-cyan-400 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <BarChart3 className="w-4 h-4" />
              批量比价
            </button>
          )}
        </div>
      </div>

      {/* 数量输入区 */}
      <div className={`${compactMode ? 'p-4' : 'p-6'} space-y-4`}>
        {/* 数量输入框 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            托盘数量
          </label>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => adjustQuantity(-1)}
              className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <input
                type="number"
                min="1"
                max="999"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setQuantity(Math.max(1, Math.min(999, val)));
                  setSelectedQuickOption(null);
                }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-center text-lg font-bold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                板
              </span>
            </div>

            <button
              onClick={() => adjustQuantity(1)}
              className="p-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              disabled={quantity >= 999}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 快捷选择按钮 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {quickQuantities.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleQuickSelect(option.value)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${selectedQuickOption === option.value || quantity === option.value
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : option.highlight
                    ? 'bg-gray-700 text-cyan-400 hover:bg-gray-600'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              {option.label}
              {option.highlight && (
                <Zap className="w-3 h-3 inline-block ml-1" />
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* 计算结果 */}
      <AnimatePresence>
        {result && !calculating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`${compactMode ? 'p-4' : 'p-6'} border-t border-gray-800`}
          >
            {/* 价格显示 */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400 mb-1">总价</p>
                  <motion.p
                    className="text-3xl font-bold text-white"
                    animate={animateValue ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {formatPrice(result.finalPrice)}
                  </motion.p>
                  {result.basePrice !== result.finalPrice && (
                    <p className="text-sm text-gray-400 line-through mt-1">
                      原价：{formatPrice(result.basePrice)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">单价</p>
                  <p className="text-xl font-semibold text-cyan-400">
                    {formatPrice(unitPrice)}/板
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                      {result.mode}
                    </span>
                    {result.appliedRules?.length > 0 && (
                      <span className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded text-xs">
                        已优惠
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 价格明细（可展开） */}
            {result.breakdown && result.breakdown.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
                  价格明细
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2"
                    >
                      {result.breakdown.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Package className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-white">{item.description}</p>
                              {item.quantity && item.unitPrice && (
                                <p className="text-xs text-gray-400">
                                  {item.quantity} × {formatPrice(item.unitPrice)}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-white">
                            {formatPrice(item.amount)}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* 推荐建议 */}
            {showRecommendations && result.recommendations && result.recommendations.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg"
              >
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-400 mb-2">优惠建议</p>
                    {result.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm text-blue-300 mb-1">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        {rec.message}
                        {rec.potentialSaving && (
                          <span className="text-blue-400 font-medium ml-1">
                            (可节省 {formatPrice(rec.potentialSaving)})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 加载状态 */}
      {calculating && (
        <div className={`${compactMode ? 'p-8' : 'p-12'} text-center`}>
          <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin mx-auto mb-2" />
          <span className="text-gray-400 text-sm">计算中...</span>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-4">
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* 批量比价结果 */}
      {comparison && showComparison && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`${compactMode ? 'p-4' : 'p-6'} border-t border-gray-800`}
        >
          <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            批量价格对比
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-800">
                  <th className="text-left pb-2">数量</th>
                  <th className="text-right pb-2">总价</th>
                  <th className="text-right pb-2">单价</th>
                  <th className="text-center pb-2">模式</th>
                </tr>
              </thead>
              <tbody>
                {comparison.comparisons?.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors
                      ${item.quantity === quantity ? 'bg-cyan-500/10' : ''}
                    `}
                  >
                    <td className="py-2 text-white">
                      {item.quantity}板
                      {item.quantity === quantity && (
                        <span className="ml-2 text-xs text-cyan-400">当前</span>
                      )}
                    </td>
                    <td className="py-2 text-right text-white font-medium">
                      {formatPrice(item.finalPrice)}
                    </td>
                    <td className="py-2 text-right text-gray-400">
                      {formatPrice(item.finalPrice / item.quantity)}
                    </td>
                    <td className="py-2 text-center">
                      <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                        {item.mode}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 价格趋势 */}
          {getPriceTrend() && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
              <p className="text-xs text-gray-400">相比 {quantity - 1} 板</p>
              <p className="text-sm text-white mt-1">
                增加 {formatPrice(getPriceTrend().amount)}
                <span className="text-gray-400 ml-2">
                  (+{getPriceTrend().percentage}%)
                </span>
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedPriceCalculator;