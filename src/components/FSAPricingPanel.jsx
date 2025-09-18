/**
 * FSA价格查询面板组件（左侧固定）
 *
 * 功能：
 * - 固定在页面左侧显示
 * - 显示FSA所属区域和分组信息
 * - 展示板数定价表（优先显示分组价格，无分组价格则显示区域通用价格）
 * - 支持输入托盘数量进行价格测算
 * - 支持在面板打开时继续点击其他FSA
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
  CheckCircle
} from 'lucide-react';
import pricingService from '../services/pricingService';
import { cityStorageService } from '../utils/storage/cityStorage';
import { getRegionConfig, getFSAGroup } from '../utils/unifiedStorage';
import { apiGet } from '../utils/apiClient';

// 默认板数范围
const DEFAULT_SKID_RANGES = [
  { skidCount: 1, displayName: '1板', min: 1, max: 1 },
  { skidCount: 2, displayName: '2板', min: 2, max: 2 },
  { skidCount: 3, displayName: '3板', min: 3, max: 3 },
  { skidCount: 4, displayName: '4板', min: 4, max: 4 },
  { skidCount: 5, displayName: '5板', min: 5, max: 5 },
  { skidCount: 6, displayName: '6板', min: 6, max: 6 },
  { skidCount: 7, displayName: '7板', min: 7, max: 7 },
  { skidCount: 8, displayName: '8板', min: 8, max: 8 },
  { skidCount: 9, displayName: '9板', min: 9, max: 9 },
  { skidCount: 10, displayName: '10板', min: 10, max: 10 },
  { skidCount: 11, displayName: '11板', min: 11, max: 11 },
  { skidCount: 12, displayName: '12板', min: 12, max: 12 },
  { skidCount: 13, displayName: '13板', min: 13, max: 13 },
  { skidCount: 14, displayName: '14板', min: 14, max: 14 },
  { skidCount: 15, displayName: '15板', min: 15, max: 15 },
  { skidCount: 16, displayName: '16板', min: 16, max: 16 },
  { skidCount: '16+', displayName: '16+板', min: 17, max: 999 }
];

const FSAPricingPanel = ({
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
  const [pricingData, setPricingData] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [error, setError] = useState(null);

  // 加载区域配置和价格数据 - 修复了 try-catch-finally 结构
  useEffect(() => {
    if (!isOpen || !fsaCode) return;

    const loadPricingData = async () => {
      setLoading(true);
      setError(null);
      // 重置之前的数据，确保界面立即响应
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

        // 3. 获取板数定价数据
        let applicablePricing = null;

        // 首先检查分组是否有自定义价格
        if (group) {
          // 使用pricingService获取分组的自定义价格
          const groupPricing = await pricingService.getGroupSkidPricing(
            cityId || 'toronto',
            regionId,
            group.id
          );

          if (groupPricing && Object.keys(groupPricing).length > 0) {
            applicablePricing = {
              source: 'group',
              groupName: group.name,
              prices: groupPricing
            };
            console.log('使用分组自定义价格:', group.name, groupPricing);
          }
        }

        // 如果没有分组价格，直接使用本地存储
        // 注释掉API调用，因为后端端点尚未实现
        /*
        if (!applicablePricing) {
          try {
            // 获取区域的板数定价
            const pricingResponse = await apiGet(`/truck-delivery/zones/${regionId}/skid-pricing`);
            if (pricingResponse && pricingResponse.prices) {
              applicablePricing = {
                source: 'zone',
                zoneName: config.name,
                prices: pricingResponse.prices
              };
            }
          } catch (apiError) {
            console.log('从服务器获取价格失败，尝试本地存储');
          }
        }
        */

        // 如果还没有价格，从API获取
        if (!applicablePricing) {
          try {
            // 从后端API获取区域价格
            const response = await fetch(`/api/v1/truck-delivery/zones/${regionId}`);
            if (response.ok) {
              const data = await response.json();
              const zoneData = data.data;

              // 将价格数组转换为对象格式
              const pricesObj = {};
              if (zoneData.prices && Array.isArray(zoneData.prices)) {
                zoneData.prices.forEach(p => {
                  pricesObj[p.skid_count] = p.price;
                });
              }

              if (Object.keys(pricesObj).length > 0) {
                applicablePricing = {
                  source: 'zone',
                  zoneName: config.name,
                  prices: pricesObj
                };
              }
            }
          } catch (apiError) {
            console.error('获取API价格数据失败:', apiError);
          }
        }

        // 如果API获取失败，尝试从本地存储获取（作为后备）
        if (!applicablePricing) {
          const storedPricing = localStorage.getItem(`skid_pricing_${regionId}`);
          if (storedPricing) {
            const parsed = JSON.parse(storedPricing);
            applicablePricing = {
              source: 'zone',
              zoneName: config.name,
              prices: parsed
            };
          } else {
            // 如果都失败了，使用空价格（显示为暂无数据）
            const defaultPrices = {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
              6: 0,
              7: 0,
              8: 0,
              9: 0,
              10: 0,
              11: 0,
              12: 0,
              13: 0,
              14: 0,
              15: 0,
              16: 0,
              '16+': 0
            };
            applicablePricing = {
              source: 'zone',
              zoneName: config.name || '区域1',
              prices: defaultPrices
            };
          }
        }

        setPricingData(applicablePricing);

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
    if (!pricingData || !skidCount) {
      setCalculatedPrice(null);
      return;
    }

    const calculatePrice = () => {
      const prices = pricingData.prices;

      // 查找对应的价格区间
      for (const range of DEFAULT_SKID_RANGES) {
        const rangePrice = prices[range.skidCount] || prices[`${range.skidCount}板`];

        if (rangePrice && skidCount >= range.min && skidCount <= range.max) {
          setCalculatedPrice({
            basePrice: rangePrice,
            totalPrice: rangePrice,
            skidRange: range.displayName,
            source: pricingData.source,
            sourceName: pricingData.groupName || pricingData.zoneName
          });
          return;
        }
      }

      // 如果超过16板，使用16+的价格
      const extraPrice = prices['16+'] || prices['16+板'] || prices[17];
      if (extraPrice && skidCount > 16) {
        setCalculatedPrice({
          basePrice: extraPrice,
          totalPrice: extraPrice,
          skidRange: '16+板',
          source: pricingData.source,
          sourceName: pricingData.groupName || pricingData.zoneName
        });
      } else {
        setCalculatedPrice(null);
      }
    };

    calculatePrice();
  }, [skidCount, pricingData]);

  // 格式化价格显示
  const formatPrice = (price) => {
    if (typeof price !== 'number') return '未配置';
    return `$${price.toFixed(2)}`;
  };

  // 获取价格表数据
  const priceTableData = useMemo(() => {
    if (!pricingData) return [];

    return DEFAULT_SKID_RANGES.map(range => {
      const price = pricingData.prices[range.skidCount] ||
                   pricingData.prices[`${range.skidCount}板`] ||
                   0;

      return {
        range: range.displayName,
        skidCount: range.skidCount,
        price: price,
        isActive: price > 0,
        isCurrent: skidCount >= range.min && skidCount <= range.max
      };
    });
  }, [pricingData, skidCount]);

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
                  <p className="text-blue-100 text-sm mt-1">板数定价费率表</p>
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
                      <p className="text-white font-semibold text-sm">{regionConfig?.name || `区域 ${regionId}`}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {fsaCode} 所属区域
                      </p>
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-center gap-2 mb-1">
                        <Hash className="w-4 h-4 text-green-400" />
                        <span className="text-gray-400 text-xs">城市区域</span>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {fsaGroup ? fsaGroup.name : '未分组'}
                      </p>
                      {fsaGroup && (
                        <p className="text-gray-500 text-xs mt-1">
                          {fsaGroup.customPricing?.enabled ? '使用自定义价格' : '使用区域通用价格'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 价格来源提示 */}
                  {pricingData && (
                    <div className={`rounded-lg p-2 mb-4 flex items-center gap-2 text-xs ${
                      pricingData.source === 'group'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                    }`}>
                      <Info className="w-3 h-3" />
                      <span>
                        使用
                        <span className="font-semibold mx-1">
                          {pricingData.source === 'group' ? '分组自定义价格' : '区域通用价格'}
                        </span>
                        ({pricingData.groupName || pricingData.zoneName})
                      </span>
                    </div>
                  )}

                  {/* 价格表 */}
                  <div className="mb-4">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-yellow-400" />
                      板数价格表
                    </h3>
                    <div className="bg-gray-800/30 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 gap-px bg-gray-700/50">
                        {priceTableData.slice(0, 12).map((item, index) => (
                          <div
                            key={index}
                            className={`p-2 bg-gray-800 text-xs ${
                              item.isCurrent ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''
                            } ${!item.isActive ? 'opacity-50' : ''}`}
                          >
                            <div className="text-gray-400 text-xs">{item.range}</div>
                            <div className={`font-semibold ${
                              item.isCurrent ? 'text-blue-400' : 'text-white'
                            }`}>
                              {formatPrice(item.price)}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-px bg-gray-700/50 mt-px">
                        {priceTableData.slice(12).map((item, index) => (
                          <div
                            key={index + 12}
                            className={`p-2 bg-gray-800 text-xs ${
                              item.isCurrent ? 'ring-1 ring-blue-500 bg-blue-500/10' : ''
                            } ${!item.isActive ? 'opacity-50' : ''}`}
                          >
                            <div className="text-gray-400 text-xs">{item.range}</div>
                            <div className={`font-semibold ${
                              item.isCurrent ? 'text-blue-400' : 'text-white'
                            }`}>
                              {formatPrice(item.price)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                              const value = e.target.value;
                              // 允许输入框为空，方便重新输入
                              if (value === '') {
                                setSkidCount('');
                              } else {
                                const num = parseInt(value);
                                if (!isNaN(num) && num >= 1) {
                                  setSkidCount(num);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              // 失去焦点时，如果输入框为空，设置为1
                              if (e.target.value === '' || skidCount === '') {
                                setSkidCount(1);
                              }
                            }}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5
                                     text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                            placeholder="请输入托盘数"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const current = skidCount === '' ? 1 : skidCount;
                                setSkidCount(Math.max(1, current - 1));
                              }}
                              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <span className="text-white text-sm">-</span>
                            </button>
                            <button
                              onClick={() => {
                                const current = skidCount === '' ? 0 : skidCount;
                                setSkidCount(current + 1);
                              }}
                              className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              <span className="text-white text-sm">+</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 计算结果 */}
                      {calculatedPrice && (
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
                              <span className="text-gray-500">适用区间</span>
                              <span className="text-white font-medium">{calculatedPrice.skidRange}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">价格来源</span>
                              <span className="text-white font-medium">{calculatedPrice.sourceName}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">配送费用</span>
                                <span className="text-xl font-bold text-green-400">
                                  {formatPrice(calculatedPrice.totalPrice)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {!calculatedPrice && skidCount && !loading && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-yellow-400 text-xs">
                            <AlertCircle className="w-4 h-4" />
                            <span>该板数范围暂未配置价格</span>
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

export default FSAPricingPanel;