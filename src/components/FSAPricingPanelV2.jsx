/**
 * FSA价格查询面板组件V2（支持四种定价模式）
 *
 * 功能：
 * - 显示FSA所属区域和分组信息
 * - 支持四种定价模式展示
 * - 实时价格计算
 * - 显示配置来源（分组/区域/城市）
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Package,
  DollarSign,
  Calculator,
  TrendingUp,
  Info,
  Layers,
  ChevronRight,
  Hash,
  Truck,
  AlertCircle,
  CheckCircle,
  Zap
} from 'lucide-react';
import pricingServiceV2 from '../services/pricingServiceV2';
import { getRegionConfig, getFSAGroup } from '../utils/unifiedStorage';

const FSAPricingPanelV2 = ({
  isOpen,
  onClose,
  fsaCode,
  regionId,
  cityId = 'toronto',
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [loading, setLoading] = useState(true);
  const [skidCount, setSkidCount] = useState(1);
  const [regionConfig, setRegionConfig] = useState(null);
  const [fsaGroup, setFsaGroup] = useState(null);
  const [pricingConfig, setPricingConfig] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [error, setError] = useState(null);

  // 加载价格配置
  useEffect(() => {
    if (!isOpen || !fsaCode) return;

    const loadPricingData = async () => {
      setLoading(true);
      setError(null);
      setSkidCount(1);
      setCalculatedPrice(null);

      try {
        // 1. 获取区域配置
        const config = await getRegionConfig(regionId);
        setRegionConfig(config);

        if (!config) {
          throw new Error('无法获取区域配置');
        }

        // 2. 检查FSA是否属于某个分组
        const group = await getFSAGroup(regionId, fsaCode);
        setFsaGroup(group);

        // 3. 获取适用的价格配置（使用新的PricingServiceV2）
        const pricing = await pricingServiceV2.getFSAPricing(
          cityId,
          regionId,
          group?.id,
          fsaCode
        );

        if (pricing) {
          setPricingConfig(pricing);
          console.log('获取到价格配置:', pricing);
        } else {
          // 使用默认配置
          const defaultPricing = pricingServiceV2.getDefaultPricing(cityId);
          setPricingConfig(defaultPricing);
        }

      } catch (err) {
        console.error('加载价格数据失败:', err);
        setError(err.message || '加载价格数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadPricingData();
  }, [isOpen, fsaCode, regionId, cityId]);

  // 计算价格
  useEffect(() => {
    if (!pricingConfig || !skidCount || skidCount < 1) {
      setCalculatedPrice(null);
      return;
    }

    const result = pricingServiceV2.calculatePrice(pricingConfig, skidCount);
    setCalculatedPrice(result);
  }, [skidCount, pricingConfig]);

  // 获取配置级别显示信息
  const configLevelInfo = useMemo(() => {
    if (!pricingConfig) return null;
    return pricingServiceV2.getConfigLevelDisplay(pricingConfig);
  }, [pricingConfig]);

  // 获取定价模式显示名称
  const pricingModeDisplay = useMemo(() => {
    if (!pricingConfig) return '';
    return pricingServiceV2.getPricingModeDisplay(pricingConfig.pricing_mode);
  }, [pricingConfig]);

  // 渲染不同定价模式的价格展示
  const renderPricingDisplay = () => {
    if (!pricingConfig || !pricingConfig.pricing_data) return null;

    const { pricing_mode, pricing_data } = pricingConfig;

    switch (pricing_mode) {
      case 'skid':
        return renderSkidPricing(pricing_data);
      case 'first_cont':
        return renderFirstContPricing(pricing_data);
      case 'per_skid':
        return renderPerSkidPricing(pricing_data);
      case 'full_truck':
        return renderFullTruckPricing(pricing_data);
      default:
        return <div className="text-gray-400 text-sm">未知的定价模式</div>;
    }
  };

  // 板数定价展示
  const renderSkidPricing = (data) => {
    const prices = data.prices || {};
    const skidNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, '16+'];

    return (
      <div>
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4 text-blue-400" />
          板数价格表
        </h3>
        <div className="bg-gray-800/30 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 gap-px bg-gray-700/50">
            {skidNumbers.slice(0, 12).map((num) => {
              const price = prices[num] || prices[`${num}`] || 0;
              const isCurrent = skidCount === num || (num === '16+' && skidCount > 16);

              return (
                <div
                  key={num}
                  className={`p-2 bg-gray-800 text-xs ${
                    isCurrent ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''
                  }`}
                >
                  <div className="text-gray-400 text-xs">{num}板</div>
                  <div className={`font-semibold ${
                    isCurrent ? 'text-blue-400' : 'text-white'
                  }`}>
                    ${price.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-px bg-gray-700/50 mt-px">
            {skidNumbers.slice(12).map((num) => {
              const price = prices[num] || prices[`${num}`] || 0;
              const isCurrent = skidCount === num || (num === '16+' && skidCount > 16);

              return (
                <div
                  key={num}
                  className={`p-2 bg-gray-800 text-xs ${
                    isCurrent ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''
                  }`}
                >
                  <div className="text-gray-400 text-xs">{num}板</div>
                  <div className={`font-semibold ${
                    isCurrent ? 'text-blue-400' : 'text-white'
                  }`}>
                    ${price.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 首托+续托定价展示
  const renderFirstContPricing = (data) => {
    const firstSkid = data.first_skid || 0;
    const contSkid = data.cont_skid || 0;
    const maxSkids = data.max_skids || 16;

    return (
      <div>
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-green-400" />
          首托+续托定价
        </h3>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-gray-400 text-xs mb-1">首托价格</div>
              <div className="text-white font-semibold">${firstSkid.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">续托单价</div>
              <div className="text-white font-semibold">${contSkid.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">最大板数</div>
              <div className="text-white font-semibold">{maxSkids}板</div>
            </div>
          </div>

          {/* 价格示例 */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-400 mb-2">价格示例：</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">1板:</span>
                <span className="text-white">${firstSkid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">5板:</span>
                <span className="text-white">${(firstSkid + contSkid * 4).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">10板:</span>
                <span className="text-white">${(firstSkid + contSkid * 9).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 每板单价定价展示
  const renderPerSkidPricing = (data) => {
    const pricePerSkid = data.price_per_skid || 0;
    const minSkids = data.min_skids || 1;

    return (
      <div>
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
          <Calculator className="w-4 h-4 text-purple-400" />
          每板单价定价
        </h3>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400 text-xs mb-1">每板单价</div>
              <div className="text-white font-semibold">${pricePerSkid.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-gray-400 text-xs mb-1">最低起送</div>
              <div className="text-white font-semibold">{minSkids}板</div>
            </div>
          </div>

          {/* 提示信息 */}
          <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 text-purple-400 mt-0.5" />
              <div className="text-xs text-purple-300">
                价格 = 板数 × ${pricePerSkid.toFixed(2)}
                {minSkids > 1 && <div className="mt-1">（最低收费{minSkids}板）</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 整车定价展示
  const renderFullTruckPricing = (data) => {
    const truckPrice = data.truck_price || 0;
    const maxSkids = data.max_skids || 16;

    return (
      <div>
        <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
          <Truck className="w-4 h-4 text-orange-400" />
          整车定价
        </h3>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-orange-400">
              ${truckPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              固定整车价格
            </div>
            <div className="text-xs text-gray-500 mt-1">
              （最多装载{maxSkids}板）
            </div>
          </div>

          {/* 特点说明 */}
          <div className="mt-3 p-2 bg-orange-500/10 border border-orange-500/30 rounded">
            <div className="flex items-start gap-2">
              <Zap className="w-3 h-3 text-orange-400 mt-0.5" />
              <div className="text-xs text-orange-300">
                不论托盘数量，统一收取整车费用
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className={`fixed right-0 top-0 h-full ${isCollapsed ? 'w-12' : 'w-[400px]'}
                     bg-gradient-to-br from-gray-900 to-gray-800
                     border-l border-blue-500/30 z-[1000] overflow-hidden
                     shadow-2xl transition-all duration-300`}
        >
          {/* 折叠/展开按钮 */}
          <button
            onClick={onToggleCollapse}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full
                     w-6 h-16 bg-gray-800 hover:bg-gray-700 border-l border-t border-b
                     border-blue-500/30 rounded-l-lg transition-colors group z-10"
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white mx-auto" />
            </motion.div>
          </button>

          {/* 面板内容 */}
          <div className={`h-full flex flex-col ${isCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
            {/* 头部 */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 relative flex-shrink-0">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-2 rounded-lg bg-white/10 hover:bg-white/20
                         transition-colors group"
              >
                <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{fsaCode} 价格查询</h2>
                  <p className="text-blue-100 text-sm mt-1">{pricingModeDisplay}</p>
                </div>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">加载价格数据...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                </div>
              ) : (
                <>
                  {/* 区域和分组信息 */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-400 text-xs">所属区域</span>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {regionConfig?.name || `区域 ${regionId}`}
                      </p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400 text-xs">分组</span>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {fsaGroup ? fsaGroup.name : '未分组'}
                      </p>
                    </div>
                  </div>

                  {/* 价格配置来源 */}
                  {pricingConfig && configLevelInfo && (
                    <div className={`rounded-lg p-2 mb-4 flex items-center gap-2 text-xs
                                    ${configLevelInfo.bgColor} border ${configLevelInfo.borderColor}`}>
                      <Info className="w-3 h-3" />
                      <span className={configLevelInfo.color}>
                        使用{configLevelInfo.label}
                        {pricingConfig.name && ` - ${pricingConfig.name}`}
                      </span>
                    </div>
                  )}

                  {/* 价格展示 */}
                  <div className="mb-4">
                    {renderPricingDisplay()}
                  </div>

                  {/* 价格计算器 */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-3 border border-blue-500/30">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2 text-sm">
                      <Calculator className="w-4 h-4 text-purple-400" />
                      价格测算
                    </h3>

                    <div className="space-y-3">
                      {/* 托盘数输入 */}
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">输入托盘数量</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="999"
                            value={skidCount}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                setSkidCount('');
                              } else {
                                const num = parseInt(val);
                                if (!isNaN(num) && num >= 0) {
                                  setSkidCount(num);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '' || parseInt(e.target.value) < 1) {
                                setSkidCount(1);
                              }
                            }}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5
                                     text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="请输入托盘数"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSkidCount(Math.max(1, skidCount - 1))}
                              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <span className="text-white text-sm">-</span>
                            </button>
                            <button
                              onClick={() => setSkidCount(skidCount + 1)}
                              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <span className="text-white text-sm">+</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 计算结果 */}
                      {calculatedPrice && !calculatedPrice.error && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-xs">计算结果</span>
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-500">托盘数量</span>
                              <span className="text-white font-medium">{skidCount} 板</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">定价模式</span>
                              <span className="text-white font-medium">{pricingModeDisplay}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">计算公式</span>
                              <span className="text-white font-medium text-right">
                                {calculatedPrice.breakdown}
                              </span>
                            </div>
                            {calculatedPrice.warning && (
                              <div className="pt-1">
                                <span className="text-yellow-400 text-xs">
                                  ⚠️ {calculatedPrice.warning}
                                </span>
                              </div>
                            )}
                            <div className="pt-2 border-t border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">配送费用</span>
                                <span className="text-xl font-bold text-green-400">
                                  ${calculatedPrice.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {calculatedPrice && calculatedPrice.error && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-yellow-400 text-xs">
                            <AlertCircle className="w-4 h-4" />
                            <span>{calculatedPrice.breakdown}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FSAPricingPanelV2;